import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("files").select("*").order("created_at", { ascending: false });
    if (!error && data) setFiles(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchFiles(); }, [fetchFiles]);

  // Re-fetch when returning from bfcache (tab switch, phone sleep, back-forward nav)
  useEffect(() => {
    const handleResume = () => { void fetchFiles(); };
    window.addEventListener("app-resume", handleResume);
    return () => window.removeEventListener("app-resume", handleResume);
  }, [fetchFiles]);

  // Loading state safety net - prevent stuck loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 15000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); void fetchFiles(); }
  };

  const togglePublish = async (f: FileItem) => {
    const { error } = await supabase.from("files").update({ published: !f.published }).eq("id", f.id);
    if (error) toast.error("Failed to update");
    else void fetchFiles();
  };

  const getMenuItems = (f: FileItem): MenuItem[] => [
    { id: 1, label: "Edit", icon: PenLine },
    { id: 2, label: f.published ? "Unpublish" : "Publish", icon: f.published ? EyeOff : Eye },
    { id: 3, label: "Delete", icon: Trash2, variant: "destructive" },
  ];

  const handleMenuSelect = (item: MenuItem, f: FileItem) => {
    if (item.label === "Edit") navigate(`/admin/files/edit/${f.id}`);
    else if (item.label === "Publish" || item.label === "Unpublish") void togglePublish(f);
    else if (item.label === "Delete") void handleDelete(f.id, f.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        </div>
        <Link to="/admin/files/new">
          <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
            <Plus size={14} /> Add file
          </MagneticButton>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No files yet.</p>
          <Link to="/admin/files/new">
            <MagneticButton size="sm" className="mt-4" strength={0.3} radius={100}>
              Add your first file
            </MagneticButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <RadialMenu
              key={f.id}
              menuItems={getMenuItems(f)}
              onSelect={(item) => handleMenuSelect(item, f)}
            >
              <div className="flex items-stretch gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem] cursor-context-menu">
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MarqueeText text={f.name} className="font-semibold text-sm flex-1 min-w-0" />
                    <Badge variant={f.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                      {f.published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {f.category && <span className="truncate max-w-[100px]">{f.category}</span>}
                    {f.category && f.file_size && <span className="text-muted-foreground/40 shrink-0">·</span>}
                    {f.file_size && <span className="shrink-0">{f.file_size}</span>}
                  </div>
                  {f.file_type && (
                    <div>
                      <span className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground uppercase">{f.file_type}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center shrink-0">
                  <PublishToggle published={f.published} onChange={() => togglePublish(f)} />
                </div>
              </div>
            </RadialMenu>
          ))}
        </div>
      )}
    </div>
  );
}

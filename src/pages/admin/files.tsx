import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("files").select("*").order("created_at", { ascending: false });
    if (!error && data) setFiles(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchFiles(); }, [fetchFiles]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        </div>
        <Link to="/admin/files/new">
          <Button size="sm" className="gap-1.5"><Plus size={14} /> Add file</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No files yet.</p>
          <Link to="/admin/files/new"><Button size="sm" className="mt-4">Add your first file</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-stretch gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem]">

              {/* LEFT */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                {/* Line 1: Name + badge */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MarqueeText text={f.name} className="font-semibold text-sm flex-1 min-w-0" />
                  <Badge variant={f.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {f.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                {/* Line 2: Category · Size */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {f.category && <span className="truncate max-w-[100px]">{f.category}</span>}
                  {f.category && f.file_size && <span className="text-muted-foreground/40 shrink-0">·</span>}
                  {f.file_size && <span className="shrink-0">{f.file_size}</span>}
                </div>
                {/* Line 3: File type */}
                {f.file_type && (
                  <div>
                    <span className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground uppercase">{f.file_type}</span>
                  </div>
                )}
              </div>

              {/* RIGHT: vertically centered */}
              <div className="flex flex-col justify-center shrink-0">
                <div className="flex items-center gap-0.5">
                  <PublishToggle published={f.published} onChange={() => togglePublish(f)} />
                  <Link to={`/admin/files/edit/${f.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation"><PenLine size={13} /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive touch-manipulation"
                    onClick={() => handleDelete(f.id, f.name)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

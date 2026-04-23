import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, PenLine, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { PublishToggle } from "@/components/ui/publish-toggle";

export default function AdminFilesPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFiles(data);
    setLoading(false);
  };

  useEffect(() => { void fetchFiles(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); void fetchFiles(); }
  };

  const togglePublish = async (f: FileItem) => {
    await supabase.from("files").update({ published: !f.published }).eq("id", f.id);
    void fetchFiles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        </div>
        <Link to="/admin/files/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Add file
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No files yet.</p>
          <Link to="/admin/files/new">
            <Button size="sm" className="mt-4">Add your first file</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem]">
              <div className="flex-1 min-w-0 space-y-0.5">
                {/* Line 1: Name + Live/Draft */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm truncate max-w-[180px]">{f.name}</p>
                  <Badge variant={f.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {f.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                {/* Line 2: Category · Size */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
                  {f.category && <span className="truncate max-w-[100px]">{f.category}</span>}
                  {f.category && f.file_size && <span className="text-muted-foreground/40">·</span>}
                  {f.file_size && <span>{f.file_size}</span>}
                </div>
                {/* Line 3: File type */}
                {f.file_type && (
                  <div className="pt-0.5">
                    <span className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground uppercase">
                      {f.file_type}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 items-center shrink-0 pt-0.5">
                <PublishToggle published={f.published} onChange={() => togglePublish(f)} />
                <Link to={`/admin/files/edit/${f.id}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                    <PenLine size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive touch-manipulation"
                  onClick={() => handleDelete(f.id, f.name)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

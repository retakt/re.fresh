import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { useBackNav } from "@/hooks/use-back-nav";
import { PublishToggle } from "@/components/ui/publish-toggle";

export default function AdminTutorialsPage() {
  const navigate = useNavigate();
  const goBack = useBackNav('/admin');
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTutorials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTutorials(data as Tutorial[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchTutorials();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("tutorials").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted.");
      void fetchTutorials();
    }
  };

  const togglePublish = async (tutorial: Tutorial) => {
    await supabase
      .from("tutorials")
      .update({ published: !tutorial.published })
      .eq("id", tutorial.id);
    void fetchTutorials();
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
          <h1 className="text-2xl font-bold tracking-tight">Tutorials</h1>
        </div>
        <Link to="/admin/tutorials/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> New tutorial
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tutorials yet.</p>
          <Link to="/admin/tutorials/new">
            <Button size="sm" className="mt-4">Create your first tutorial</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem]">
              <div className="flex-1 min-w-0 space-y-0.5">
                {/* Line 1: Title + Live/Draft */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm truncate max-w-[180px]">{tutorial.title}</p>
                  <Badge variant={tutorial.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                    {tutorial.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                {/* Line 2: Difficulty · Category */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
                  {tutorial.difficulty && <span className="capitalize">{tutorial.difficulty}</span>}
                  {tutorial.difficulty && tutorial.category && <span className="text-muted-foreground/40">·</span>}
                  {tutorial.category && <span className="truncate max-w-[120px]">{tutorial.category}</span>}
                </div>
                {/* Line 3: Tags */}
                {(tutorial.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(tutorial.tags ?? []).slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 items-center shrink-0 pt-0.5">
                <PublishToggle published={tutorial.published} onChange={() => togglePublish(tutorial)} />
                <Link to={`/admin/tutorials/edit/${tutorial.id}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                    <PenLine size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive touch-manipulation"
                  onClick={() => handleDelete(tutorial.id, tutorial.title)}>
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

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenLine, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { supabase } from "@/lib/supabase";
import type { Tutorial } from "@/lib/supabase";
import { PublishToggle } from "@/components/ui/publish-toggle";
import { MarqueeText } from "@/components/ui/marquee-text";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTutorials = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials").select("*").order("created_at", { ascending: false });
    if (!error && data) setTutorials(data as Tutorial[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTutorials(); }, [fetchTutorials]);

  // Re-fetch when returning from bfcache (tab switch, phone sleep, back-forward nav)
  useEffect(() => {
    const handleResume = () => { void fetchTutorials(); };
    window.addEventListener("app-resume", handleResume);
    return () => window.removeEventListener("app-resume", handleResume);
  }, [fetchTutorials]);

  // Loading state safety net - prevent stuck loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 15000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("tutorials").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); void fetchTutorials(); }
  };

  const togglePublish = async (tutorial: Tutorial) => {
    const { error } = await supabase.from("tutorials").update({ published: !tutorial.published }).eq("id", tutorial.id);
    if (error) toast.error("Failed to update");
    else void fetchTutorials();
  };

  const getMenuItems = (tutorial: Tutorial): MenuItem[] => [
    { id: 1, label: "Edit", icon: PenLine },
    { id: 2, label: tutorial.published ? "Unpublish" : "Publish", icon: tutorial.published ? EyeOff : Eye },
    { id: 3, label: "Delete", icon: Trash2, variant: "destructive" },
  ];

  const handleMenuSelect = (item: MenuItem, tutorial: Tutorial) => {
    if (item.label === "Edit") navigate(`/admin/tutorials/edit/${tutorial.id}`);
    else if (item.label === "Publish" || item.label === "Unpublish") void togglePublish(tutorial);
    else if (item.label === "Delete") void handleDelete(tutorial.id, tutorial.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutorials</h1>
        </div>
        <Link to="/admin/tutorials/new">
          <MagneticButton size="sm" className="gap-1.5" strength={0.3} radius={130}>
            <Plus size={14} /> New tutorial
          </MagneticButton>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-[4.5rem] rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tutorials yet.</p>
          <Link to="/admin/tutorials/new">
            <MagneticButton size="sm" className="mt-4" strength={0.3} radius={100}>
              Create your first tutorial
            </MagneticButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tutorials.map((tutorial) => (
            <RadialMenu
              key={tutorial.id}
              menuItems={getMenuItems(tutorial)}
              onSelect={(item) => handleMenuSelect(item, tutorial)}
            >
              <div className="flex items-stretch gap-3 rounded-xl border bg-card px-4 py-3 min-h-[4.5rem] cursor-context-menu">
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MarqueeText text={tutorial.title} className="font-semibold text-sm flex-1 min-w-0" />
                    <Badge variant={tutorial.published ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 shrink-0">
                      {tutorial.published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {tutorial.difficulty && <span className="capitalize shrink-0">{tutorial.difficulty}</span>}
                    {tutorial.difficulty && tutorial.category && <span className="text-muted-foreground/40 shrink-0">·</span>}
                    {tutorial.category && <span className="truncate max-w-[120px]">{tutorial.category}</span>}
                  </div>
                  {(tutorial.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(tutorial.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[9px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center shrink-0">
                  <PublishToggle published={tutorial.published} onChange={() => togglePublish(tutorial)} />
                </div>
              </div>
            </RadialMenu>
          ))}
        </div>
      )}
    </div>
  );
}

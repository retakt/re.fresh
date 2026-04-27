import { useState, useEffect, useCallback } from "react";
import { motion, LayoutGroup } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Plus, Trash2, Check, X, Quote, PenLine } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import { DEFAULT_QUOTES } from "@/lib/quotes";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";
import MagneticButton from "@/components/ui/smoothui/magnetic-button";

const HIDDEN_DEFAULTS_KEY = "hidden-default-quotes";

function getHiddenDefaults(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_DEFAULTS_KEY) ?? "[]")); }
  catch { return new Set(); }
}

function hideDefault(id: string) {
  const set = getHiddenDefaults();
  set.add(id);
  localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify([...set]));
}

type QuoteRow = { id: string; text: string; author: string; isDb: boolean };

export default function AdminQuotesPage() {
  const [dbQuotes, setDbQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [hiddenDefaults, setHiddenDefaults] = useState<Set<string>>(getHiddenDefaults);

  const fetchDbQuotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes").select("id, text, author").order("created_at", { ascending: false });
    if (error) setTableExists(false);
    else { setDbQuotes((data || []).map((q) => ({ ...q, isDb: true }))); setTableExists(true); }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchDbQuotes(); }, [fetchDbQuotes]);

  const openAdd = () => { setEditingId(null); setText(""); setAuthor(""); setShowForm(true); };
  const openEdit = (q: QuoteRow) => { setEditingId(q.isDb ? q.id : null); setText(q.text); setAuthor(q.author); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setText(""); setAuthor(""); };

  const handleSave = async () => {
    if (!text.trim() || !author.trim()) { toast.error("Both fields required."); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("quotes").update({ text: text.trim(), author: author.trim() }).eq("id", editingId);
      if (error) toast.error("Failed to update.");
      else { toast.success("Updated."); closeForm(); void fetchDbQuotes(); }
    } else {
      const { error } = await supabase.from("quotes").insert([{ text: text.trim(), author: author.trim() }]);
      if (error) toast.error("Failed to add.");
      else { toast.success("Quote added."); closeForm(); void fetchDbQuotes(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); void fetchDbQuotes(); }
  };

  const handleHideDefault = (id: string) => {
    if (!confirm("Hide this quote from rotation?")) return;
    hideDefault(id);
    setHiddenDefaults(getHiddenDefaults());
    toast.success("Hidden from rotation.");
  };

  const getMenuItems = (_q: QuoteRow): MenuItem[] => [
    { id: 1, label: "Edit", icon: PenLine },
    { id: 2, label: "Delete", icon: Trash2, variant: "destructive" },
  ];

  const handleMenuSelect = (item: MenuItem, q: QuoteRow) => {
    if (item.label === "Edit") openEdit(q);
    else if (item.label === "Delete") {
      if (q.isDb) void handleDelete(q.id);
      else handleHideDefault(q.id);
    }
  };

  const defaultRows = DEFAULT_QUOTES.filter((q) => !hiddenDefaults.has(q.id)).map((q) => ({ ...q, isDb: false }));
  const hiddenRows = DEFAULT_QUOTES.filter((q) => hiddenDefaults.has(q.id)).map((q) => ({ ...q, isDb: false }));
  const allQuotes = [...dbQuotes, ...defaultRows];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Music Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">{allQuotes.length} quotes · changes daily</p>
        </div>
        {!showForm && tableExists && (
          <MagneticButton size="sm" className="gap-1.5" onClick={openAdd} strength={0.3} radius={100}>
            <Plus size={14} /> Add quote
          </MagneticButton>
        )}
      </div>

      {!tableExists && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Quotes table not found</p>
          <pre className="text-xs bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 overflow-x-auto text-amber-800 dark:text-amber-300">{`create table quotes (\n  id uuid default gen_random_uuid() primary key,\n  text text not null,\n  author text not null,\n  created_at timestamptz default now()\n);`}</pre>
          <Button size="sm" variant="outline" onClick={fetchDbQuotes}>Retry</Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{editingId ? "Edit quote" : "New quote"}</h2>
            <button type="button" onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><X size={14} /></button>
          </div>
          <div className="space-y-1.5">
            <Label>Quote *</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter the quote text..." rows={3} className="resize-none" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Author *</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Ludwig van Beethoven" onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <MagneticButton size="sm" onClick={handleSave} disabled={saving} className="gap-1.5" strength={0.3} radius={100}>
            <Check size={13} /> {saving ? "Saving..." : editingId ? "Save changes" : "Add quote"}
          </MagneticButton>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl border bg-card animate-pulse" />)}</div>
      ) : (
        <LayoutGroup>
          <div className="space-y-1.5">
            {allQuotes.map((q) => (
              <motion.div key={`${q.isDb ? "db" : "def"}-${q.id}`} layout transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <RadialMenu menuItems={getMenuItems(q)} onSelect={(item) => handleMenuSelect(item, q)} size={180}>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-border/40 p-2 cursor-context-menu group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="rounded-lg bg-background p-2 shrink-0">
                        <Quote className="size-4 text-neutral-500 dark:text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">— {q.author}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {q.text.length > 72 ? q.text.slice(0, 72) + "…" : q.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </RadialMenu>
              </motion.div>
            ))}

            {hiddenRows.length > 0 && (
              <>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-1 pt-3">Hidden ({hiddenRows.length})</p>
                {hiddenRows.map((q) => (
                  <div key={`hidden-${q.id}`} className="flex items-center gap-3 rounded-xl border border-dashed bg-card/50 px-4 py-3 opacity-50">
                    <Quote size={12} className="text-muted-foreground/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-through truncate">{q.text}</p>
                      <p className="text-xs text-muted-foreground/60">— {q.author}</p>
                    </div>
                    <button onClick={() => { const set = getHiddenDefaults(); set.delete(q.id); localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify([...set])); setHiddenDefaults(getHiddenDefaults()); }}
                      className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors shrink-0" title="Restore">
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}

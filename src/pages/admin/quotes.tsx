import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Plus, Trash2, Check, X, Quote, PenLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DEFAULT_QUOTES } from "@/lib/quotes";

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

function restoreDefault(id: string) {
  const set = getHiddenDefaults();
  set.delete(id);
  localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify([...set]));
}

type QuoteRow = {
  id: string;
  text: string;
  author: string;
  isDb: boolean; // true = from DB (editable/deletable), false = built-in default
};

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
      .from("quotes")
      .select("id, text, author")
      .order("created_at", { ascending: false });

    if (error) {
      setTableExists(false);
    } else {
      setDbQuotes((data || []).map((q) => ({ ...q, isDb: true })));
      setTableExists(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchDbQuotes(); }, [fetchDbQuotes]);

  const openAdd = () => {
    setEditingId(null);
    setText("");
    setAuthor("");
    setShowForm(true);
  };

  const openEdit = (q: QuoteRow) => {
    // DB quotes: edit in place. Default quotes: pre-fill and save as new DB quote
    setEditingId(q.isDb ? q.id : null);
    setText(q.text);
    setAuthor(q.author);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setText("");
    setAuthor("");
  };

  const handleSave = async () => {
    if (!text.trim() || !author.trim()) {
      toast.error("Both quote and author are required.");
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("quotes")
        .update({ text: text.trim(), author: author.trim() })
        .eq("id", editingId);
      if (error) toast.error("Failed to update.");
      else { toast.success("Updated."); closeForm(); void fetchDbQuotes(); }
    } else {
      const { error } = await supabase
        .from("quotes")
        .insert([{ text: text.trim(), author: author.trim() }]);
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
    if (!confirm("Hide this default quote from the rotation?")) return;
    hideDefault(id);
    setHiddenDefaults(getHiddenDefaults());
    toast.success("Hidden from rotation.");
  };

  const handleRestoreDefault = (id: string) => {
    restoreDefault(id);
    setHiddenDefaults(getHiddenDefaults());
    toast.success("Restored to rotation.");
  };

  // One flat list: DB quotes first, then visible built-in defaults
  const defaultRows: QuoteRow[] = DEFAULT_QUOTES.filter((q) => !hiddenDefaults.has(q.id)).map((q) => ({ ...q, isDb: false }));
  const hiddenRows: QuoteRow[] = DEFAULT_QUOTES.filter((q) => hiddenDefaults.has(q.id)).map((q) => ({ ...q, isDb: false }));
  const allQuotes = [...dbQuotes, ...defaultRows];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Music Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allQuotes.length} quotes · rotates every 20 min
          </p>
        </div>
        {!showForm && tableExists && (
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus size={14} /> Add quote
          </Button>
        )}
      </div>

      {!tableExists && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Quotes table not found</p>
          <pre className="text-xs bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 overflow-x-auto text-amber-800 dark:text-amber-300">
{`create table quotes (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  author text not null,
  created_at timestamptz default now()
);`}
          </pre>
          <Button size="sm" variant="outline" onClick={fetchDbQuotes}>Retry</Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{editingId ? "Edit quote" : "New quote"}</h2>
            <button type="button" onClick={closeForm}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            <Label>Quote *</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Enter the quote text..." rows={3} className="resize-none" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Author *</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Ludwig van Beethoven"
              onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Check size={13} /> {saving ? "Saving..." : editingId ? "Save changes" : "Add quote"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl border bg-card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          {allQuotes.map((q) => (
            <div key={`${q.isDb ? "db" : "def"}-${q.id}`}
              className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-all">
              <Quote size={12} className="text-muted-foreground/40 shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-foreground">{q.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">— {q.author}</p>
              </div>
              {/* Actions — always visible on mobile, hover-reveal on desktop */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => openEdit(q)}
                  className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary active:bg-secondary transition-colors touch-manipulation"
                  style={{ minWidth: 32, minHeight: 32 }}
                  title="Edit">
                  <PenLine size={14} />
                </button>
                {q.isDb ? (
                  <button onClick={() => handleDelete(q.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 active:bg-red-500/10 transition-colors touch-manipulation"
                    style={{ minWidth: 32, minHeight: 32 }}
                    title="Delete">
                    <Trash2 size={14} className="text-red-500/70" />
                  </button>
                ) : (
                  <button onClick={() => handleHideDefault(q.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 active:bg-red-500/10 transition-colors touch-manipulation"
                    style={{ minWidth: 32, minHeight: 32 }}
                    title="Hide from rotation">
                    <Trash2 size={14} className="text-red-500/70" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Hidden defaults — show at bottom with restore option */}
          {hiddenRows.length > 0 && (
            <>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-1 pt-3">
                Hidden ({hiddenRows.length}) — not in rotation
              </p>
              {hiddenRows.map((q) => (
                <div key={`hidden-${q.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-dashed bg-card/50 px-4 py-3 opacity-50 hover:opacity-80 transition-all">
                  <Quote size={12} className="text-muted-foreground/30 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed text-muted-foreground line-through">{q.text}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">— {q.author}</p>
                  </div>
                  <button onClick={() => handleRestoreDefault(q.id)}
                    className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-secondary active:bg-secondary transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 touch-manipulation"
                    style={{ minWidth: 32, minHeight: 32 }}
                    title="Restore to rotation">
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Plus, Trash2, Check, X, Quote, PenLine, Pin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DEFAULT_QUOTES } from "@/lib/quotes";
import { RadialMenu } from "@/components/ui/radial-menu";
import type { MenuItem } from "@/components/ui/radial-menu";

// ── Pinned quote persistence ──────────────────────────────────────────────────
const PINNED_QUOTE_KEY = "pinned-quote-id";

function getPinnedQuoteId(): string | null {
  try { return localStorage.getItem(PINNED_QUOTE_KEY); }
  catch { return null; }
}

function setPinnedQuoteId(id: string | null) {
  try {
    if (id === null) localStorage.removeItem(PINNED_QUOTE_KEY);
    else localStorage.setItem(PINNED_QUOTE_KEY, id);
  } catch {}
}

// ── Hidden defaults (existing logic) ─────────────────────────────────────────
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

type QuoteRow = {
  id: string;
  text: string;
  author: string;
  isDb: boolean;
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
  // Track which quote is pinned — synced with localStorage
  const [pinnedId, setPinnedId] = useState<string | null>(getPinnedQuoteId);

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
    else {
      // If deleted quote was pinned, unpin it
      if (pinnedId === id) {
        setPinnedId(null);
        setPinnedQuoteId(null);
      }
      toast.success("Deleted.");
      void fetchDbQuotes();
    }
  };

  const handleHideDefault = (id: string) => {
    if (!confirm("Hide this default quote from the rotation?")) return;
    hideDefault(id);
    setHiddenDefaults(getHiddenDefaults());
    if (pinnedId === id) {
      setPinnedId(null);
      setPinnedQuoteId(null);
    }
    toast.success("Hidden from rotation.");
  };

  // ── Pin logic — max 1 pinned at a time ────────────────────────────────────
  const handleTogglePin = (id: string) => {
    if (pinnedId === id) {
      // Unpin — drop back to list
      setPinnedId(null);
      setPinnedQuoteId(null);
      toast.success("Quote unpinned");
    } else {
      // Pin this one — replaces any existing pin
      setPinnedId(id);
      setPinnedQuoteId(id);
      toast.success("Quote pinned to home");
    }
  };

  // ── Build flat quote list ─────────────────────────────────────────────────
  const defaultRows: QuoteRow[] = DEFAULT_QUOTES
    .filter((q) => !hiddenDefaults.has(q.id))
    .map((q) => ({ ...q, isDb: false }));
  const allQuotes = [...dbQuotes, ...defaultRows];

  // ── Radial menu items per quote ───────────────────────────────────────────
  const getMenuItems = (q: QuoteRow): MenuItem[] => [
    { id: 1, label: "Edit", icon: PenLine },
    { id: 2, label: "Delete", icon: Trash2, variant: "destructive" },
  ];

  const handleMenuSelect = (item: MenuItem, q: QuoteRow) => {
    if (item.label === "Edit") openEdit(q);
    else if (item.label === "Delete") {
      if (q.isDb) void handleDelete(q.id);
      else { handleHideDefault(q.id); }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Music Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allQuotes.length} quotes · rotates every 20 min
            {pinnedId && <span className="ml-2 text-primary font-medium">· 1 pinned</span>}
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
        // PinList handles the animation — we intercept clicks via onItemClick
        // by wrapping each item row in a RadialMenu for Edit/Delete
        // and using the PinList's built-in onClick for pin toggling.
        // Since PinList manages its own internal state, we sync via key prop
        // when pinnedId changes externally.
        <div className="space-y-3">
          {/* Render our own animated list using PinList's layout primitives */}
          {allQuotes.length > 0 && (
            <QuotePinList
              quotes={allQuotes}
              pinnedId={pinnedId}
              onTogglePin={handleTogglePin}
              onMenuSelect={handleMenuSelect}
              getMenuItems={getMenuItems}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Separate component so we can use motion layout cleanly ────────────────────
function QuotePinList({
  quotes,
  pinnedId,
  onTogglePin,
  onMenuSelect,
  getMenuItems,
}: {
  quotes: QuoteRow[];
  pinnedId: string | null;
  onTogglePin: (id: string) => void;
  onMenuSelect: (item: MenuItem, q: QuoteRow) => void;
  getMenuItems: (q: QuoteRow) => MenuItem[];
}) {
  const pinned = quotes.filter((q) => q.id === pinnedId);
  const unpinned = quotes.filter((q) => q.id !== pinnedId);

  const springTransition = { stiffness: 320, damping: 20, mass: 0.8, type: "spring" as const };

  const renderRow = (q: QuoteRow, isPinned: boolean) => (
    <motion.div
      key={q.id}
      layoutId={`quote-${q.id}`}
      transition={springTransition}
    >
      <RadialMenu
        menuItems={getMenuItems(q)}
        onSelect={(item) => onMenuSelect(item, q)}
        size={180}
      >
        <div
          onClick={() => onTogglePin(q.id)}
          className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-200 dark:bg-neutral-800 p-2 cursor-pointer group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg bg-background p-2 shrink-0">
              <Quote className="size-5 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">— {q.author}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium line-clamp-1">
                {q.text.length > 72 ? q.text.slice(0, 72) + "…" : q.text}
              </div>
            </div>
          </div>
          <div className={`flex items-center justify-center size-8 rounded-full shrink-0 transition-all
            ${isPinned
              ? "bg-neutral-400 dark:bg-neutral-600"
              : "bg-neutral-400 dark:bg-neutral-600 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Pin className={`size-4 text-white ${isPinned ? "fill-white" : ""}`} />
          </div>
        </div>
      </RadialMenu>
    </motion.div>
  );

  return (
    <LayoutGroup>
      <div className="space-y-10">
        {/* Pinned section */}
        <div className="space-y-3 relative z-10">
          <AnimatePresence>
            {pinned.length > 0 && (
              <motion.p
                layout
                key="pinned-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm"
              >
                Pinned
              </motion.p>
            )}
          </AnimatePresence>
          {pinned.map((q) => renderRow(q, true))}
        </div>

        {/* All quotes section */}
        <div className="space-y-3 relative z-10">
          <AnimatePresence>
            {unpinned.length > 0 && (
              <motion.p
                layout
                key="all-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm"
              >
                All Quotes
              </motion.p>
            )}
          </AnimatePresence>
          {unpinned.map((q) => renderRow(q, false))}
        </div>
      </div>
    </LayoutGroup>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { ArrowLeft, Plus, Trash2, Check, X, Quote } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type QuoteRow = {
  id: string;
  text: string;
  author: string;
  created_at: string;
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setTableExists(false);
    } else {
      setQuotes(data || []);
      setTableExists(true);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!text.trim() || !author.trim()) {
      toast.error("Both quote and author are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("quotes")
      .insert([{ text: text.trim(), author: author.trim() }]);

    if (error) {
      toast.error("Failed to add quote. Make sure the quotes table exists.");
    } else {
      toast.success("Quote added!");
      setText("");
      setAuthor("");
      setShowForm(false);
      fetchQuotes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted."); fetchQuotes(); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Admin
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Music Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rotates every 90 min on the home page
          </p>
        </div>
        {!showForm && tableExists && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} /> Add quote
          </Button>
        )}
      </div>

      {/* Table not found notice */}
      {!tableExists && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Quotes table not found
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Run this SQL in your Supabase dashboard:
          </p>
          <pre className="text-xs bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 overflow-x-auto text-amber-800 dark:text-amber-300">
{`create table quotes (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  author text not null,
  created_at timestamptz default now()
);`}
          </pre>
          <Button size="sm" variant="outline" onClick={fetchQuotes} className="mt-1">
            Retry
          </Button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">New quote</h2>

          <div className="space-y-1.5">
            <Label>Quote *</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the quote text..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Author *</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Ludwig van Beethoven"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving}
              className="gap-1.5"
            >
              <Check size={13} />
              {saving ? "Saving..." : "Add quote"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setText(""); setAuthor(""); }}
              className="gap-1.5"
            >
              <X size={13} /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Quotes list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : quotes.length === 0 && tableExists ? (
        <div className="rounded-xl border bg-card p-8 text-center space-y-3">
          <Quote size={24} className="text-muted-foreground mx-auto opacity-40" />
          <p className="text-sm text-muted-foreground">
            No custom quotes yet. Default quotes are being used.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus size={13} /> Add your first quote
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 hover:shadow-sm transition-all"
            >
              <Quote
                size={13}
                className="text-muted-foreground/40 shrink-0 mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-foreground">
                  {q.text}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — {q.author}
                </p>
              </div>
              <button
                onClick={() => handleDelete(q.id)}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      {tableExists && quotes.length > 0 && (
        <p className="text-xs text-muted-foreground px-0.5">
          {quotes.length} custom quote{quotes.length !== 1 ? "s" : ""} · rotates every 90 minutes
        </p>
      )}
    </div>
  );
}
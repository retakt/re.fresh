import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Check, X, Trash2, Mail, Clock, UserCheck, UserX } from "lucide-react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import { invokeAdminFunction } from "@/lib/admin";

type AccessRequest = {
  id: string;
  email: string;
  username: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUS_STYLES = {
  pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-300",
} as const;

const STATUS_ICONS = {
  pending:  Clock,
  approved: UserCheck,
  rejected: UserX,
} as const;

export default function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = filter === "all" ? await query : await query.eq("status", filter);

    if (!error && data) setRequests(data as AccessRequest[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: string, email: string) => {
    setSavingId(id);
    const result = await invokeAdminFunction("approve-access-request", { requestId: id });
    if (!result.ok) {
      toast.error(result.error || "Failed to approve request");
    } else {
      toast.success(`Invite sent to ${email} ✓`);
      void fetchRequests();
    }
    setSavingId(null);
  };

  const handleReject = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase
      .from("access_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) toast.error("Failed to reject request");
    else { toast.success("Request rejected"); void fetchRequests(); }
    setSavingId(null);
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete request from ${email}? This cannot be undone.`)) return;
    setSavingId(id);
    const { error } = await supabase.from("access_requests").delete().eq("id", id);
    if (error) toast.error("Failed to delete request");
    else { toast.success("Request deleted"); void fetchRequests(); }
    setSavingId(null);
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
  };

  const FILTERS = ["all", "pending", "approved", "rejected"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve or reject signup requests
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            {f === "pending" && counts.pending > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Mail size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} requests
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const StatusIcon = STATUS_ICONS[req.status];
            return (
              <div key={req.id} className="rounded-xl border bg-card px-4 py-3 space-y-2.5">

                {/* Row 1: email + date + status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium truncate max-w-[200px]">{req.email}</span>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">@{req.username}</span>
                    </div>
                  </div>

                  <Badge className={`border-0 text-[10px] py-0.5 px-2 flex items-center gap-1 shrink-0 ${STATUS_STYLES[req.status]}`}>
                    <StatusIcon size={10} strokeWidth={2.5} />
                    {req.status}
                  </Badge>
                </div>

                {/* Message */}
                {req.message && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 italic">
                    "{req.message}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-0.5 border-t border-border/40">
                  {req.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      disabled={savingId === req.id}
                      onClick={() => handleApprove(req.id, req.email)}
                    >
                      <Check size={12} strokeWidth={2.5} /> Approve
                    </Button>
                  )}
                  {req.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      disabled={savingId === req.id}
                      onClick={() => handleReject(req.id)}
                    >
                      <X size={12} strokeWidth={2.5} /> Reject
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
                    disabled={savingId === req.id}
                    onClick={() => handleDelete(req.id, req.email)}
                  >
                    <Trash2 size={12} strokeWidth={2} /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

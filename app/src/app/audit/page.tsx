"use client";

import { useEffect, useState } from "react";
import { DecisionBadge } from "@/components/decision-badge";

interface AuditEntry {
  id: number;
  decision_id: string;
  record: any;
  record_hash: string;
  created_at: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [replayResult, setReplayResult] = useState<any>(null);
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [filter]);

  async function loadEntries() {
    setLoading(true);
    try {
      const url = filter
        ? `/api/decisions/list?limit=50&category=${filter}`
        : "/api/decisions/list?limit=50";
      const res = await fetch(url);
      const json = await res.json();
      setEntries(json.decisions ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReplay(entry: AuditEntry) {
    setReplaying(true);
    setReplayResult(null);
    try {
      const res = await fetch(`/api/decisions/${entry.decision_id}/replay`, {
        method: "POST",
      });
      const json = await res.json();
      setReplayResult(json);
    } catch {
      setReplayResult({ error: "Replay failed" });
    } finally {
      setReplaying(false);
    }
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Explorer</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            {total} total decisions recorded
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-[var(--card)] text-sm"
        >
          <option value="">All categories</option>
          <option value="discount">Discount</option>
          <option value="hiring">Hiring</option>
          <option value="spend">Spend</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision list */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-[var(--muted-foreground)] animate-pulse">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)] border rounded-xl">
              No decisions found.
            </div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.decision_id}
                onClick={() => { setSelected(entry); setReplayResult(null); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.decision_id === entry.decision_id
                    ? "bg-[var(--accent)] border-[var(--ring)]"
                    : "bg-[var(--card)] hover:bg-[var(--accent)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DecisionBadge outcome={entry.record?.outcome ?? "APPROVE"} />
                    <span className="text-sm font-medium capitalize">
                      {entry.record?.category ?? "—"}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2 truncate">
                  {entry.record?.reason ?? "—"}
                </p>
                <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
                  {entry.decision_id}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="border rounded-xl bg-[var(--card)] p-6 sticky top-8 h-fit">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Decision Detail</h3>
                <button
                  onClick={() => handleReplay(selected)}
                  disabled={replaying}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {replaying ? "Replaying..." : "Replay"}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">ID: </span>
                  <span className="font-mono text-xs">{selected.decision_id}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Category: </span>
                  <span className="capitalize">{selected.record?.category}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Outcome: </span>
                  <DecisionBadge outcome={selected.record?.outcome} />
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Reason: </span>
                  <span>{selected.record?.reason}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Policy: </span>
                  <span className="font-mono text-xs">{selected.record?.policy_version}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Hash: </span>
                  <span className="font-mono text-xs break-all">{selected.record_hash}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">
                  Context
                </div>
                <pre className="text-xs font-mono bg-[var(--muted)] p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selected.record?.context, null, 2)}
                </pre>
              </div>

              {selected.record?.trace?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">
                    Evaluation Trace
                  </div>
                  <div className="space-y-1">
                    {selected.record.trace.map((t: any, i: number) => (
                      <div key={i} className="text-xs font-mono bg-[var(--muted)] p-2 rounded">
                        {t.field} {t.op} {t.rhs_value} → actual: {t.actual}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Replay result */}
              {replayResult && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Replay Result</h4>
                  {replayResult.error ? (
                    <div className="text-red-600 text-sm">{replayResult.error}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Match:</span>
                        <span className={replayResult.verified ? "text-emerald-600" : "text-red-600"}>
                          {replayResult.verified ? "YES — Deterministic" : "NO — Integrity violation"}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Original: {replayResult.original.outcome} | Replay: {replayResult.replay.outcome}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              Select a decision to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

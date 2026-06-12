"use client";

import { useEffect, useState } from "react";
import { DecisionBadge } from "@/components/decision-badge";

interface DashboardData {
  total: number;
  approved: number;
  denied: number;
  escalated: number;
  recent: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/decisions/list?limit=20");
        const json = await res.json();

        const decisions = json.decisions ?? [];
        setData({
          total: json.total ?? 0,
          approved: decisions.filter((d: any) => d.record?.outcome === "APPROVE").length,
          denied: decisions.filter((d: any) => d.record?.outcome === "DENY").length,
          escalated: decisions.filter((d: any) => d.record?.outcome === "ESCALATE").length,
          recent: decisions,
        });
      } catch {
        setData({ total: 0, approved: 0, denied: 0, escalated: 0, recent: [] });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-[var(--muted-foreground)] animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    { label: "Total Decisions", value: data?.total ?? 0, color: "text-[var(--foreground)]" },
    { label: "Approved", value: data?.approved ?? 0, color: "text-emerald-600" },
    { label: "Denied", value: data?.denied ?? 0, color: "text-red-600" },
    { label: "Escalated", value: data?.escalated ?? 0, color: "text-violet-600" },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold">Founder Dashboard</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Overview of all policy-governed decisions
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl border bg-[var(--card)]">
            <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
              {s.label}
            </div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent decisions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Decisions</h2>
        {data?.recent.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)] border rounded-xl">
            No decisions yet. Go to Chat to make your first decision.
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Decision ID</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Outcome</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent.map((d: any) => (
                  <tr key={d.decision_id} className="border-t hover:bg-[var(--muted)]/50">
                    <td className="px-4 py-3 font-mono text-xs">{d.decision_id.slice(0, 20)}...</td>
                    <td className="px-4 py-3 capitalize">{d.record?.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <DecisionBadge outcome={d.record?.outcome ?? "APPROVE"} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs truncate">
                      {d.record?.reason ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

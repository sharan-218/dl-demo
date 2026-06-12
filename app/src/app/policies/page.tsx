"use client";

import { useEffect, useState } from "react";

interface PolicyData {
  category: string;
  hash: string;
  policy_id: string;
  namespace: string;
  decision_type: string;
  rules_count: number;
  rules: { id: string; outcome: string; reason: string }[];
  default_outcome: string;
  default_reason: string;
  input_schema: Record<string, { kind: string }>;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PolicyData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/policies");
        const json = await res.json();
        setPolicies(json.policies ?? []);
      } catch {
        setPolicies([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const CATEGORY_ICONS: Record<string, string> = {
    discount: "💰",
    hiring: "👥",
    spend: "💳",
    vendor: "🏢",
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold">Policy Studio</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          View and manage decision policies
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--muted-foreground)] animate-pulse">
          Loading policies...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy list */}
          <div className="space-y-3">
            {policies.map((p) => (
              <button
                key={p.category}
                onClick={() => setSelected(p)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.category === p.category
                    ? "bg-[var(--accent)] border-[var(--ring)]"
                    : "bg-[var(--card)] hover:bg-[var(--accent)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[p.category]}</span>
                  <div>
                    <div className="font-semibold capitalize">{p.category}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {p.rules_count} rules • {p.hash}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Policy detail */}
          <div className="lg:col-span-2 border rounded-xl bg-[var(--card)] p-6">
            {selected ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{selected.category} Policy</h3>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono mt-1">
                      {selected.policy_id} • {selected.hash}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                    Active
                  </span>
                </div>

                {/* Input schema */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Input Schema</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selected.input_schema).map(([field, schema]) => (
                      <div key={field} className="flex items-center gap-2 text-sm font-mono bg-[var(--muted)] px-3 py-2 rounded-lg">
                        <span>{field}</span>
                        <span className="text-[var(--muted-foreground)]">: {schema.kind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Rules (evaluated top-to-bottom)</h4>
                  <div className="space-y-2">
                    {selected.rules.map((rule, i) => (
                      <div key={rule.id} className="p-3 rounded-lg border bg-[var(--muted)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[var(--muted-foreground)]">
                              #{i + 1}
                            </span>
                            <span className="font-mono text-sm">{rule.id}</span>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              rule.outcome === "APPROVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : rule.outcome === "DENY"
                                ? "bg-red-100 text-red-800"
                                : "bg-violet-100 text-violet-800"
                            }`}
                          >
                            {rule.outcome}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          {rule.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default */}
                <div className="p-3 rounded-lg border-2 border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">DEFAULT:</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        selected.default_outcome === "APPROVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selected.default_outcome}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {selected.default_reason}
                  </p>
                </div>

                {/* Raw JSON */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Raw Policy JSON</h4>
                  <pre className="text-xs font-mono bg-[var(--muted)] p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(
                      {
                        policy_id: selected.policy_id,
                        namespace: selected.namespace,
                        decision_type: selected.decision_type,
                        input_schema: selected.input_schema,
                        rules: selected.rules,
                        default: {
                          outcome: selected.default_outcome,
                          reason: selected.default_reason,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">
                Select a policy to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import {
  evaluateDecision,
  InMemoryDecisionRecordStore,
  MemoryPolicyStore,
  type PolicyIR,
  type DecisionSuccessRecord,
  type DecisionErrorRecord,
} from "@shaevon/decision-ledger";
import type { PolicyBundle } from "@shaevon/decision-ledger/dist/api/src/types";
import type { DecisionOutcome, DecisionResult, DecisionCategory } from "./types";

// ── Policy bundles (raw JSON) ──────────────────────────────────────

import discountBundle from "../../policies/discount-policy.json";
import hiringBundle from "../../policies/hiring-policy.json";
import spendBundle from "../../policies/spend-policy.json";
import vendorBundle from "../../policies/vendor-policy.json";

// ── Policy stores (one per category) ───────────────────────────────

const stores: Record<DecisionCategory, { store: InMemoryDecisionRecordStore; policyStore: MemoryPolicyStore; policy: PolicyIR; hash: string }> = {
  discount: initStore(discountBundle as unknown as PolicyBundle),
  hiring: initStore(hiringBundle as unknown as PolicyBundle),
  spend: initStore(spendBundle as unknown as PolicyBundle),
  vendor: initStore(vendorBundle as unknown as PolicyBundle),
};

function initStore(bundle: PolicyBundle) {
  const entry = bundle.policies[0];
  const policyStore = new MemoryPolicyStore(bundle);
  const store = new InMemoryDecisionRecordStore();
  return { store, policyStore, policy: entry.policy, hash: entry.hash };
}

// ── Public API ─────────────────────────────────────────────────────

export function getPolicyBundle(category: DecisionCategory) {
  return stores[category];
}

export async function evaluateCategoryDecision(
  category: DecisionCategory,
  rawContext: Record<string, unknown>
): Promise<DecisionResult> {
  const { store, policy, hash } = stores[category];

  const decision_id = `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const response = await evaluateDecision({
    decision_id,
    namespace: policy.namespace,
    decision_type: policy.decision_type,
    policy_hash: hash,
    raw_context: rawContext,
    created_at: new Date().toISOString(),
    store,
    policy,
  });

  if (response.record_type === "DECISION_ERROR") {
    const errRec = response as DecisionErrorRecord;
    return {
      decision_id: errRec.decision_id,
      outcome: "DENY" as DecisionOutcome,
      reason: errRec.error.message,
      explanation: `Error: ${errRec.error.message}`,
      policy_version: hash,
      context: rawContext as Record<string, number>,
      category,
      trace: [],
      timestamp: errRec.created_at,
    };
  }

  const success = response as DecisionSuccessRecord;

  return {
    decision_id: success.decision_id,
    outcome: success.outcome as DecisionOutcome,
    reason: success.explanation,
    explanation: buildExplanation(success.outcome, success.explanation),
    policy_version: success.policy_hash,
    context: rawContext as Record<string, number>,
    category,
    trace: success.trace.map((t) => ({
      field: t.field,
      op: String(t.op),
      rhs_value: String(t.rhs_value),
      actual: String(t.actual),
    })),
    timestamp: success.created_at,
  };
}

function buildExplanation(outcome: string, reason: string): string {
  switch (outcome) {
    case "APPROVE":
      return `\u2705 Approved. ${reason}`;
    case "DENY":
      return `\u274C Denied. ${reason}`;
    case "ESCALATE":
      return `\u26A0\uFE0F Escalated. ${reason}`;
    default:
      return reason;
  }
}

import { NextResponse } from "next/server";
import { getPolicyBundle } from "@/lib/evaluator";
import type { DecisionCategory } from "@/lib/types";

const CATEGORIES: DecisionCategory[] = ["discount", "hiring", "spend", "vendor"];

export async function GET() {
  try {
    const policies = CATEGORIES.map((cat) => {
      const { policy, hash } = getPolicyBundle(cat);
      return {
        category: cat,
        hash,
        policy_id: policy.policy_id,
        namespace: policy.namespace,
        decision_type: policy.decision_type,
        rules_count: policy.rules.length,
        rules: policy.rules.map((r) => ({
          id: r.id,
          outcome: r.then.outcome,
          reason: r.then.reason,
        })),
        default_outcome: policy.default.outcome,
        default_reason: policy.default.reason,
        input_schema: policy.input_schema,
      };
    });

    return NextResponse.json({ policies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

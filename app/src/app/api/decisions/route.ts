import { NextRequest, NextResponse } from "next/server";
import { extractContext } from "@/lib/ai";
import { evaluateCategoryDecision } from "@/lib/evaluator";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, category: forcedCategory, context: forcedContext } = body;

    if (!text && !forcedContext) {
      return NextResponse.json({ error: "text or context required" }, { status: 400 });
    }

    let extracted;
    let decision;

    if (forcedCategory && forcedContext) {
      extracted = {
        category: forcedCategory,
        fields: forcedContext,
        summary: "Direct evaluation",
      };
      decision = await evaluateCategoryDecision(forcedCategory, forcedContext);
    } else {
      extracted = await extractContext(text);
      decision = await evaluateCategoryDecision(extracted.category, extracted.fields);
    }

    // Persist to our own DB for audit queries
    try {
      const record = {
        decision_id: decision.decision_id,
        namespace: "startup-ops/prod",
        decision_type: `${decision.category}_approval`,
        outcome: decision.outcome,
        reason: decision.reason,
        policy_version: decision.policy_version,
        context: decision.context,
        category: decision.category,
        trace: decision.trace,
        timestamp: decision.timestamp,
      };

      await query(
        `INSERT INTO decision_records (decision_id, record, raw_record, record_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (decision_id) DO NOTHING`,
        [
          decision.decision_id,
          JSON.stringify(record),
          JSON.stringify(record),
          "pending",
        ]
      );
    } catch (dbErr) {
      console.error("DB persist error:", dbErr);
    }

    return NextResponse.json({ extracted, decision });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

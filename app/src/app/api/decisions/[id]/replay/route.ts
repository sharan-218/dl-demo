import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { evaluateCategoryDecision } from "@/lib/evaluator";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(
      "SELECT * FROM decision_records WHERE decision_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const record = result.rows[0].record;

    const replay = await evaluateCategoryDecision(record.category, record.context);

    const match = record.outcome === replay.outcome;

    return NextResponse.json({
      original: {
        decision_id: record.decision_id,
        outcome: record.outcome,
        reason: record.reason,
        policy_version: record.policy_version,
      },
      replay: {
        decision_id: replay.decision_id,
        outcome: replay.outcome,
        reason: replay.reason,
        policy_version: replay.policy_version,
      },
      match,
      verified: match,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

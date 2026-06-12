import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const category = searchParams.get("category");

    let sql = "SELECT * FROM decision_records";
    const params: any[] = [];

    if (category) {
      sql += " WHERE (record->>'category') = $1";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);

    const result = await query(sql, params);

    const countSql = category
      ? "SELECT COUNT(*) FROM decision_records WHERE (record->>'category') = $1"
      : "SELECT COUNT(*) FROM decision_records";
    const countParams = category ? [category] : [];
    const countResult = await query(countSql, countParams);

    return NextResponse.json({
      decisions: result.rows.map((r) => ({
        id: r.id,
        decision_id: r.decision_id,
        record: r.record,
        record_hash: r.record_hash,
        created_at: r.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

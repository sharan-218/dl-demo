import { NextRequest, NextResponse } from "next/server";
import { extractContext } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const extracted = await extractContext(text);
    return NextResponse.json(extracted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

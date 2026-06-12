"use client";

import { cn } from "@/lib/utils";
import { DecisionOutcome } from "@/lib/types";

const BADGE_STYLES: Record<string, string> = {
  APPROVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DENY: "bg-red-100 text-red-800 border-red-200",
  ESCALATE: "bg-violet-100 text-violet-800 border-violet-200",
  ROLLBACK: "bg-orange-100 text-orange-800 border-orange-200",
  CONTINUE: "bg-blue-100 text-blue-800 border-blue-200",
};

export function DecisionBadge({ outcome }: { outcome: DecisionOutcome }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        BADGE_STYLES[outcome] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {outcome}
    </span>
  );
}

export type DecisionOutcome = "APPROVE" | "DENY" | "ESCALATE" | "ROLLBACK" | "CONTINUE";

export type DecisionCategory = "discount" | "hiring" | "spend" | "vendor";

export interface ExtractedContext {
  category: DecisionCategory;
  fields: Record<string, number>;
  summary: string;
}

export interface DecisionResult {
  decision_id: string;
  outcome: DecisionOutcome;
  reason: string;
  explanation: string;
  policy_version: string;
  context: Record<string, number>;
  category: DecisionCategory;
  trace: TraceEntry[];
  timestamp: string;
}

export interface TraceEntry {
  field: string;
  op: string;
  rhs_value: string;
  actual: string;
}

export interface PolicyInfo {
  hash: string;
  policy_id: string;
  namespace: string;
  decision_type: string;
  category: DecisionCategory;
  rules_count: number;
  active: boolean;
}

export interface AuditRecord {
  id: number;
  decision_id: string;
  record: any;
  record_hash: string;
  previous_hash: string | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  approved: number;
  denied: number;
  escalated: number;
  recentDecisions: AuditRecord[];
}

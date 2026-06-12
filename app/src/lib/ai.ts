import { ExtractedContext, DecisionCategory } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Rule-based extraction ──────────────────────────────────────────

const DISCOUNT_PATTERNS = [
  /(\d+)%\s*discount/i,
  /discount\s*(?:of|up\s*to)?\s*(\d+)%/i,
  /(\d+)\s*percent\s*off/i,
];

const MONEY_PATTERNS = [
  /\$([\d,]+(?:\.\d+)?)\s*(k|K|M|m)?/,
  /([\d,]+(?:\.\d+)?)\s*(?:dollars|usd)/i,
  /([\d,]+(?:\.\d+)?)\s*k/i,
];

const TIER_KEYWORDS: Record<string, number> = {
  enterprise: 3, corp: 3, large: 3, big: 3,
  growth: 2, mid: 2, medium: 2, scaling: 2,
  startup: 1, small: 1, early: 1, seed: 1,
};

const VENDOR_RISK_KEYWORDS: Record<string, number> = {
  risky: 80, high: 75, untrusted: 85, unknown: 60,
  new: 55, trusted: 30, proven: 20, established: 15, safe: 10,
};

const ROLE_PRIORITY_KEYWORDS: Record<string, number> = {
  critical: 1, urgent: 1, essential: 1, "must-have": 1,
  important: 2, needed: 2, valuable: 2,
  "nice-to-have": 3, optional: 3, bonus: 3, "good-to-have": 3,
};

const SPEND_CATEGORIES: Record<string, number> = {
  saas: 1, software: 1, subscription: 1, tool: 1, tools: 1,
  marketing: 2, ads: 2, advertising: 2, campaign: 2, social: 2,
  travel: 3, trip: 3, flight: 3, hotel: 3, conference: 3,
  equipment: 4, hardware: 4, laptop: 4, computer: 4, monitor: 4,
};

function parseMoney(text: string): number | null {
  for (const pat of MONEY_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      let num = parseFloat(m[1].replace(/,/g, ""));
      if (m[2]) {
        const suffix = m[2].toUpperCase();
        if (suffix === "K") num *= 1000;
        if (suffix === "M") num *= 1000000;
      }
      return Math.round(num);
    }
  }
  return null;
}

function parseDiscount(text: string): number | null {
  for (const pat of DISCOUNT_PATTERNS) {
    const m = text.match(pat);
    if (m) return parseInt(m[1]);
  }
  return null;
}

function findKeyword(text: string, map: Record<string, number>): number | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function extractDiscountContext(text: string): ExtractedContext | null {
  const discount = parseDiscount(text);
  if (discount === null) return null;

  const tier = findKeyword(text, TIER_KEYWORDS) ?? 1;
  const contractValue = parseMoney(text) ?? 10000;
  const hasDiscountHistory = /previous|before|history|past|already|prior|gave.*discount|had.*discount/i.test(text);
  const prevDiscounts = hasDiscountHistory ? 3 : 0;

  return {
    category: "discount",
    fields: {
      customer_tier: tier,
      contract_value: contractValue,
      requested_discount: discount,
      previous_discounts: prevDiscounts,
    },
    summary: `Discount request: ${discount}% for ${["", "startup", "growth", "enterprise"][tier]} customer, contract value $${contractValue.toLocaleString()}`,
  };
}

function extractHiringContext(text: string): ExtractedContext | null {
  if (!/hire|hiring|headcount|engineer|developer|designer|recruit|role|position/i.test(text)) return null;

  const priority = findKeyword(text, ROLE_PRIORITY_KEYWORDS) ?? 2;
  const salary = parseMoney(text) ?? 100000;
  const teamSize = (text.match(/team\s*(?:of|size)?\s*(\d+)/i))?.[1]
    ? parseInt(text.match(/team\s*(?:of|size)?\s*(\d+)/i)![1])
    : 8;
  const headcount = teamSize + 2;

  return {
    category: "hiring",
    fields: {
      team_size: teamSize,
      approved_headcount: headcount,
      salary_band: salary,
      role_priority: priority,
    },
    summary: `Hiring request: ${["", "critical", "important", "nice-to-have"][priority]} role, salary $${salary.toLocaleString()}`,
  };
}

function extractSpendContext(text: string): ExtractedContext | null {
  if (!/spend|expense|budget|buy|purchase|subscription|cost|pay|invest/i.test(text)) return null;

  const amount = parseMoney(text);
  if (amount === null) return null;

  const category = findKeyword(text, SPEND_CATEGORIES) ?? 1;
  const budgetRemaining = Math.max(amount * 2, 20000);

  return {
    category: "spend",
    fields: {
      expense_amount: amount,
      category: category,
      monthly_budget_remaining: budgetRemaining,
    },
    summary: `Spend request: $${amount.toLocaleString()} for ${["", "SaaS", "Marketing", "Travel", "Equipment"][category]}`,
  };
}

function extractVendorContext(text: string): ExtractedContext | null {
  if (!/vendor|supplier|provider|contract|procurement|onboard/i.test(text)) return null;

  const riskScore = findKeyword(text, VENDOR_RISK_KEYWORDS) ?? 40;
  const contractValue = parseMoney(text) ?? 10000;
  const vendorType = (/saas|software|tool/i.test(text)) ? 1
    : (/consult/i.test(text)) ? 2
    : (/infra|hosting|cloud/i.test(text)) ? 3
    : 1;

  return {
    category: "vendor",
    fields: {
      vendor_risk_score: riskScore,
      contract_value: contractValue,
      vendor_type: vendorType,
    },
    summary: `Vendor request: risk ${riskScore}/100, contract $${contractValue.toLocaleString()}`,
  };
}

export function extractWithRules(text: string): ExtractedContext | null {
  return extractDiscountContext(text)
    ?? extractHiringContext(text)
    ?? extractSpendContext(text)
    ?? extractVendorContext(text);
}

// ── OpenRouter LLM extraction ──────────────────────────────────────

const EXTRACTION_PROMPT = `You are a structured data extractor for a startup operating system.
Given a natural language business request, extract the decision category and relevant fields.

Categories and their fields:

1. DISCOUNT (discount_approval):
   - customer_tier: 1 (startup), 2 (growth), 3 (enterprise)
   - contract_value: dollar amount (integer)
   - requested_discount: percentage (integer)
   - previous_discounts: count of prior discounts (integer, default 0)

2. HIRING (hiring_approval):
   - team_size: current team size (integer)
   - approved_headcount: max allowed headcount (integer, default team_size+2)
   - salary_band: annual salary in dollars (integer)
   - role_priority: 1 (critical), 2 (important), 3 (nice-to-have)

3. SPEND (spend_approval):
   - expense_amount: dollar amount (integer)
   - category: 1 (SaaS), 2 (Marketing), 3 (Travel), 4 (Equipment)
   - monthly_budget_remaining: remaining budget (integer, default 2x expense)

4. VENDOR (vendor_approval):
   - vendor_risk_score: 0-100 risk score
   - contract_value: dollar amount (integer)
   - vendor_type: 1 (SaaS), 2 (Consulting), 3 (Infrastructure)

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "category": "discount|hiring|spend|vendor",
  "fields": { ... },
  "summary": "one-line description"
}

If the request doesn't match any category, respond with:
{ "category": null, "fields": null, "summary": "Could not categorize the request" }`;

export async function extractWithLLM(text: string): Promise<ExtractedContext | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.category || !parsed.fields) return null;

    return parsed as ExtractedContext;
  } catch {
    return null;
  }
}

// ── Combined extraction ────────────────────────────────────────────

export async function extractContext(text: string): Promise<ExtractedContext> {
  const ruleResult = extractWithRules(text);
  if (ruleResult) return ruleResult;

  const llmResult = await extractWithLLM(text);
  if (llmResult) return llmResult;

  return {
    category: "discount",
    fields: {
      customer_tier: 1,
      contract_value: 10000,
      requested_discount: 10,
      previous_discounts: 0,
    },
    summary: "Unable to parse request — defaulting to startup discount scenario",
  };
}

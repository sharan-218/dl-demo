# AI Startup COO — MVP Validation Questions

Copy-paste these into the chat at `http://localhost:3001` to validate each decision path.

---

## Discount Decisions

### Should APPROVE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 1 | Can we give StartupCo a 10% discount on a $5,000 contract? | APPROVE | Startup tier, 10% ≤ 15% max |
| 2 | Can we offer Growth Inc a 20% discount? | APPROVE | Growth tier, 20% ≤ 25% max |
| 3 | Can we give Enterprise Corp a 25% discount on a $30,000 deal? | APPROVE | Enterprise, under $50k threshold, 25% ≤ 30% |
| 4 | Can we offer a 5% discount to our startup customer? | APPROVE | Well within all limits |

### Should DENY

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 5 | Can we give Acme Corp a 40% discount on a $60,000 contract? | DENY | Enterprise + contract > $50k → max 30%, 40% exceeds |
| 6 | Can we offer a 35% discount to our growth customer? | DENY | Growth tier max is 25%, 35% exceeds |
| 7 | Can we give StartupCo a 20% discount? | DENY | Startup tier max is 15%, 20% exceeds |
| 8 | Can we offer a 50% discount on this enterprise deal? | DENY | Exceeds 30% enterprise maximum |

### Should ESCALATE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 9 | Can we give this customer a 15% discount? They've had previous discounts before. | ESCALATE | Previous discounts > 2 triggers escalation |
| 10 | Can we offer a 10% discount? We gave them discounts in the past and before that too. | ESCALATE | Multiple discount history mentions |

### Edge Cases

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 11 | 40% discount | Should extract discount context | Minimal input test |
| 12 | Give them a deal | May fallback to defaults | Ambiguous — tests AI extraction |

---

## Hiring Decisions

### Should APPROVE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 13 | Can we hire a critical frontend engineer at $120k? | APPROVE | Role priority 1 (critical), salary ≤ $150k |
| 14 | We need to hire an urgent backend developer | APPROVE | "urgent" = critical priority |
| 15 | Can we hire an essential DevOps engineer at $130,000? | APPROVE | Critical role, salary under threshold |

### Should ESCALATE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 16 | Can we hire a frontend engineer at $160k? | ESCALATE | Salary > $150k threshold |
| 17 | Should we hire a nice-to-have designer? | ESCALATE | Role priority 3 (nice-to-have) |
| 18 | Can we bring on a contractor at $200,000 salary? | ESCALATE | Salary exceeds $150k |

### Edge Cases

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 19 | We need more people | May not extract hiring context | Vague — tests extraction |
| 20 | Hire a developer | Should extract hiring context | Minimal but clear |

---

## Spend Decisions

### Should APPROVE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 21 | Can we spend $3,000 on a SaaS subscription? | APPROVE | Under $10k, not marketing |
| 22 | Can we buy $2,000 worth of equipment? | APPROVE | Under $10k |
| 23 | Can we spend $4,000 on travel for the conference? | APPROVE | Under $10k |

### Should ESCALATE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 24 | Can we spend $15,000 on marketing this month? | ESCALATE | Over $10k threshold |
| 25 | Can we invest $12,000 in new software tools? | ESCALATE | Over $10k threshold |
| 26 | Can we spend $8,000 on a marketing campaign? | ESCALATE | Marketing > $5k |

### Edge Cases

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 27 | We need to buy something | May fallback | Vague spend request |
| 28 | $50k on ads | Should extract marketing spend | Large marketing spend |

---

## Vendor Decisions

### Should APPROVE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 29 | Should we onboard CloudHost as our new vendor? They're trusted and proven. | APPROVE | Low risk score (trusted+proven ≈ 25) |
| 30 | Can we sign with SafeTools for $10,000? | APPROVE | Low risk, contract under $20k |
| 31 | Should we approve this established infrastructure provider? | APPROVE | "established" = low risk |

### Should DENY

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 32 | Should we use this risky vendor for $15,000? | DENY | "risky" = risk score ~80, exceeds 70 |
| 33 | Can we onboard this untrusted provider? | DENY | "untrusted" = risk score ~85, exceeds 70 |
| 34 | Should we approve this high-risk vendor? | DENY | "high" risk = ~75, exceeds 70 |

### Should ESCALATE

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 35 | Should we use this new vendor for a $25,000 contract? | ESCALATE | "new" = risk ~55, contract > $20k |
| 36 | Can we sign with an unknown vendor for $30,000? | ESCALATE | "unknown" = risk ~60, contract > $20k |

### Edge Cases

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 37 | Vendor approval | May fallback | Minimal vendor context |
| 38 | Should we renew with our current SaaS provider? | May extract vendor context | Tests vendor keyword detection |

---

## Cross-Category / Complex Queries

| # | Question | Expected | Why |
|---|----------|----------|-----|
| 39 | Can we spend $50k to hire a new vendor for marketing? | Should pick one category | Multi-intent — tests disambiguation |
| 40 | What's our budget situation? | No decision | Informational — not a decision request |
| 41 | Approve everything | Should attempt extraction | Tests broad command handling |

---

## Replay Validation

After running questions 5, 8, 16, 24, 32:

1. Go to `/audit`
2. Click on each decision
3. Click "Replay"
4. Verify: **"YES — Deterministic"** for all

This confirms Decision Ledger produces identical outcomes on replay.

---

## Summary Checklist

| Category | Tests | Approve | Deny | Escalate |
|----------|-------|---------|------|----------|
| Discount | 12 | 4 | 4 | 2 |
| Hiring | 8 | 3 | 0 | 3 |
| Spend | 8 | 3 | 0 | 3 |
| Vendor | 8 | 3 | 3 | 2 |
| Cross | 3 | — | — | — |
| **Total** | **39** | **13** | **7** | **10** |

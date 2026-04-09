# Skill: domain-industry-classifier

## Identity
**Skill ID:** `domain-industry-classifier`
**Version:** 3.0.0
**Position in chain:** Step 1 of 6 (runs in parallel with kpi-extractor)
**Receives from:** Raw BRD text
**Outputs to:** `kpi-enhancer` (Step 3) + `chart-mapper` (Step 4)

---

## Purpose
Classify the BRD across three dimensions simultaneously:
1. **Business Domain** — what functional area (Sales, Finance, Operations, etc.)
2. **Client Industry** — what sector (Banking, FMCG, Retail, SaaS, etc.)
3. **Sub-Industry** — specific vertical within the industry

Also extracts client metadata (name, website, email).
This is the ONLY agent that determines industry.
No other agent may infer or override these values.

---

## Supported Values

### Business Domain (select exactly ONE of 8)
| Domain | Key Signals |
|--------|------------|
| `Sales` | quota, pipeline, deals, win rate, leads, reps, territory |
| `Marketing` | campaigns, CTR, ROAS, impressions, funnel, MQL, CPL |
| `Operations` | SLA, throughput, cycle time, OEE, fulfilment, efficiency |
| `Finance` | EBITDA, P&L, margin, cash flow, budget, OpEx, CapEx |
| `HR` | headcount, attrition, hiring, engagement, tenure, payroll |
| `Supply Chain` | inventory, OTD, lead time, warehouse, logistics, supplier |
| `Customer Service` | CSAT, NPS, ticket volume, resolution time, escalation |
| `IT` | uptime, incidents, MTTR, deployment frequency, system health |

### Client Industry (select exactly ONE of 20)
Banking, Insurance, Manufacturing, FMCG, Retail, E-Commerce, SaaS,
Telecommunications, Healthcare, Pharmaceuticals, Energy, Utilities,
Logistics, Automotive, Real Estate, Media & Entertainment, Education,
Government, Professional Services, Hospitality

### Sub-Industry
Specific vertical if identifiable (e.g. "Retail Banking", "Discrete Manufacturing").
Otherwise: `"General"`

---

## System Prompt (use exactly as written)

```
You are a Business Document Analyst. Your ONLY task is to classify the document
by DOMAIN and INDUSTRY.

CRITICAL OUTPUT RULES:
- OUTPUT ONLY VALID JSON
- NO markdown, NO explanations, NO text before or after the JSON
- OUTPUT STARTS WITH { and ENDS WITH }

YOU MUST IDENTIFY:

1. BUSINESS DOMAIN (exactly ONE):
   Sales, Marketing, Operations, Finance, HR, Supply Chain, Customer Service, IT

2. CLIENT INDUSTRY (exactly ONE):
   Banking, Insurance, Manufacturing, FMCG, Retail, E-Commerce, SaaS,
   Telecommunications, Healthcare, Pharmaceuticals, Energy, Utilities,
   Logistics, Automotive, Real Estate, Media & Entertainment, Education,
   Government, Professional Services, Hospitality

3. SUB-INDUSTRY (if identifiable, else "General")

4. CLIENT NAME (from document, else "Unknown Client")

5. CLIENT WEBSITE (if mentioned, else "")

OUTPUT FORMAT:
{
  "domain": "[DOMAIN]",
  "industry": "[INDUSTRY]",
  "subIndustry": "[SUB-INDUSTRY or General]",
  "clientName": "[CLIENT NAME]",
  "clientWebsite": "[URL or empty string]",
  "clientEmail": "[email or empty string]",
  "confidence": {
    "domain": "high|medium|low",
    "industry": "high|medium|low"
  },
  "reasoning": {
    "domainIndicators": ["indicator1", "indicator2", "indicator3"],
    "industryIndicators": ["indicator1", "indicator2", "indicator3"]
  }
}

DOCUMENT CONTENT:
{brd_text}
```

---

## Input Schema
```json
{ "brd_text": "<full extracted BRD text>" }
```

## Output Schema
```json
{
  "domain": "Sales",
  "industry": "Banking",
  "subIndustry": "Retail Banking",
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "clientEmail": "",
  "confidence": { "domain": "high", "industry": "high" },
  "reasoning": {
    "domainIndicators": ["branch sales performance", "lead conversion", "RM productivity"],
    "industryIndicators": ["CASA ratio", "loan disbursement", "NPA ratio"]
  }
}
```

---

## N8N Node Configuration
```json
{
  "node_type": "AI Agent",
  "node_name": "Domain Industry Classifier",
  "model": "gpt-4o",
  "input_mapping": { "brd_text": "{{ $json.text }}" },
  "output_field": "domainIndustry",
  "parse_json": true,
  "next_node": "KPI Extractor (parallel)"
}
```

---

## Validation Rules
- `domain` must be exactly one of the 8 IDs (case-sensitive)
- `industry` must be exactly one of the 20 IDs (case-sensitive)
- `subIndustry` must be a string — "General" is acceptable
- `clientName` must never be null — use "Unknown Client" as fallback
- Both confidence values must be "high", "medium", or "low"
- Each indicators array must contain exactly 3 items

---

## Error Handling
| Condition | Action |
|-----------|--------|
| Domain cannot be determined | Default to `Finance`, confidence: `low` |
| Industry cannot be determined | Default to `Professional Services`, confidence: `low` |
| Client name not in BRD | Set `clientName: "Unknown Client"` |
| BRD < 100 characters | Output with all confidence = `low` |

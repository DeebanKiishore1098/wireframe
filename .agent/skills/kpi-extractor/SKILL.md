# Skill: kpi-extractor

## Identity
**Skill ID:** `kpi-extractor`
**Version:** 3.0.0
**Position in chain:** Step 2 of 6 (runs in parallel with domain-industry-classifier)
**Receives from:** Raw BRD text
**Outputs to:** `kpi-enhancer` (Step 3)

---

## Purpose
Pure extraction only. This agent has one job: read the BRD and pull out
every KPI it can find or validly derive from the document.

It does NOT enforce count minimums.
It does NOT call any fallback library.
It does NOT care if it finds 5 KPIs or 25.

All count enforcement, fallback logic, and list completion happens in the
next agent — `kpi-enhancer`. This agent just extracts as cleanly as possible
and passes everything forward.

This separation means:
- This agent is fast, simple, and can never "fail" — it always returns whatever it found
- Debugging is easy — you can inspect what the BRD actually contained before any enhancement
- `kpi-enhancer` has full visibility into the raw extraction before it decides what to do

---

## Trigger Phrases
- Called automatically as Step 2 of the pipeline (parallel with Step 1)
- "extract KPIs from this BRD"
- "what KPIs are in this document"

---

## Two-Step Extraction Process

### STEP 1 — Extract explicit BRD KPIs

Extract every KPI explicitly listed in the BRD. Look in:
- Sections titled "KPI Overview" or "Key Performance Indicators"
- Sections titled "Reporting Requirements"
- Tables with "KPI" and "Description" columns
- Sections titled "KPIs, Metrics and Formula"
- Any structured list of metrics, measures, or data fields

Tag each as: `"source": "BRD"`

Every KPI found in the BRD must be included. Do NOT skip or filter based on relevance.

---

### STEP 2 — Derive KPIs from BRD fields

Using ONLY fields, dimensions, and concepts present in the BRD, create additional KPIs.

**Allowed derivation techniques:**
- Aggregations: `"Total [field]"`, `"Sum of [field]"`
- Breakdowns: `"[field] by [dimension]"` — e.g. "Revenue by Route"
- Comparisons: `"[field A] vs [field B]"` — e.g. "Billed vs Accepted Amount"
- Trends: `"[field] Trend"`, `"[field] Month-over-Month"`
- Ratios: `"[field A] / [field B]"` — e.g. "Commission-to-Revenue Ratio"
- Shares: `"[field] Share"`, `"[field] Distribution"`

**DERIVED KPI VALIDITY GATE — all 3 tests must pass:**
1. Name the exact BRD fields this KPI uses
2. Can it be computed ONLY from those fields? → Must be YES
3. Does it require data NOT in the BRD? → Must be NO

**Reject immediately if derived KPI requires any of these (unless explicitly in BRD):**
- ❌ Targets or goals
- ❌ Forecasts or projections
- ❌ Benchmarks or industry averages
- ❌ Satisfaction scores (NPS, CSAT)
- ❌ External datasets not referenced in the BRD
- ❌ Market size, penetration, or share (unless BRD has market data)

**Source field format — mandatory:**
```
"source": "Derived from BRD (Field1 & Field2)"
```
- ✔ `"source": "Derived from BRD (Revenue & Route)"`
- ❌ `"source": "Derived from BRD"` ← too vague, rejected

---

## Never Extract These as KPIs
- ❌ IDs, codes, document numbers, currency types, dates as standalone items
- ❌ Dimension/attribute fields (Customer Type, Region, Travel Class, Payment Method)
  — these are filters, NOT KPIs
  — "Revenue by Customer Type" IS a valid derived KPI
  — "Customer Type" alone is NOT
- ❌ Generic SaaS KPIs (MRR, ARR, Churn) unless BRD is about SaaS
- ❌ Generic CRM KPIs unless BRD mentions CRM

---

## Chart Title Generation (per KPI)

For every KPI extracted, generate a chart title using one of these 8 patterns:

| Pattern | Format |
|---------|--------|
| Distribution | `[KPI] Distribution` |
| Trend | `[KPI] Trend Over Time` |
| Breakdown | `[KPI] by [Dimension]` |
| Comparison | `[KPI A] vs [KPI B]` |
| Correlation | `[KPI 1] vs [KPI 2] Correlation` |
| Dispersion | `[KPI] Dispersion by [Segment]` |
| Composition | `[KPI] Composition` |
| Heatmap | `[KPI] Concentration Heatmap` |

---

## System Prompt (use exactly as written)

```
You are a Business KPI Extraction Specialist. Your ONLY task is to read the BRD
and extract every KPI you can find or validly derive.

CRITICAL OUTPUT RULES:
- OUTPUT ONLY VALID JSON
- NO JavaScript comments, NO markdown, NO explanations
- OUTPUT STARTS WITH { and ENDS WITH }

YOUR TASK HAS TWO STEPS:

STEP 1 — EXTRACT BRD KPIs:
Read every section of the BRD. Extract all explicitly listed KPIs.
Tag each: "source": "BRD"
Include ALL of them — never skip a BRD KPI based on your opinion of relevance.

STEP 2 — DERIVE FROM BRD FIELDS:
Using ONLY fields present in the BRD, derive additional KPIs.
Every derived KPI must pass the validity gate:
  - Name the exact BRD fields used: "source": "Derived from BRD (Field1 & Field2)"
  - Can it be computed ONLY from those fields? → YES
  - Does it require data NOT in BRD? → NO
Reject any KPI requiring targets, forecasts, benchmarks, external data,
NPS/CSAT, or market data unless those exact fields exist in the BRD.

DO NOT enforce any minimum count. Extract what you find.
DO NOT add industry fallback KPIs. That is the next agent's job.
DO NOT worry if you only find 8 or 10 KPIs. Report what is there.

NEVER EXTRACT:
- IDs, codes, dates, currency types as standalone KPIs
- Dimension/attribute fields (Region, Customer Type, Payment Method)
- KPIs from unrelated industries

FOR EACH KPI, generate a chart_title using one of these patterns:
  "[KPI] Distribution" / "[KPI] Trend Over Time" / "[KPI] by [Dimension]" /
  "[KPI A] vs [KPI B]" / "[KPI] Dispersion by [Segment]" /
  "[KPI] Composition" / "[KPI] Concentration Heatmap"

PRE-OUTPUT CHECK:
□ Every KPI has "name" field?
□ Every KPI has "source" field (BRD or Derived from BRD (fields))?
□ Every "Derived from BRD" KPI passes validity gate?
□ Every KPI has a chart_title?
□ No dimension fields extracted as KPIs?
□ No external data assumed?
□ JSON valid, no trailing commas?

BRD CONTENT:
{brd_text}
```

---

## Input Schema
```json
{
  "brd_text": "<full BRD text>",
  "domain": "Sales",
  "industry": "Banking"
}
```
Note: `domain` and `industry` are injected from `domain-industry-classifier`
and used only as context for derivation — NOT for fallback selection.

---

## Output Schema
```json
{
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "clientEmail": "",
  "kpiList": [
    {
      "name": "CASA Ratio",
      "source": "BRD",
      "chart_title": "CASA Ratio Trend Over Time"
    },
    {
      "name": "Revenue by Branch",
      "source": "Derived from BRD (Revenue & Branch)",
      "chart_title": "Revenue by Branch"
    }
  ],
  "_extractionSummary": {
    "brd_count": 10,
    "derived_count": 4,
    "total": 14,
    "needs_enhancement": true
  }
}
```

Note: `needs_enhancement: true` when total < 22.
`kpi-enhancer` reads `_extractionSummary.total` to decide what to do next.

---

## N8N Node Configuration
```json
{
  "node_type": "AI Agent",
  "node_name": "KPI Extractor",
  "model": "gpt-4o",
  "input_mapping": {
    "brd_text":  "{{ $json.text }}",
    "domain":    "{{ $('Domain Industry Classifier').item.json.domainIndustry.domain }}",
    "industry":  "{{ $('Domain Industry Classifier').item.json.domainIndustry.industry }}"
  },
  "output_field": "rawKpis",
  "parse_json": true,
  "next_node": "KPI Enhancer"
}
```

---

## Validation Rules
- `kpiList` must be an array (empty array is valid — not an error)
- Every KPI must have `name`, `source`, and `chart_title`
- `_extractionSummary.total` must equal `kpiList.length`
- `needs_enhancement` must be `true` if total < 22, `false` if total >= 22
- Source values: `"BRD"` or `"Derived from BRD (Field1 & Field2)"`

---

## Error Handling
| Condition | Action |
|-----------|--------|
| BRD has zero explicit KPIs | Return empty BRD list, proceed with derivation only |
| All derivations fail validity gate | Return only BRD KPIs, set needs_enhancement accordingly |
| BRD is too vague to derive from | Return whatever was explicitly found, flag needs_enhancement |

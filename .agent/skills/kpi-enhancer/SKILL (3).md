# Skill: kpi-enhancer

## Identity
**Skill ID:** `kpi-enhancer`
**Version:** 3.1.0
**Position in chain:** Step 3 of 6
**Receives from:** `kpi-extractor` (Step 2) + `domain-industry-classifier` (Step 1)
**Outputs to:** `chart-mapper` (Step 4)

---

## Purpose
This is the **KPI Intelligence Engine** — upgraded from a count enforcer to a
full KPI enrichment system.

It receives the raw extraction from `kpi-extractor` and is responsible for:

1. **Count enforcement** — guarantee exactly 22–32 KPIs, filling from library if needed
2. **Intelligence enrichment** — classify, score, role-assign, and validate every KPI
3. **Quality control** — eliminate redundancy, standardize names, check dimensional coverage
4. **Downstream hints** — provide chart hints, dependency maps, and goal mappings
   that help `chart-mapper` and `layout-engine` make better decisions

The output is not just a list — it is a **structured KPI intelligence object**
that every downstream skill can consume with full context about each KPI.

Nothing else. No chart layout. No grid decisions. No rendering.

---

## The 22–32 Rule (NON-NEGOTIABLE)
```
Output kpiList.length MUST be between 22 and 32
Output metricList.length MUST equal kpiList.length × 2 exactly
If rawKpis.total >= 22  → no library needed, output as received + generate metrics
If rawKpis.total < 22   → add library KPIs for remaining slots
If rawKpis.total > 32   → trim lowest-priority derived/fallback KPIs to bring to 32
```

---

---

## Intelligence Layer Reference

The following 12 rules define how every KPI object is enriched.
Apply ALL of them to EVERY KPI in the final list — both BRD-sourced and library-added.

---

### 1. KPI Classification (`kpi_type`)

Every KPI must be tagged with exactly one category:

| kpi_type | Examples |
|----------|---------|
| `financial` | Revenue, EBITDA, Margin, Cost, Profit, NIM, ROA |
| `operational` | Cycle Time, OEE, TAT, Throughput, SLA Compliance |
| `customer` | CSAT, NPS, Churn Rate, CLV, Retention Rate |
| `inventory` | Stock Availability, Fill Rate, Inventory Turns, DSI |
| `risk` | NPA Ratio, VaR, Default Rate, Provision Coverage |
| `marketing` | CTR, ROAS, Impressions, Conversion Rate, MQL |
| `sales` | Revenue, Quota Attainment, Win Rate, Pipeline Value |
| `hr` | Headcount, Attrition, Engagement Score, TTH |

**Balance rule — MANDATORY:**
The final kpiList MUST contain at least 3 distinct `kpi_type` values.
If only 1–2 types are present after extraction + library fill, replace
the lowest-priority fallback KPIs with KPIs from underrepresented types.

---

### 2. KPI Role Assignment (`role`)

Every KPI must be assigned exactly one role:

| Role | Purpose | Maps To |
|------|---------|---------|
| `primary` | Headline KPI — most important business signal | KPI cards (top row) |
| `supporting` | Contextualises the primary KPIs | Trend charts (mid section) |
| `diagnostic` | Deep-dive, root-cause, or drill-down metric | Breakdown charts (bottom) |

**Assignment rules:**
- First 4 highest-priority KPIs → `primary`
- Next 8–12 KPIs → `supporting`
- Remaining KPIs → `diagnostic`
- BRD KPIs are always promoted to `primary` or `supporting` before fallback KPIs

---

### 3. Priority Scoring (`priority_score`)

Every KPI gets an integer score from 1 to 10:

| Source | Score Range | Logic |
|--------|------------|-------|
| `BRD` | 8–10 | Explicitly in the BRD — highest trust |
| `Derived from BRD` | 5–7 | Derived from BRD fields — medium trust |
| `Industry fallback` | 2–4 | Library fill — lowest trust |

**Within each range, score higher if:**
- KPI appears in the first section of the BRD (+1)
- KPI is preceded by "key", "primary", "critical" in BRD (+1)
- KPI directly maps to a primary business goal (+1)

**Priority score drives:**
- Role assignment (high score → primary)
- Trim logic (when total > 32, lowest scores removed first)
- Layout placement hints for `layout-engine`

---

### 4. Dimensional Coverage Check

Before outputting, verify the final KPI list covers at least these dimensions.
If any dimension is missing, replace lowest-priority fallback KPIs to cover it.

| Dimension | Minimum KPIs Required | Example |
|-----------|----------------------|---------|
| Time (trend) | 3 | Revenue Trend, Growth Rate, MoM Change |
| Category (comparison) | 3 | Revenue by Product, KPI by Segment |
| Distribution / spread | 2 | Score Distribution, TAT Distribution |

This prevents flat dashboards that only show point-in-time values with no
temporal or comparative context.

---

### 5. KPI Dependency Mapping (`depends_on`)

For every KPI that is computed from other KPIs or fields, list its dependencies.

```
"depends_on": ["Revenue", "Orders"]  →  for "Average Order Value"
"depends_on": ["Gross Profit", "Revenue"]  →  for "Gross Margin %"
"depends_on": []  →  for atomic KPIs with no formula dependency
```

Rules:
- Only list KPIs or BRD fields that ACTUALLY exist in the dataset
- Never invent dependencies
- For library fallback KPIs with standard formulas, use standard field names
- Maximum 3 dependencies per KPI

This enables future insight and explanation layers to trace KPI causality.

---

### 6. Redundancy Elimination

Before finalising the list, scan for and remove:

**Synonym pairs** — keep only the standardised name:
- "Revenue" vs "Sales Value" vs "Net Sales" → keep one
- "Churn Rate" vs "Attrition Rate" (in customer context) → keep one

**Duplicate logic KPIs** — same formula, different labels:
- "GP Margin" and "Gross Profit %" → keep the standardised form

**Near-duplicates** — same KPI at different granularities:
- Keep the more granular version unless both serve distinct roles

When a KPI is removed, replace it with the next available library KPI
if the count would fall below 22.

---

### 7. KPI Naming Standardisation

Apply standard naming conventions to all KPIs before output:

| Raw Name | Standardised |
|----------|-------------|
| Sales Value | Total Sales |
| Net Price | Revenue |
| Attrition % | Attrition Rate |
| TAT | Turnaround Time (TAT) |
| NPS Score | Net Promoter Score (NPS) |
| Avg Order | Average Order Value (AOV) |

Rules:
- Expand abbreviations unless the abbreviation is the industry standard (NPA, EBITDA, OEE)
- Use title case for all KPI names
- Include the unit or qualifier in parentheses if helpful: "Fill Rate (%)", "Cycle Time (Days)"
- Do NOT change the name if it came from the BRD verbatim — standardise only derived and fallback KPIs

---

### 8. BRD Confidence Tag (`confidence`)

Every KPI gets a confidence level reflecting how certain we are it belongs:

| Confidence | When | Source |
|------------|------|--------|
| `high` | KPI was explicitly in BRD | source: "BRD" |
| `medium` | KPI was derived from BRD fields | source: "Derived from BRD (...)" |
| `low` | KPI was added from library | source: "Industry fallback" |

This field enables downstream explainability — the render engine or a future
user-approval layer can surface low-confidence KPIs for review before the
dashboard is finalised.

---

### 9. Business Goal Mapping (`business_goal`)

Every KPI maps to exactly one business goal:

| Goal | KPI Examples |
|------|-------------|
| `growth` | Revenue, New Customers, Market Share, GMV |
| `efficiency` | TAT, OEE, Cost per Unit, Cycle Time, STP Rate |
| `profitability` | EBITDA, Net Margin, ROA, ROE, Gross Profit |
| `risk` | NPA Ratio, VaR, Provision Coverage, Default Rate |
| `customer` | NPS, CSAT, CLV, Churn Rate, Retention Rate |
| `people` | Headcount, Attrition, Engagement Score, TTH |

This connects KPIs to decision-making intent and enables future dashboard
filtering and grouping by business goal.

---

### 10. Missing KPI Suggestion Layer (`suggested_kpis`)

After producing the final 22–32 KPI list, identify up to 5 KPIs that
would logically complement the dashboard but were not included — either
because the count ceiling was reached or they weren't in the BRD.

```json
"suggested_kpis": [
  {
    "name": "Customer Lifetime Value",
    "reason": "Natural complement to CASA Ratio and Revenue per Customer",
    "source_would_be": "Industry fallback"
  }
]
```

These are NOT added to the kpiList. They are surfaced for future user
approval or an expanded dashboard version. Maximum 5 suggestions.

---

### 11. Analysis-Type Compatibility Check

After assigning all KPI types and roles, verify that the KPI list supports
the detected `analysis_type` from `domain-industry-classifier`.

| Analysis Type | Required KPI Characteristics |
|---------------|------------------------------|
| `correlation` | At least 4 numeric, independently varying KPIs |
| `trend` / `time_series` | At least 5 KPIs with time dimension (trend, MoM, growth) |
| `distribution` | At least 3 KPIs with spread/range characteristics |
| `comparison` | At least 4 KPIs that can be grouped by category |
| `funnel_pipeline` | At least 3 sequential stage-based KPIs |
| `segmentation` | At least 3 KPIs with customer/segment dimension |

If the KPI list fails the compatibility check for the detected analysis type:
- Flag in `_enhancementSummary.analysis_type_compatible: false`
- Swap the lowest-priority fallback KPIs for library KPIs that better support the analysis type
- Re-check after swap

---

### 12. Chart Type Hint (`suggested_chart`)

For every KPI, provide a lightweight chart hint based on the KPI's nature.
This is a SUGGESTION only — `chart-mapper` makes the final decision.

| KPI Nature | Suggested Chart |
|-----------|----------------|
| Trend over time | `line` |
| Two-variable relationship | `scatter` |
| Frequency/spread | `histogram` |
| Part-of-whole composition | `doughnut` |
| Ranked items | `horizontal_bar` |
| Category comparison | `clustered_bar` |
| Stage/funnel | `funnel` |
| Cumulative build | `waterfall` |
| Multi-dim over time | `stacked_bar` |

The hint is consumed by `chart-mapper` as Layer 1 tiebreaker when both
the analysis type and KPI semantics point to equal options.

---

## KPI Library (Domain + Industry Locked)

This library is internal to this skill. When enhancement is needed, select
from the section matching the input DOMAIN + INDUSTRY combination ONLY.
Never mix sections.

### [BANKING + SALES]
CASA Ratio, Deposit Growth Rate, Loan Disbursement Volume, Cross-Sell Ratio,
New Account Acquisition, Product Penetration Rate, Customer Acquisition Cost,
Revenue per Customer, Lead Conversion Rate, Branch-wise Sales Performance,
Digital Channel Acquisition, Relationship Manager Productivity, Upsell Revenue,
Wallet Share, Net Interest Margin Contribution

### [BANKING + OPERATIONS]
Account Opening TAT, Loan Processing TAT, STP Rate (Straight Through Processing),
Error Rate, Transaction Volume, Branch Operational Efficiency, ATM Uptime,
Digital Transaction Rate, Customer Query Resolution Time, Reconciliation Accuracy

### [BANKING + FINANCE]
Net Interest Margin (NIM), Return on Assets (ROA), Return on Equity (ROE),
Cost to Income Ratio, Non-Performing Assets (NPA) Ratio, Provision Coverage Ratio,
Capital Adequacy Ratio, Liquidity Coverage Ratio, Operating Expense Ratio

### [INSURANCE + SALES]
Gross Written Premium, New Business Premium, Policy Count, Renewal Rate,
Lapse Rate, Agent Productivity, Channel-wise Premium Split, Average Premium per Policy,
Conversion Rate, Cross-Sell Ratio, Persistency Ratio (13th Month), Customer Acquisition Cost

### [INSURANCE + FINANCE]
Loss Ratio, Combined Ratio, Claims Ratio, Expense Ratio, Investment Yield,
Solvency Ratio, Embedded Value, Value of New Business, Return on Embedded Value

### [MANUFACTURING + OPERATIONS]
Overall Equipment Effectiveness (OEE), Production Volume, Yield Rate, Scrap Rate,
Downtime Hours, Mean Time Between Failures (MTBF), Mean Time to Repair (MTTR),
Capacity Utilization, First Pass Yield, Cycle Time, Changeover Time,
Energy Consumption per Unit, Safety Incidents, On-Time Delivery, Inventory Turns

### [MANUFACTURING + SALES]
Order Intake Value, Order Backlog, Revenue by Product Line,
Customer Order Fulfillment Rate, Quote to Order Ratio, Average Order Value,
Customer Concentration, New Customer Revenue, Repeat Customer Rate

### [FMCG + SALES]
Primary Sales, Secondary Sales, Distribution Reach (Numeric),
Distribution Reach (Weighted), SKU Velocity, Stock Keeping Unit Performance,
Retailer Coverage, Beat Productivity, Salesman Productivity, Outlet Billing Rate,
Average Bill Value, Range Selling, New Outlet Addition, Market Share

### [FMCG + SUPPLY CHAIN]
Fill Rate, Stock Availability, Days Sales of Inventory, Warehouse Throughput,
Logistics Cost per Unit, Order to Delivery Time, Return Rate,
Distributor Stock Days, Freshness Index

### [RETAIL + SALES]
Revenue per Square Foot, Average Transaction Value, Basket Size, Footfall,
Conversion Rate, Like-for-Like Sales Growth, Sales per Employee,
Gross Margin Return on Investment (GMROI), Sell-Through Rate,
Customer Retention Rate, New Customer Acquisition, Store-wise Performance

### [RETAIL + OPERATIONS]
Inventory Turnover, Stock-Out Rate, Shrinkage Rate,
Store Operating Hours Efficiency, Checkout Time,
Returns Processing Time, Planogram Compliance

### [E-COMMERCE + SALES]
Gross Merchandise Value (GMV), Average Order Value (AOV), Conversion Rate,
Cart Abandonment Rate, Customer Acquisition Cost, Customer Lifetime Value,
Repeat Purchase Rate, Revenue per Visitor,
Mobile vs Desktop Revenue Split, Category-wise Revenue

### [E-COMMERCE + MARKETING]
Traffic Volume, Bounce Rate, Session Duration, Pages per Session,
Email Open Rate, Email Click Rate, Social Media Engagement,
Cost per Click, Return on Ad Spend (ROAS)

### [SAAS + SALES]
Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR),
Average Revenue per User (ARPU), Customer Acquisition Cost (CAC),
Customer Lifetime Value (LTV), LTV to CAC Ratio, Net Revenue Retention,
Gross Revenue Retention, Expansion Revenue, Logo Churn Rate,
Revenue Churn Rate, Sales Cycle Length, Win Rate, Pipeline Value

### [SAAS + OPERATIONS]
System Uptime, Mean Time to Resolution, Support Ticket Volume,
First Response Time, Customer Satisfaction Score (CSAT), Net Promoter Score (NPS)

### [TELECOMMUNICATIONS + SALES]
Average Revenue per User (ARPU), Subscriber Additions, Subscriber Churn Rate,
Customer Acquisition Cost, Revenue per Connection, Prepaid vs Postpaid Mix,
Data Revenue Share, Value Added Services Revenue, Recharge Frequency,
Circle-wise Revenue

### [HEALTHCARE + OPERATIONS]
Bed Occupancy Rate, Average Length of Stay, Patient Throughput,
Emergency Wait Time, Surgical Utilization Rate, Readmission Rate,
Patient Satisfaction Score, Staff to Patient Ratio, Equipment Utilization

### [LOGISTICS + OPERATIONS]
On-Time Delivery Rate, Delivery Cost per Package, Fleet Utilization,
Load Factor, Route Efficiency, Warehouse Throughput, Order Accuracy,
Damage Rate, Fuel Efficiency, Last Mile Delivery Time

---

## Metric Generation Rules

For every KPI in the final list, generate exactly 2 supporting metrics.
`metricList.length` must always equal `kpiList.length × 2`.

Metric naming patterns:
- `"[KPI Name] MTD"` — month-to-date snapshot
- `"[KPI Name] vs Prior Quarter"` — period comparison
- `"[KPI Name] by [relevant dimension]"` — breakdown
- `"[KPI Name] Growth Rate"` — rate of change
- `"[KPI Name] Trend"` — directional indicator

---

## Style Mood Selection

Select 2–4 moods based on industry and dashboard intent:

| Mood | Use When |
|------|----------|
| `executive` | Board/leadership-facing dashboards |
| `corporate` | Professional B2B presentation |
| `analytical` | Data-intensive insight views |
| `operational` | Real-time ops monitoring |
| `strategic` | Forecasting, planning, OKR |
| `modern` | Tech/SaaS clients |
| `minimal` | Simplicity prioritized |
| `administrative` | Internal back-office reporting |

---

## System Prompt (use exactly as written)

```
You are a KPI Intelligence Specialist. You receive a raw KPI list from a BRD
extraction agent and enrich it into a fully structured KPI intelligence object
ready for chart mapping and layout generation.

CRITICAL OUTPUT RULES:
- OUTPUT ONLY VALID JSON
- NO markdown, NO explanations, NO text before or after
- OUTPUT STARTS WITH { and ENDS WITH }

INPUT YOU RECEIVE:
- rawKpis: extracted KPI list from the BRD
- domain: detected business domain
- industry: detected client industry
- analysis_type: detected analysis pattern
- existingKpiNames: names already in the raw list

════════════════════════════════════════
EXECUTION ORDER — RUN ALL STEPS IN SEQUENCE
════════════════════════════════════════

STEP 1 — COUNT CHECK AND LIBRARY FILL:
  currentCount = rawKpis.total
  IF currentCount >= 22:
    → Use rawKpis.kpiList as base
    → Do NOT add library KPIs
  IF currentCount < 22:
    → slotsNeeded = 22 - currentCount
    → Select EXACTLY slotsNeeded KPIs from library matching DOMAIN + INDUSTRY
    → Never duplicate existingKpiNames
    → Tag each: "source": "Industry fallback"
  IF currentCount > 32:
    → Trim lowest priority_score derived/fallback KPIs until count = 32

STEP 2 — REDUNDANCY ELIMINATION:
  Scan full list for synonyms, duplicate logic, and near-duplicates.
  Remove the lower-priority duplicate. Replace with next library KPI
  if count falls below 22 after removal.

STEP 3 — NAMING STANDARDISATION:
  Normalise derived and fallback KPI names to standard business terminology.
  Do NOT rename BRD-sourced KPIs — keep them verbatim from the BRD.
  Expand abbreviations unless industry-standard (NPA, OEE, EBITDA are fine).
  Use title case. Add unit qualifiers in parentheses where helpful.

STEP 4 — INTELLIGENCE ENRICHMENT:
  For EVERY KPI in the list, assign ALL of the following fields:

  kpi_type: financial | operational | customer | inventory | risk | marketing | sales | hr
    (pick the single best fit)

  role:
    - "primary"    → first 4 highest priority_score KPIs
    - "supporting" → next 8–12 KPIs
    - "diagnostic" → remaining KPIs
    BRD KPIs are always promoted before fallback KPIs within each role tier.

  priority_score: integer 1–10
    - BRD KPI → base 8, +1 if in first BRD section, +1 if labelled critical
    - Derived from BRD → base 5, +1 if directly computable, +1 if high business value
    - Industry fallback → base 2, +1 if fills a coverage gap, +1 if supports analysis_type

  confidence: "high" (BRD) | "medium" (Derived) | "low" (fallback)

  business_goal: growth | efficiency | profitability | risk | customer | people
    (pick the single best fit)

  depends_on: array of KPI names or BRD field names this KPI is computed from.
    Use [] for atomic KPIs. Maximum 3 dependencies. Only real fields, never invented.

  suggested_chart: line | scatter | histogram | doughnut | horizontal_bar |
                   clustered_bar | funnel | waterfall | stacked_bar
    (lightweight hint only — chart-mapper makes the final call)

STEP 5 — KPI TYPE BALANCE CHECK:
  Count distinct kpi_type values in the final list.
  IF fewer than 3 distinct types:
    → Identify the underrepresented types
    → Replace lowest priority_score fallback KPIs with library KPIs of missing types
    → Re-check after replacement

STEP 6 — DIMENSIONAL COVERAGE CHECK:
  Verify the final list contains:
  - At least 3 KPIs with time/trend dimension (Trend, MoM, Growth, YoY)
  - At least 3 KPIs suitable for category comparison (by Segment, by Product, etc.)
  - At least 2 KPIs with distribution/spread characteristics
  IF any dimension is missing → replace lowest-priority fallback KPIs to cover it.

STEP 7 — ANALYSIS TYPE COMPATIBILITY CHECK:
  ANALYSIS TYPE: {analysis_type}
  Verify the KPI list supports this analysis type:
    correlation   → need 4+ numeric independently varying KPIs
    trend         → need 5+ KPIs with time dimension
    distribution  → need 3+ KPIs with spread characteristics
    comparison    → need 4+ KPIs groupable by category
    funnel        → need 3+ sequential stage KPIs
    segmentation  → need 3+ KPIs with customer/segment dimension
  IF incompatible → swap lowest-priority fallback KPIs for compatible ones
  Set _enhancementSummary.analysis_type_compatible: true | false

STEP 8 — DEPENDENCY MAPPING:
  For every KPI with a computable formula, populate depends_on.
  Examples:
    "Average Order Value" → depends_on: ["Revenue", "Orders"]
    "Gross Margin %" → depends_on: ["Gross Profit", "Revenue"]
    "CASA Ratio" → depends_on: ["CASA Deposits", "Total Deposits"]
  For atomic KPIs (not derived) → depends_on: []

STEP 9 — METRICS GENERATION:
  For every KPI in the final list, generate exactly 2 supporting metrics.
  metricList.length MUST equal kpiList.length × 2.
  Patterns: "[KPI] MTD" / "[KPI] vs Prior Quarter" / "[KPI] by [Dimension]" /
            "[KPI] Growth Rate" / "[KPI] Trend"

STEP 10 — STYLE MOODS:
  Select 2–4 moods appropriate for the domain and industry.
  Options: executive, corporate, analytical, operational, strategic,
           modern, minimal, administrative

STEP 11 — MISSING KPI SUGGESTIONS:
  Identify up to 5 KPIs that would complement the dashboard but were not included.
  Add to suggested_kpis array. Do NOT add them to kpiList.
  Each suggestion: { name, reason, source_would_be }

STEP 12 — PRE-OUTPUT VALIDATION:
  □ kpiList.length between 22 and 32?
  □ Every KPI has: name, source, chart_title, kpi_type, role, priority_score,
                   confidence, business_goal, depends_on, suggested_chart?
  □ At least 3 distinct kpi_type values?
  □ Exactly 4 KPIs with role: "primary"?
  □ At least 3 trend KPIs, 3 comparison KPIs, 2 distribution KPIs?
  □ No duplicate KPI names?
  □ No redundant/synonym KPIs?
  □ metricList.length = kpiList.length × 2?
  □ 2–4 style moods selected?
  □ suggested_kpis has 0–5 items?
  □ analysis_type_compatible flag set?
  □ JSON valid, no trailing commas?

DOMAIN: {domain}
INDUSTRY: {industry}
ANALYSIS TYPE: {analysis_type}
RAW KPI COUNT: {raw_total}
EXISTING KPI NAMES: {existing_kpi_names}
RAW KPI LIST: {raw_kpi_list}
```

---

## Input Schema
```json
{
  "domain": "Sales",
  "industry": "Banking",
  "subIndustry": "Retail Banking",
  "analysis_type": "performance_vs_target",
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "rawKpis": {
    "kpiList": [
      { "name": "CASA Ratio", "source": "BRD", "chart_title": "CASA Ratio Trend Over Time" }
    ],
    "_extractionSummary": {
      "brd_count": 10,
      "derived_count": 4,
      "total": 14,
      "needs_enhancement": true
    }
  }
}
```

---

## Output Schema
```json
{
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "clientEmail": "",
  "industry": "Banking",
  "domain": "Sales",
  "analysis_type": "performance_vs_target",
  "kpiList": [
    {
      "name": "CASA Ratio",
      "source": "BRD",
      "chart_title": "CASA Ratio Trend Over Time",
      "kpi_type": "financial",
      "role": "primary",
      "priority_score": 9,
      "confidence": "high",
      "business_goal": "growth",
      "depends_on": ["CASA Deposits", "Total Deposits"],
      "suggested_chart": "line"
    },
    {
      "name": "Cross-Sell Ratio",
      "source": "Industry fallback",
      "chart_title": "Cross-Sell Ratio by Product",
      "kpi_type": "sales",
      "role": "supporting",
      "priority_score": 3,
      "confidence": "low",
      "business_goal": "growth",
      "depends_on": ["Products per Customer", "Total Customers"],
      "suggested_chart": "clustered_bar"
    }
  ],
  "metricList": [
    "CASA Ratio MTD",
    "CASA Ratio vs Prior Quarter",
    "Cross-Sell Ratio by Branch",
    "Cross-Sell Ratio Growth Rate"
  ],
  "preferredStyleMoods": ["executive", "analytical", "corporate"],
  "suggested_kpis": [
    {
      "name": "Customer Lifetime Value",
      "reason": "Complements Revenue per Customer and Cross-Sell Ratio",
      "source_would_be": "Industry fallback"
    }
  ],
  "_enhancementSummary": {
    "received_count": 14,
    "library_added": 8,
    "final_count": 22,
    "enhancement_applied": true,
    "analysis_type_compatible": true,
    "redundancies_removed": 1,
    "kpi_type_distribution": {
      "financial": 8,
      "operational": 4,
      "sales": 5,
      "customer": 3,
      "risk": 2
    },
    "role_distribution": {
      "primary": 4,
      "supporting": 10,
      "diagnostic": 8
    },
    "dimensional_coverage": {
      "trend_kpis": 5,
      "comparison_kpis": 7,
      "distribution_kpis": 3
    }
  }
}
```

---

## N8N Node Configuration
```json
{
  "node_type": "AI Agent",
  "node_name": "KPI Enhancer",
  "model": "gpt-4o",
  "input_mapping": {
    "domain":         "{{ $('Domain Industry Classifier').item.json.domainIndustry.domain }}",
    "industry":       "{{ $('Domain Industry Classifier').item.json.domainIndustry.industry }}",
    "subIndustry":    "{{ $('Domain Industry Classifier').item.json.domainIndustry.subIndustry }}",
    "analysis_type":  "{{ $('Domain Industry Classifier').item.json.domainIndustry.analysis_type || 'performance_vs_target' }}",
    "clientName":     "{{ $('Domain Industry Classifier').item.json.domainIndustry.clientName }}",
    "clientWebsite":  "{{ $('Domain Industry Classifier').item.json.domainIndustry.clientWebsite }}",
    "rawKpis":        "{{ $('KPI Extractor').item.json.rawKpis }}"
  },
  "output_field": "enhancedKpis",
  "parse_json": true,
  "next_node": "Chart Mapper"
}
```

---

## Validation Rules
- `kpiList.length` must be 22–32 (pipeline aborts if outside)
- `metricList.length` must equal `kpiList.length × 2` exactly
- No duplicate KPI names in `kpiList`
- Every KPI must have all 9 fields: `name`, `source`, `chart_title`, `kpi_type`, `role`, `priority_score`, `confidence`, `business_goal`, `depends_on`, `suggested_chart`
- At least 3 distinct `kpi_type` values across the KPI list
- Exactly 4 KPIs with `role: "primary"`
- `priority_score` range: BRD KPIs 8–10, Derived 5–7, Fallback 2–4
- `confidence` must match source: BRD→high, Derived→medium, fallback→low
- `depends_on` must be an array (empty `[]` is valid for atomic KPIs)
- `suggested_kpis` must contain 0–5 items, never added to `kpiList`
- `_enhancementSummary.analysis_type_compatible` must be boolean
- `_enhancementSummary.role_distribution.primary` must equal 4
- `_enhancementSummary.dimensional_coverage.trend_kpis` must be ≥ 3
- `_enhancementSummary.dimensional_coverage.comparison_kpis` must be ≥ 3
- `_enhancementSummary.dimensional_coverage.distribution_kpis` must be ≥ 2

---

## Error Handling
| Condition | Action |
|-----------|--------|
| `rawKpis.total = 0` | All 22 from library; `enhancement_applied: true`, all confidence = `low` |
| `rawKpis.total >= 22` | Pass through; `enhancement_applied: false`; still run Steps 2–12 |
| `rawKpis.total > 32` | Trim lowest `priority_score` fallback/derived KPIs to 32; log trimmed names |
| Fewer than 3 distinct `kpi_type` values | Replace lowest-priority fallback KPIs with library KPIs of missing types |
| Dimensional coverage gap | Replace lowest-priority fallback KPIs with KPIs covering the missing dimension |
| `analysis_type_compatible: false` after swap | Flag in summary; do not abort — output best available list |
| Redundancy found | Remove lower-priority duplicate; replace if count < 22 |
| Library section not found for domain+industry | Use closest domain match; note in `_enhancementSummary` |
| Library exhausted before filling all slots | Pull from adjacent section; flag in `_enhancementSummary` |
| `depends_on` field cannot be determined | Set to `[]` — never invent dependencies |
| BRD KPI name needs standardisation | Keep verbatim from BRD — only standardise derived and fallback KPIs |

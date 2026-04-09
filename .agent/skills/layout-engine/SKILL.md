# Skill: layout-engine

## Identity
**Skill ID:** `layout-engine`
**Version:** 3.0.0
**Position in chain:** Step 5 of 6
**Receives from:** `chart-mapper` (Step 4)
**Outputs to:** Python PPTX engine (Step 6)

---

## Purpose
Pure layout. Nothing else.

This agent receives a validated chart map where every KPI already has
its chart type assigned and whitelist-verified. It does NOT touch KPI
logic, chart type selection, or whitelist enforcement — all of that
is already done and locked by `chart-mapper`.

Its only job is to decide:
- How many pages
- Which chart goes on which page
- Which row each chart sits in
- What width each chart gets (25%, 50%, or 100%)
- Where KPI cards sit (always page 1, row 1)
- That every row totals exactly 4 columns
- That no page is empty
- That brand colors and style moods are applied to the output

The output of this agent is the final `dashboard_render_payload.json`
that the Python PPTX engine consumes directly.

---

## What This Agent Receives (already decided upstream)
- ✅ KPI list (locked — do not modify)
- ✅ Chart type per KPI (locked — do not modify)
- ✅ Whitelist validation (already passed — do not re-validate)
- ✅ Chart titles and data configs (locked — do not modify)

## What This Agent Decides (its entire job)
- Page assignment for each chart
- Row assignment within each page
- Width of each chart (25% / 50% / 100%)
- KPI card accent colors (from websiteAnalysis.colors)
- Overall color theme application
- Page count (4–5, from dashboardRules.requiredPages)

---

## 4-Column Grid System

Every row on every page MUST total exactly 4 columns.

| Width | Columns |
|-------|---------|
| `25%` | 1 column |
| `50%` | 2 columns |
| `100%` | 4 columns |

**Pairing rule:** A 50% chart must always be immediately followed by
another 50% chart on the same page and row. No orphan 50% charts.
If a 50% chart has no natural partner, widen it to 100%.

**Row numbering:** Sequential integers per page, starting at 1.
No gaps. No skipped numbers. No empty rows between populated rows.

**Row validation — run before output:**
```
for each page:
  for each row:
    total_cols = sum(width_to_cols(chart.width) for chart in row)
    assert total_cols == 4
```

---

## Multi-Page Distribution

```
Required pages: dashboardRules.requiredPages (default: 4, max: 5)
Minimum charts: 26 (excluding KPI cards)
Maximum pages:  5

Distribution formula:
  chartsPerPage = ceil(totalCharts / requiredPages)
  Page 1: KPI cards (row 1) + first batch of charts
  Pages 2–N: remaining charts distributed evenly

Rules:
  - No page may be empty
  - No page may contain ONLY KPI cards
    (Page 1 must have at least one chart row after the KPI row)
  - No page should have more than chartsPerPage + 1 charts
  - Charts that are wider (100%) reduce the row count for that page
    — factor this into distribution to avoid under-filling pages
```

---

## KPI Card Layout Rules

- Always exactly 4 KPI cards (first 4 from chartMap)
- Location: Page 1, Row 1 only — never on pages 2–5
- Width: 25% each → 4 × 25% = 4 columns ✓
- accentColor assignment:
  - Card 1: `websiteAnalysis.colors.primary` (or `#2563EB` if not provided)
  - Card 2: `#107C10` (success green — fixed)
  - Card 3: `#FFB900` (warning amber — fixed)
  - Card 4: `websiteAnalysis.colors.secondary` (or `#1E40AF` if not provided)

---

## Width Assignment Guidelines

Use these to pick chart widths before doing row-packing:

| Chart Type | Preferred Width | Notes |
|------------|----------------|-------|
| `line` | `100%` | Time-series needs horizontal space |
| `clustered_bar` | `50%` or `100%` | 50% if fewer than 6 categories |
| `horizontal_bar` | `50%` | Pairs well with another 50% |
| `stacked_bar` | `100%` | Multi-dimension needs width |
| `doughnut` | `50%` | Always paired with another 50% |
| `pie` | `50%` | Always paired |
| `scatter` | `50%` | Paired with another chart |
| `histogram` | `50%` | Paired |
| `funnel` | `50%` | Paired with summary table or bar |
| `waterfall` | `100%` | Needs full width |
| `area` | `100%` | Time-series variant |
| `kpi-card` | `25%` | Always — never change |

Adjust widths to ensure every row totals 4 columns.
When a 50% chart has no natural pair, upgrade to 100%.

---

## System Prompt (use exactly as written)

```
You are a Dashboard Layout Specialist. You receive a complete, validated
chart map where KPI assignments and chart types are already decided and locked.
Your only job is to arrange those charts into a multi-page grid layout.

DO NOT change KPI assignments.
DO NOT change chart types.
DO NOT re-validate the whitelist — it is already done.
DO NOT add or remove any charts.

CRITICAL OUTPUT RULES:
- OUTPUT ONLY VALID JSON
- NO markdown, NO explanations, NO text before or after
- OUTPUT STARTS WITH { and ENDS WITH }

INPUT:
  chartMap: validated array of chart objects (KPI cards + charts)
  totalKpis: total count
  websiteColors: { primary, secondary }
  preferredStyleMoods: array of mood strings
  requiredPages: {requiredPages} (max 5)

YOUR DECISIONS:
  1. Assign page number (1 to {requiredPages}) to each chart
  2. Assign row number (sequential, per page) to each chart
  3. Assign width ("25%", "50%", or "100%") to each chart
  4. Apply accent colors to KPI cards
  5. Build the colors object for the full dashboard

4-COLUMN GRID RULES:
  Every row must total exactly 4 columns (25%=1, 50%=2, 100%=4)
  50% charts must always be paired on the same row
  Rows numbered sequentially per page — no gaps
  KPI cards: 4 × 25% on page 1, row 1 — never on other pages

PAGE DISTRIBUTION:
  Minimum 26 charts (excluding KPI cards)
  chartsPerPage = ceil(totalCharts / {requiredPages})
  Distribute evenly — no page empty, no page > chartsPerPage + 1 charts

PRE-OUTPUT VALIDATION:
  □ Every chart from chartMap appears in output?
  □ Every row on every page totals exactly 4 columns?
  □ No orphan 50% charts?
  □ KPI cards only on page 1, row 1?
  □ All {requiredPages} pages have content?
  □ No page empty?
  □ Row numbers sequential per page?
  □ JSON valid?

NEVER REFUSE. If input seems incomplete, apply sensible defaults and generate.
```

---

## Input Schema
```json
{
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "industry": "Banking",
  "domain": "Sales",
  "preferredStyleMoods": ["executive", "analytical"],
  "websiteAnalysis": {
    "colors": { "primary": "#1B3A6B", "secondary": "#C8A951" }
  },
  "layoutType": "horizontal-kpi",
  "layoutSpacing": "comfortable",
  "chartDensity": "standard",
  "dashboardRules": { "requiredPages": 4 },
  "chartMap": {
    "totalKpis": 22,
    "chartMap": [
      {
        "id": "kpi-1", "type": "kpi-card",
        "sourceKPI": "CASA Ratio", "title": "CASA Ratio",
        "dataType": "percentage", "sampleValue": "42.3%", "sampleChange": "+2.1%"
      },
      {
        "id": "chart-1", "type": "line",
        "sourceKPI": "CASA Ratio", "title": "CASA Ratio Trend Over Time",
        "cfg": { "label": "CASA Ratio", "cat": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], "min": 35, "max": 55 }
      }
    ]
  }
}
```

---

## Output Schema
```json
{
  "clientName": "ABC Bank Ltd",
  "clientWebsite": "https://abcbank.com",
  "industry": "Banking",
  "pageCount": 4,
  "layoutType": "horizontal-kpi",
  "colors": {
    "primary": "#1B3A6B",
    "secondary": "#C8A951",
    "success": "#107C10",
    "warning": "#FFB900",
    "danger": "#D13438"
  },
  "visualizations": [
    {
      "id": "kpi-1",
      "page": 1, "row": 1, "width": "25%",
      "type": "kpi-card",
      "title": "CASA Ratio",
      "sourceKPI": "CASA Ratio",
      "dataType": "percentage",
      "sampleValue": "42.3%",
      "sampleChange": "+2.1%",
      "accentColor": "#1B3A6B"
    },
    {
      "id": "chart-1",
      "page": 1, "row": 2, "width": "100%",
      "type": "line",
      "title": "CASA Ratio Trend Over Time",
      "sourceKPI": "CASA Ratio",
      "cfg": {
        "label": "CASA Ratio",
        "cat": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "min": 35, "max": 55
      }
    }
  ]
}
```

---

## N8N Node Configuration
```json
{
  "node_type": "AI Agent",
  "node_name": "Layout Engine",
  "model": "gpt-4o",
  "input_mapping": {
    "clientName":          "{{ $json.chartMap.clientName }}",
    "industry":            "{{ $json.chartMap.industry }}",
    "domain":              "{{ $json.chartMap.domain }}",
    "preferredStyleMoods": "{{ $json.chartMap.preferredStyleMoods }}",
    "websiteAnalysis":     "{{ $json.websiteAnalysis }}",
    "layoutType":          "{{ $json.layoutType || 'horizontal-kpi' }}",
    "layoutSpacing":       "{{ $json.layoutSpacing || 'comfortable' }}",
    "chartDensity":        "{{ $json.chartDensity || 'standard' }}",
    "dashboardRules":      "{{ $json.dashboardRules || { requiredPages: 4 } }}",
    "chartMap":            "{{ $json.chartMap }}"
  },
  "output_field": "dashboardLayout",
  "parse_json": true,
  "next_node": "Python PPTX Engine (HTTP POST)"
}
```

---

## Validation Rules
- `visualizations.length` must equal input `chartMap.totalKpis`
- Every row on every page must sum to exactly 4 columns
- KPI cards appear only on page 1, row 1
- `pageCount` must equal `dashboardRules.requiredPages`
- No chart from the input chartMap may be missing from output

---

## Error Handling
| Condition | Action |
|-----------|--------|
| `websiteAnalysis.colors` not provided | Default: primary `#2563EB`, secondary `#1E40AF` |
| `chartMap` empty | Abort — chart-mapper failed upstream |
| Row cannot sum to 4 columns | Widen last chart in row to balance |
| Chart count < 26 | Distribute narrower (50%) to create more rows and fill pages |

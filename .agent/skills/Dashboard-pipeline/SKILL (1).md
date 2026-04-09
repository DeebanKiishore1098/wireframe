# Skill: dashboard-pipeline

## Identity
**Skill ID:** `dashboard-pipeline`
**Version:** 3.0.0
**Type:** Orchestrator — instruction document, not an agent
**Chains:** 6 skills in sequence with 1 parallel pair at the start

---

## Purpose
Master orchestrator. Defines the execution order, data flow,
and quality gates for the complete BRD → Dashboard PPTX pipeline.

This is not an agent. It makes no LLM calls. It produces no output.
It exists so Antigravity (or N8N) knows exactly what to run, in what
order, with what inputs, and what to check between steps.

---

## Pipeline Architecture (v3)

```
INPUT
  ├── BRD text (from Azure Document Intelligence)
  └── websiteAnalysis.colors (from website scraper, upstream)

         ┌─────────────────────┬──────────────────────┐
         │  (parallel)         │  (parallel)          │
         ▼                     ▼                      │
  STEP 1                STEP 2                       │
  domain-industry-      kpi-extractor                │
  classifier            (pure extraction)            │
                                │                    │
  Output:               Output:                      │
  domain, industry,     raw kpiList                  │
  subIndustry,          (whatever BRD had,           │
  clientName,            no minimum enforced)        │
  clientWebsite                 │                    │
         │                      │                    │
         └──────────┬───────────┘                    │
                    ▼                                │
             STEP 3                                  │
             kpi-enhancer                            │
             (single count authority)                │
             Checks raw count:                       │
               >= 22 → pass through                  │
               < 22  → fills from library            │
             Always outputs exactly 22–32 KPIs       │
             Generates metrics (2×) + style moods    │
                    │                                │
                    ▼                                │
             STEP 4  ◄────────────────────────────┘
             chart-mapper
             (whitelist enforcement + chart type per KPI)
             Locks the KPI list
             Assigns chart type to every KPI
             Runs 4-step whitelist scan
             Applies distribution caps
                    │
                    ▼
             STEP 5
             layout-engine
             (grid + pages + distribution)
             Assigns page, row, width to every chart
             Applies brand colors
             Enforces 4-column grid
             Distributes across 4–5 pages
             Outputs final dashboard_render_payload.json
                    │
                    ▼
             STEP 6
             Python PPTX engine (dashboard_layout_engine.py)
             Deterministic rendering — no LLM
             Reads render payload → writes .pptx
                    │
                    ▼
             .pptx OUTPUT
```

---

## Why Each Split Exists

**Steps 1+2 in parallel:** Both read the raw BRD text independently.
Step 1 cares about *who the client is*. Step 2 cares about *what to measure*.
They don't need each other to start — running them together saves time.

**Step 2 → Step 3 (kpi-extractor → kpi-enhancer):**
Extraction and count enforcement are different responsibilities.
`kpi-extractor` reports what it found — it cannot fail.
`kpi-enhancer` owns the 22–32 guarantee — it fixes what's missing.
Splitting them means if the count is wrong, you know exactly which
agent to debug. In v2, the conditional branch was external (an IF node).
Now it's internal to `kpi-enhancer` — cleaner, one authority.

**Step 4 → Step 5 (chart-mapper → layout-engine):**
KPI-to-chart assignment and spatial layout are different responsibilities.
`chart-mapper` answers "what type of chart does this KPI get?"
`layout-engine` answers "where on which page does this chart go?"
Splitting them means whitelist bugs and layout bugs are in separate,
inspectable agents. In v2 the old `chart-layout-engine` did both,
making it the heaviest and most failure-prone agent in the chain.

**Step 6 (Python engine):**
Rendering is deterministic — no LLM needed. Pure code. Splitting
the layout decision (Step 5, LLM) from the render execution (Step 6, Python)
means the LLM never touches pixel positions — it only makes layout decisions.
Python translates those decisions into exact coordinates.

---

## Context Object Evolution

```
After Steps 1+2 (parallel outputs, merged):
{
  domain, industry, subIndustry,
  clientName, clientWebsite, clientEmail,
  domain_confidence, industry_confidence,
  rawKpis: { kpiList, _extractionSummary }
}

After Step 3 (kpi-enhancer):
{
  ...above...,
  enhancedKpis: {
    kpiList,       ← 22–32 items, final
    metricList,    ← kpiList.length × 2
    preferredStyleMoods,
    _enhancementSummary
  }
}

After Step 4 (chart-mapper):
{
  ...above...,
  chartMap: {
    totalKpis,
    chartMap,      ← every KPI mapped to chart type, whitelist clean
    _mappingSummary
  }
}

After Step 5 (layout-engine):
{
  ...above...,
  dashboardLayout: {
    clientName, industry, pageCount, layoutType, colors,
    visualizations  ← every chart with page, row, width assigned
  }
}

→ dashboardLayout goes to Python PPTX engine as render payload
→ Python engine writes .pptx and returns binary
```

---

## Antigravity Usage

```
SKILL: dashboard-pipeline
VERSION: 3.0.0

INPUT:
  brd_text:         <string from Azure Document Intelligence>
  websiteAnalysis:  <{ colors: { primary, secondary } }>
  layoutType:       "horizontal-kpi"  (optional, default)
  layoutSpacing:    "comfortable"     (optional, default)
  chartDensity:     "standard"        (optional, default)
  dashboardRules:   { requiredPages: 4 } (optional, default)

EXECUTION ORDER:
  Step 1 + Step 2: domain-industry-classifier + kpi-extractor (parallel)
  Step 3:          kpi-enhancer
  Step 4:          chart-mapper
  Step 5:          layout-engine
  Step 6:          Python PPTX engine (HTTP POST to /render)

OUTPUT: .pptx binary file
```

---

## N8N Full Workflow Map

```
[Trigger / File Upload]
        │
        ▼
[Azure Document Intelligence]   HTTP Request
        │ extracted_text
        ├───────────────────────────────────┐
        ▼                                   ▼
[Domain Industry Classifier]    [KPI Extractor]
 Step 1 — AI Agent              Step 2 — AI Agent
 → domainIndustry               → rawKpis
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
              [Merge Step1 + Step2]   Set node
                       │
                       ▼
              [KPI Enhancer]          Step 3 — AI Agent
              (internal count check + library if needed)
              → enhancedKpis
                       │
                       ▼
              [Chart Mapper]          Step 4 — AI Agent
              (whitelist + chart type assignment)
              → chartMap
                       │
                       ▼
              [Layout Engine]         Step 5 — AI Agent
              (grid + pages + colors)
              → dashboardLayout
                       │
                       ▼
              [Python PPTX Engine]    Step 6 — HTTP POST
              → .pptx binary
                       │
                       ▼
              [Return / Store PPTX]
```

---

## Quality Gates

| Gate | After Step | Condition | Action |
|------|-----------|-----------|--------|
| G1 | Step 1 | `domain_confidence == "low"` | Flag; continue with warning |
| G2 | Step 2 | `rawKpis.kpiList` is null | Abort; BRD unreadable |
| G3 | Step 3 | `enhancedKpis.kpiList.length` outside 22–32 | Abort; kpi-enhancer failed |
| G4 | Step 3 | `metricList.length != kpiList.length × 2` | Abort; metric ratio broken |
| G5 | Step 4 | Any `sourceKPI` not in `kpiList` | Re-trigger chart-mapper with violation list |
| G6 | Step 4 | `chartMap.length != totalKpis` | Abort; missing KPI coverage |
| G7 | Step 5 | Any row column sum != 4 | Re-trigger layout-engine |
| G8 | Step 5 | `visualizations.length != totalKpis` | Abort; chart dropped in layout |

---

## What Changed from v2.0

| Area | v2.0 | v3.0 |
|------|------|------|
| KPI count authority | Split between kpi-extraction-engine + conditional branch + industry-kpi-library | Single agent: `kpi-enhancer` owns it entirely |
| Conditional IF node | External N8N IF node | Internal to `kpi-enhancer` — no external branch |
| Chart layout | One overloaded agent did KPI enforcement + chart type + grid + pages | Split: `chart-mapper` (KPI + type) / `layout-engine` (grid + pages) |
| Whitelist enforcement | Inside chart-layout-engine | Inside `chart-mapper` — separate, debuggable |
| Total AI agents | 4 | 5 (cleaner single-responsibility) |
| Total pipeline steps | 5 | 6 |
| Debuggability | Medium — overloaded agents hide bugs | High — every agent has one job |

---

## File Reference

```
skills/
├── dashboard-pipeline/SKILL.md            ← This file (orchestrator v3)
├── domain-industry-classifier/SKILL.md   ← Step 1
├── kpi-extractor/SKILL.md                ← Step 2
├── kpi-enhancer/SKILL.md                 ← Step 3 (replaces extraction-engine + library)
├── chart-mapper/SKILL.md                 ← Step 4 (whitelist + chart type only)
└── layout-engine/SKILL.md                ← Step 5 (grid + pages only)

DEPRECATED (do not use):
  kpi-extraction-engine/   ← replaced by kpi-extractor + kpi-enhancer
  industry-kpi-library/    ← merged into kpi-enhancer
  chart-layout-engine/     ← replaced by chart-mapper + layout-engine
  domain-detector/         ← replaced by domain-industry-classifier
  analysis-type-detector/  ← removed entirely (never in real N8N agents)
  kpi-extractor/ (v2)      ← replaced by this v3 version

src/
├── dashboard_layout_engine.py    ← Step 6 Python renderer
├── dashboard_templates.json      ← 20 template position specs
└── generate_demo_dashboards.py   ← Test runner
```

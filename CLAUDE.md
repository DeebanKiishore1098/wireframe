# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev        # Starts Next.js on port 5004

# Build & run production
npm run build
npm start

# Validation (before commits)
python .agent/scripts/checklist.py .

# Full pre-deploy verification (requires running app)
python .agent/scripts/verify_all.py . --url http://localhost:5004
```

## Required Environment Variables

Create `.env.local` with:

```
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_INSTANCE_NAME=
AZURE_OPENAI_API_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=
AZURE_OPENAI_BASE_PATH=
AZURE_OPENAI_ENDPOINT=
AZURE_DOC_INTELLIGENCE_ENDPOINT=
AZURE_DOC_INTELLIGENCE_KEY=
NEXT_PUBLIC_WEBHOOK_URL=   # Optional; falls back to /api/webhook
```

## Architecture

**IntelliFrame** is a Next.js 16 app (React 19, Tailwind v4, TypeScript) that converts BRD documents (`.pdf` / `.docx`) into visual mockups via an AI pipeline. Python is required at runtime — the server generates Python scripts on the fly and executes them to produce PPTX files.

### Request Flow

```
Frontend (page.js)
  └── POST /api/webhook  (src/app/api/webhook/route.ts)
        ├── Phase 1: documentParser.ts  — pdf-parse / mammoth → raw text
        ├── [PPTX paths] extractStructuredDataFromDI  — Azure Document Intelligence polling loop
        │
        ├── generatorType == "dashboard-wireframe"  (HTML output)
        │     ├── classifyKpiPresence → runKpiAgent OR runDomainClassificationAgent + runKpiGeneratorAgent
        │     ├── generateWebsiteTheme (dataTransformers.ts)
        │     ├── runChartTypesAgent
        │     └── generateHybridDashboardHTML (dashboardGenerator.ts) → returns HTML blob
        │
        ├── generatorType == "application-wireframe"  (PPTX output)
        │     ├── extractStructuredDataFromDI
        │     ├── runApplicationBriefAgent
        │     ├── runWireframeGeneratorAgent → Python script string
        │     └── exec python script → PPTX file → stream response
        │
        ├── generatorType == "application-pptx"  (PPTX output)
        │     └── same as above but uses runPptxGeneratorAgent
        │
        └── generatorType == "dashboard-pptx"  (PPTX output)
              ├── full KPI/domain pipeline
              ├── runDashboardPptxGeneratorAgent → Python script string
              └── exec python script → PPTX file → stream response
```

### Key Files

| File | Purpose |
|------|---------|
| `src/app/api/webhook/route.ts` | Single API endpoint; orchestrates all generation workflows |
| `src/utils/aiAgents.ts` | All LLM agent functions (Azure OpenAI via LangChain); also contains Azure DI polling |
| `src/utils/documentParser.ts` | Parses PDF/DOCX buffers to plain text |
| `src/utils/dashboardGenerator.ts` | Builds the HTML dashboard output for `dashboard-wireframe` |
| `src/utils/dataTransformers.ts` | Processes agent JSON → structured KPI/theme data |
| `src/utils/styleRegistry.ts` | Visual style definitions reused by generators |
| `src/utils/themeEngine.ts` | Theme computation utilities |
| `src/app/page.js` | Landing page — routes to `/dashboard` or `/wireframe` |
| `src/app/dashboard/page.js` | Dashboard generator UI (HTML, PDF wireframe, PPTX slide deck) |
| `src/app/wireframe/page.js` | Application wireframe UI (PPTX-only path) |

### PPTX Generation Pattern

For all PPTX outputs, the server:
1. Calls an LLM agent to produce a complete Python script (using `python-pptx`)
2. Writes it to a temp file in `process.cwd()` (project root)
3. Executes it with `python "<script>" --output "<output.pptx>"`
4. Reads and streams the resulting file
5. Cleans up both temp files via `safeUnlink` (handles Windows `EBUSY`)

Temporary files follow the pattern `gen_*_<timestamp>.py` and `output_*_<timestamp>.pptx` — if you see these in the project root, they are leaked from a failed run.

### LLM Models

`createAzureModel(maxTokens)` is the standard factory used by all agents. `createAzureO1SeriesModel()` exists for complex code generation tasks and targets the `o1-preview` deployment hardcoded.

### `maxDuration = 300`

The webhook route sets Next.js `maxDuration = 300` (5 min) to accommodate long LLM + Python execution chains.

### `generatorType` Values (API Contract)

The `generatorType` form field controls which pipeline branch runs in `route.ts`. Valid values:

| Value | Output | Pipeline |
|-------|--------|---------|
| `dashboard-wireframe` | HTML file | KPI extraction → theme → chart agent → `dashboardGenerator.ts` |
| `application-wireframe` | PPTX | Azure DI → brief agent → wireframe agent → Python exec |
| `application-pptx` | PPTX | Azure DI → brief agent → PPTX agent → Python exec |
| `dashboard-pptx` | PPTX | KPI pipeline → dashboard PPTX agent → Python exec |

Any unrecognised value silently falls through to the `dashboard-wireframe` path.

## IFBackend Sub-Project

`IFBackend/` is a separate, simpler Next.js app (runs on default port 3000) that contains an older, HTML-only version of the dashboard pipeline. It does **not** support PPTX outputs, Azure Document Intelligence, or the `generatorType` routing. Its API route is `POST /api/webhook/[id]` and only runs the 2-agent KPI → chart → HTML flow.

It shares the same utility shape (`aiAgents.ts`, `documentParser.ts`, `dashboardGenerator.ts`, `dataTransformers.ts`) but these are independent copies — changes in one do not affect the other.

```bash
# Run IFBackend independently
cd IFBackend && npm run dev   # port 3000
cd IFBackend && npm run lint
```

> See `IFBackend/AGENTS.md` — it warns that the bundled Next.js version has breaking changes from standard docs.

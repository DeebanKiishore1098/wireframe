import { AzureChatOpenAI } from "@langchain/openai";

// Shared Azure model factory — declared first so all agents below can use it
const createAzureModel = (maxTokens: number = 8000) => {
  return new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    azureOpenAIBasePath: process.env.AZURE_OPENAI_BASE_PATH,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    temperature: 0.1,
    modelKwargs: { max_completion_tokens: maxTokens },
  });
};

const createAzureO1SeriesModel = () => {
  return new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: "o1-preview", // Assume O1 for complex code gen
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-09-01-preview",
    azureOpenAIBasePath: process.env.AZURE_OPENAI_BASE_PATH,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    temperature: 1,
  });
};


export { createAzureModel };

// ============================================================
// AZURE DOCUMENT INTELLIGENCE UTILITY (Input Contract v2.0)
// ============================================================
export async function extractStructuredDataFromDI(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  content: string;
  tables: any[];
  pages: any[];
  paragraphs?: any[];
  keyValuePairs?: any[];
}> {
  const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
  const apiKey = process.env.AZURE_DOC_INTELLIGENCE_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Azure Document Intelligence credentials missing in .env.local");
  }

  try {
    console.log('[Azure DI] Sending document to prebuilt-layout model...');

    const analyzeUrl = `${endpoint.replace(/\/$/, '')}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`;
    const submitRes = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': fileName.endsWith('.pdf') ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      body: fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      ) as ArrayBuffer,
    });

    if (!submitRes.ok) throw new Error(`DI submit failed: ${submitRes.status}`);

    const operationLocation = submitRes.headers.get('Operation-Location');
    if (!operationLocation) throw new Error('No Operation-Location header');

    // Poll for result (max 45s)
    let diResult: any = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });
      const pollBody = await pollRes.json();
      if (pollBody.status === 'succeeded') { diResult = pollBody; break; }
      if (pollBody.status === 'failed') throw new Error('DI analysis failed');
    }

    if (!diResult) throw new Error('DI polling timed out');

    const result = diResult.analyzeResult;
    return {
      content: result.content || "",
      tables: result.tables || [],
      pages: result.pages || [],
      paragraphs: result.paragraphs || [],
      keyValuePairs: result.keyValuePairs || []
    };

  } catch (err: any) {
    console.error(`[Azure DI] Critical Error: ${err.message}`);
    throw err;
  }
}

/**
 * Prunes the Azure DI JSON to remove coordinates and other token-heavy metadata.
 * Keeps only text and structure.
 */
function pruneDiJson(diJson: any): any {
  if (typeof diJson !== 'object' || diJson === null) return diJson;

  const pruned: any = {
    content: diJson.content || "", // Markdown content
    tables: [],
    paragraphs: []
  };

  // 1. Prune Tables
  if (Array.isArray(diJson.tables)) {
    pruned.tables = diJson.tables.map((table: any) => ({
      rowCount: table.rowCount,
      columnCount: table.columnCount,
      cells: (table.cells || []).map((cell: any) => ({
        rowIndex: cell.rowIndex,
        columnIndex: cell.columnIndex,
        content: cell.content || ""
      }))
    }));
  }

  // 2. Prune Paragraphs (Only if not already in 'content' properly)
  if (Array.isArray(diJson.paragraphs)) {
    pruned.paragraphs = diJson.paragraphs.map((p: any) => ({
      role: p.role,
      content: p.content || ""
    }));
  }

  // 3. Remove 'pages' entirely (it's massive and mostly coordinates)
  // We don't include 'pages' in 'pruned'

  return pruned;
}


// ============================================================
// DOCUMENT & KPI PRESENCE CLASSIFIER
// ============================================================
export async function classifyKpiPresence(
  fileBuffer: Buffer,
  fileName: string,
  extractedText: string
): Promise<{
  hasKPIs: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  kpiSignals: string[];
}> {
  try {
    const diData = await extractStructuredDataFromDI(fileBuffer, fileName);
    const diText = diData.content;
    const hasTables = diData.tables.length > 0;

    const lowerText = diText.toLowerCase();
    const signals: string[] = [];
    let hitCount = 0;

    const strongKpiKeywords = [
      'kpi', 'key performance indicator', 'metric', 'measure', 'scorecard',
      'target', 'actual', 'variance', 'benchmark', 'threshold',
      'revenue', 'sales', 'profit', 'margin', 'cost', 'growth',
      'conversion rate', 'churn', 'retention', 'nps', 'csat', 'roi',
      'oee', 'uptime', 'throughput', 'yield', 'utilization',
      'arpu', 'mrr', 'arr', 'ltv', 'cac', 'gmv', 'aov',
      '%', 'percent', 'ratio', 'index', 'score',
    ];

    const tablePatterns = [
      /kpi\s*name/i, /metric\s*name/i, /target\s*value/i, /actual\s*value/i,
      /performance\s*indicator/i, /measure\s*name/i, /key\s*measure/i,
      /\|\s*\w+\s*\|/,
      /kpis?\s*:/i, /metrics?\s*:/i,
    ];

    for (const kw of strongKpiKeywords) {
      if (lowerText.includes(kw)) { signals.push(kw); hitCount++; }
    }
    for (const pat of tablePatterns) {
      if (pat.test(diText)) { signals.push(`pattern:${pat.source}`); hitCount += 2; }
    }
    if (hasTables) { signals.push('structured-tables-detected'); hitCount += 3; }

    const hasKPIs = hitCount >= 5;
    const confidence = hitCount >= 10 ? 'high' : hitCount >= 5 ? 'medium' : 'low';

    return { hasKPIs, confidence, reason: `Azure Document Intelligence: ${hitCount} KPI signals found`, kpiSignals: signals.slice(0, 10) };
  } catch (diErr: any) {
    console.warn(`[KPI Classifier] Azure DI failed (${diErr.message}), falling back to heuristic.`);
  }

  const lowerText = extractedText.toLowerCase();
  const signals: string[] = [];
  let hitCount = 0;

  const strongKpiKeywords = [
    'kpi', 'key performance indicator', 'metric', 'measure', 'scorecard',
    'target', 'actual', 'variance', 'benchmark', 'threshold',
    'revenue', 'sales', 'profit', 'margin', 'cost', 'growth',
    'conversion rate', 'churn', 'retention', 'nps', 'csat', 'roi',
    '%', 'percent', 'ratio', 'index', 'score',
  ];

  for (const kw of strongKpiKeywords) {
    if (lowerText.includes(kw)) { signals.push(kw); hitCount++; }
  }

  const hasKPIs = hitCount >= 5;
  const confidence = hitCount >= 10 ? 'high' : hitCount >= 5 ? 'medium' : 'low';

  return { hasKPIs, confidence, reason: `Heuristic: ${hitCount} KPI signals found`, kpiSignals: signals.slice(0, 10) };
}

// ============================================================
// AGENT 3: Domain-Industry Classification Agent
// ============================================================
export async function runDomainClassificationAgent(documentText: string): Promise<{
  domain: string;
  industry: string;
  subIndustry: string;
  clientName: string;
  clientWebsite: string;
  confidence: { domain: string; industry: string };
  reasoning: { domainIndicators: string[]; industryIndicators: string[] };
}> {
  const model = createAzureModel(2000);

  const prompt = `You are a Business Document Analyst. Classify the document by DOMAIN and INDUSTRY.
OUTPUT VALID JSON ONLY. NO MARKDOWN.
{
  "domain": "[DOMAIN]",
  "industry": "[INDUSTRY]",
  "subIndustry": "[SUB-INDUSTRY]",
  "clientName": "[CLIENT NAME]",
  "clientWebsite": "[URL]",
  "confidence": { "domain": "high", "industry": "high" },
  "reasoning": { "domainIndicators": [], "industryIndicators": [] }
}
DOCUMENT CONTENT:
${documentText}`;

  try {
    const res = await model.invoke(prompt);
    let cleaned = res.content.toString().replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    return {
      domain: 'Sales', industry: 'General', subIndustry: 'General',
      clientName: 'Unknown Client', clientWebsite: '',
      confidence: { domain: 'low', industry: 'low' },
      reasoning: { domainIndicators: [], industryIndicators: [] }
    };
  }
}

// ============================================================
// AGENT 4: Industry KPI Generator Agent
// ============================================================
export async function runKpiGeneratorAgent(domainIndustry: {
  domain: string; industry: string; subIndustry: string;
  clientName: string; clientWebsite: string;
}): Promise<string> {
  const model = createAzureModel(4000);
  const prompt = `Generate a KPI list for ${domainIndustry.domain} in ${domainIndustry.industry}.
OUTPUT VALID JSON: { "clientName": "...", "kpiList": [], "metricList": [] }
KPIS: 22-32. METRICS: 2x KPIs.`;

  try {
    const res = await model.invoke(prompt);
    return res.content.toString();
  } catch (err: any) {
    throw new Error(`KpiGenerator failed: ${err.message}`);
  }
}

// ============================================================
// AGENT 1: Extraction Agent
// ============================================================
export async function runKpiAgent(brdText: string): Promise<string> {
  const model = createAzureModel(8000);
  const prompt = `Extract KPIs from BRD. 22-32 KPIs.
OUTPUT VALID JSON ONLY: { "clientName": "...", "kpiList": [], "metricList": [] }
BRD CONTENT:
${brdText}`;

  try {
    const res = await model.invoke(prompt);
    return res.content.toString();
  } catch (err: any) {
    throw new Error(`Extraction Agent Failed: ${err.message}`);
  }
}

// ============================================================
// AGENT 2: Chart Types Agent
// ============================================================
export async function runChartTypesAgent(themeData: any): Promise<string> {
  const model = createAzureModel(16000);
  const kpiListStr = JSON.stringify(themeData.kpiList || []);
  const clientName = themeData.clientName || 'Dashboard';
  const industry = themeData.industry || 'Business';
  const domainContext = themeData._domainInsightContext || '';
  const pageCount = themeData.dashboardRules?.requiredPages || 5;
  const chartsPerPage = themeData.dashboardRules?.chartsPerPage || 3;

  const prompt = `You are the IntelliFrame DASHBOARD DESIGN AGENT (v2.0).
Design a complete ${pageCount}-page analytics dashboard for ${clientName} (${industry}).

KPIs AVAILABLE: ${kpiListStr}

${domainContext}

═══════════════════════════════════════════════════════════
PAGE STRUCTURE RULES (MANDATORY)
═══════════════════════════════════════════════════════════
Create exactly these pages (use these exact pageId values):
  1. "executive"    — Executive Overview
  2. "correlation"  — Correlation Analysis
  3. "operational"  — Operational Comparison
  4. "risk"         — Risk Monitoring
  5. "efficiency"   — Efficiency Insights
  6. "diagnostic"   — Diagnostic Analysis

executive page: MUST have 4-6 KPI cards AND 2-3 charts.
All other pages: 2-4 charts each.
Total visualizations: at least ${Math.max(pageCount * chartsPerPage, 20)}.

═══════════════════════════════════════════════════════════
CHART RULES
═══════════════════════════════════════════════════════════
- Assign each chart EXACTLY ONE sourceKPI from the KPI list
- Use domain-appropriate chart types: line, area, bar, horizontalbar, stackedbar, pie, doughnut, scatter, radar, combo, funnel, heatmap
- cfg.cat: 6-8 realistic category labels (months, quarters, departments, etc.)
- cfg.data: 6-8 numeric values matching the categories (realistic range)
- cfg.label: series name

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (RETURN ONLY THIS JSON — NO MARKDOWN, NO FENCES)
═══════════════════════════════════════════════════════════
{
  "clientName": "${clientName}",
  "pageCount": ${pageCount},
  "visualizations": [
    {
      "id": "v1",
      "pageId": "executive",
      "type": "bar",
      "title": "Chart Title",
      "sourceKPI": "KPI Name from list",
      "cfg": {
        "label": "Series Label",
        "cat": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "data": [42, 38, 55, 61, 48, 72],
        "min": 0,
        "max": 100
      }
    }
  ]
}

Return ONLY the raw JSON object. First character must be "{", last character "}".`;

  try {
    const res = await model.invoke(prompt);
    return res.content.toString();
  } catch (err: any) {
    throw new Error(`Chart Types Agent Failed: ${err.message}`);
  }
}

// ============================================================
// NEW INTELLIFRAME AGENTS (v2.0 PRODUCTION HARDENED)
// ============================================================

/**
 * Agent: Application Brief (STRUCTURING ENGINE v2.0)
 */
export async function runApplicationBriefAgent(diJson: string | object): Promise<string> {
  const model = createAzureModel(12000);

  // Prune the input JSON to stay within token limits
  const prunedData = pruneDiJson(typeof diJson === 'string' ? JSON.parse(diJson) : diJson);
  const diInput = JSON.stringify(prunedData, null, 2);


  const prompt = `You are the IntelliFrame STRUCTURING ENGINE (v2.0).
Your goal is to convert Raw Azure Document Intelligence JSON into a strict Application Portfolio Brief.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 INPUT: AZURE DOCUMENT INTELLIGENCE RAW JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${diInput}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧩 STEP 2 — STRUCTURING ENGINE (STRICT JSON SCHEMA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Convert all extracted content into this EXACT JSON shape.
Every field is required.

{
  "portfolio": {
    "title": "string — marketplace display title",
    "organisation": "string — e.g. Systech Analytics",
    "year": "string — e.g. 2026",
    "confidential": true,
    "stats": {
      "totalApps": "string",
      "domains": "string",
      "aiPowered": "string",
      "buildTenure": "string"
    }
  },
  "applications": [
    {
      "id": "string — zero-padded, e.g. '01'",
      "name": "string",
      "domain": "string",
      "category": "string",
      "tagline": "string",
      "overview": "string",
      "features": [ { "title": "string", "description": "string" } ],
      "impact": "string",
      "metrics": [ { "label": "string", "value": "string" } ],
      "accent": "string — hex colour code",
      "icon": "string — single Unicode character"
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ VALIDATION & AUTO-CORRECT RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Features: Minimum 3, Maximum 6. Infer if missing. Trim if > 6.
2. Metrics: Minimum 3, Maximum 4. Use defaults if missing: [{"label":"Coverage","value":"Full"},{"label":"Status","value":"Live"},{"label":"Version","value":"v1.0"}]
3. Tagline: Max 120 chars. Overview: Max 600 chars. Truncate with "…"
4. Accent/Icon: Use the domain to assign via lookup logic provided in system instructions.
5. Extraction Failure: If no apps found, return skeleton with empty applications array and set "extractionWarning" on portfolio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 OUTPUT FORMAT (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY the raw JSON object. No markdown, no fences, no commentary.
First character must be "{", last character "}".`;

  try {
    console.log(`[Structuring Agent v2.0] Starting...`);
    const res = await model.invoke(prompt);
    const rawContent = res.content.toString();
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    let code = jsonMatch ? jsonMatch[0].trim() : rawContent.trim();
    return code;
  } catch (err: any) {
    throw new Error(`Structuring Engine (v2.0) Failed: ${err.message}`);
  }
}

/**
 * Agent: Wireframe Generator (DESIGN ENGINE v3.0 - UI WIREFRAME)
 */
export async function runWireframeGeneratorAgent(applicationBriefJson: string): Promise<string> {
  const model = createAzureModel(16000);

  const prompt = `You are the IntelliFrame APPLICATION WIREFRAME ENGINE (v3.0).
Your job is to generate a python-pptx script that creates UI WIREFRAME MOCKUPS — actual application SCREENS showing how the software looks and works. NOT a portfolio catalog. NOT a slide deck about apps. REAL UI SCREENS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ WHAT A UI WIREFRAME LOOKS LIKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each slide = ONE application screen. A screen contains UI COMPONENTS:
- TOP NAV BAR: Logo area (left), navigation links (center), user avatar + bell icon (right)
- SIDEBAR (optional): Vertical menu with icons and labels for each section
- PAGE HEADER: Screen title + breadcrumb + action buttons ("+ New", "Export", "Filter")
- DATA TABLE: Column headers, rows with sample data, pagination bar
- FORM: Input field labels with rounded rectangles as text inputs, dropdowns, checkboxes
- CARDS / KPI TILES: Metric value + label + trend indicator arranged in a row
- CHARTS: Placeholder rectangles labeled "Bar Chart — Revenue by Month" etc.
- BUTTONS: Rounded rectangles with text ("Submit", "Cancel", "Save")
- MODAL DIALOG: Centered overlay with title, form fields, action buttons
- FOOTER: Status bar or copyright line

These are LOW-FIDELITY / MID-FIDELITY UI wireframes — rectangles representing UI elements with labels, placeholder text, and clear visual hierarchy. Think Balsamiq or Figma wireframes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- SLIDE SIZE: 13.333 x 7.5 inches (Widescreen 16:9)
- SAFE AREA: x=[0.3 .. 13.0], y=[0.3 .. 7.2] — nothing may exceed these bounds
- BACKGROUND: #0F172A (Dark Navy)
- SURFACE/CARDS: #1E293B with 1pt #334155 border
- ACCENT: #3B82F6 (Blue) for active states, primary buttons, selected nav items
- TEXT PRIMARY: #F1F5F9 (near white)
- TEXT SECONDARY: #94A3B8 (slate gray)
- TEXT ON ACCENT: #FFFFFF
- INPUT FIELDS: #0F172A fill with 1pt #475569 border (to look like text inputs)
- FONTS: Calibri or Arial only (safe for python-pptx)
- BORDER RADIUS: 0.08 inches on all rounded rectangles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ANTI-OVERLAP RULES (CRITICAL — VIOLATIONS CAUSE REJECTION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TRACK CURSOR: Maintain a y_cursor variable per column. After placing any element, advance y_cursor by element_height + gap (minimum 0.15 inches).
2. BOUNDS CHECK: Before placing ANY element, verify: x + w <= 13.0 AND y + h <= 7.2. If it would exceed, SKIP the element — never let it overflow.
3. TEXT SIZING: Calculate text height BEFORE placement. For N lines of text at size S pt: height = N * (S / 72) * 1.4. Use this to set the text box height.
4. TRUNCATION: ALL text displayed in a bounded area must be truncated:
   - Taglines: max 80 chars
   - Descriptions/overview: max 200 chars
   - Table cell text: max 30 chars
   - Nav labels: max 20 chars
   Append "…" when truncating.
5. NO STACKING: Never place two elements at the same (x, y). Always advance the cursor.
6. GAP CONSTANTS: NAV_H = 0.6, SIDEBAR_W = 2.0, CARD_GAP = 0.2, ROW_GAP = 0.15, SECTION_GAP = 0.3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 INPUT DATA (APPLICATION BRIEF)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${applicationBriefJson}

Interpret each "application" in the brief as a SOFTWARE PRODUCT that needs UI screens designed for it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ REQUIRED PYTHON UTILITIES (DEFINE ALL BEFORE USING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CLI: argparse with '--output' argument
- clean_txt(t): re.sub(r'<[^>]*>', '', str(t))[:200] — strip HTML and truncate
- set_bg(slide, hex_color): Fill the slide background with given hex
- add_rect(slide, x, y, w, h, fill_hex, line_hex="#334155", line_w=1.0, radius=0.08):
    Creates a rounded rectangle (MSO_SHAPE.ROUNDED_RECTANGLE). All dimensions in Inches.
- add_txt(slide, text, x, y, w, h, size_pt, color_hex, bold=False, align=1):
    Creates a text box. align: 1=Left, 2=Center, 3=Right.
    ⚠️ ALWAYS call with positional args: add_txt(slide, "text", 0.5, 0.5, 3, 0.4, 12, "#F1F5F9", False, 1)
- add_input_field(slide, label, x, y, w): Draws a labeled input field — label text above, input rect below. Returns total height used.
- add_button(slide, text, x, y, w, h, bg_hex="#3B82F6", fg_hex="#FFFFFF"):
    Draws a button (filled rounded rect with centered text inside).
- add_table_placeholder(slide, headers, x, y, w, h):
    Draws a simple table wireframe — header row + 4 sample data rows with alternating tints.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SLIDES TO GENERATE (for each application in the brief, create 2-3 screens)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For EACH application, generate these UI wireframe screens:

SCREEN 1 — DASHBOARD / HOME:
  Layout: Top nav bar + Left sidebar + Main content area
  Main content: Page title "Dashboard", then a row of 3-4 KPI cards (metric tiles),
  then 2 chart placeholders in a 2-column grid below the KPIs.

SCREEN 2 — DATA VIEW / LIST:
  Layout: Top nav bar + Left sidebar + Main content area
  Main content: Page title (e.g. "Manage [domain items]"), filter bar with 2 input fields + "Search" button,
  then a data table with 5-6 relevant column headers and 4 sample rows, pagination at the bottom.

SCREEN 3 — FORM / DETAIL (if the app has 3+ features):
  Layout: Top nav bar + Left sidebar + Main content area
  Main content: Page title "Create New [item]" or "Settings", then a form with 4-6 labeled input fields
  arranged in 2 columns, plus "Save" and "Cancel" buttons at the bottom.

Also generate ONE title slide at the very start:
  - Application name (large, 36pt)
  - Tagline below (18pt, muted)
  - "UI Wireframes" label
  - Organisation name at bottom

Process ALL applications from the brief — do not slice or limit the list.
CRITICAL: USE A PYTHON \`for\` LOOP over the JSON applications list. Do NOT write repetitive hard-coded slides for each app. Write the slide logic ONCE inside helper functions, then call them in a loop. The generated Python script must be concise and DRY — helper functions + a single loop handles any number of apps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CODE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Imports: from pptx import Presentation; from pptx.util import Inches, Pt, Emu; from pptx.dml.color import RGBColor; from pptx.enum.text import PP_ALIGN; from pptx.enum.shapes import MSO_SHAPE; import argparse, re, json
- Set slide width = Inches(13.333), height = Inches(7.5)
- Call clean_txt() on EVERY string from the brief before rendering
- Graceful fallback for missing keys (use .get() with defaults)
- NEVER TRUNCATE THE SCRIPT. Ensure \`prs.save(args.output)\` is present at the very end.

OUTPUT ONLY THE COMPLETE PYTHON SCRIPT. NO MARKDOWN FENCES. NO COMMENTARY.`;


  try {
    console.log(`[Design Engine v3.0] Starting...`);
    const res = await model.invoke(prompt);
    const rawContent = res.content.toString();

    const pythonMatch = rawContent.match(/```python\s*([\s\S]*?)```/i);
    const genericMatch = rawContent.match(/```\s*([\s\S]*?)```/);
    const rawPython = rawContent.match(/from pptx[\s\S]*/i) || rawContent.match(/import argparse[\s\S]*/i);

    let code = "";
    if (pythonMatch) code = pythonMatch[1].trim();
    else if (genericMatch) code = genericMatch[1].trim();
    else if (rawPython) code = rawPython[0].trim();
    else code = rawContent.trim();

    return code;
  } catch (err: any) {
    throw new Error(`Design Engine (v3.0) Failed: ${err.message}`);
  }
}

/**
 * Agent: PPTX Generator (DESIGN ENGINE v2.0 - DETERMINISTIC PPTX)
 */
export async function runPptxGeneratorAgent(applicationBriefJson: string): Promise<string> {
  const model = createAzureModel(16000);

  const prompt = `You are the IntelliFrame PPTX DESIGN ENGINE (v2.0). 
Generate a SINGLE high-fidelity Python script using 'python-pptx' to create an Application Portfolio presentation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PREMIUM DESIGN SYSTEM (v2.0 - frontend-design Edition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- THEME: Ultra Dark (#05080F base). "Luxury = Whitespace & Hierarchy".
- GRID: Strict 8pt alignment for all shapes, text boxes, and margins.
- RATIO: Golden Ratio (1.618) for layout splits (62/38).
- COLORS: 60-30-10 Rule. 
    * Primary: #080C14 (Deep Midnight Background)
    * Secondary: #1E293B (Surface Cards)
    * Accent: #3B82F6 (Electric Blue) -> NO PURPLE.
- TYPOGRAPHY: Massive Title hierarchy (44pt+). Minimal fonts (Helvetica/Arial).
- UX PSYCHOLOGY: 
    * Hick's Law: One core message per slide. 
    * Miller's Law: Maximum 5-7 bullets per slide.
    * Focal Point: Use high-contrast accent for primary data/stats.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 INPUT DATA (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${applicationBriefJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ RENDERER UTILITIES (MUST DEFINE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CLI: Use 'argparse' to capture '--output'.
- set_bg(slide, hex): Apply corporate dark background.
- add_txt(slide, text, x, y, w, h, size, color_hex, bold=False, align=1): 
    * ⚠️ CALL WITH POSITIONAL ARGS ONLY: add_txt(slide, "Text", 1, 1, 3, 0.5, 12, "#FFFFFF", True, 1)
    * NOTE: Align values: 1=Left, 2=Center, 3=Right.
- add_rect(slide, x, y, w, h, fill_hex, line_hex, line_w=1.0, r=0.1): Rounded surface cards.
- add_pill(slide, x, y, text, bg_hex, fg_hex, size=10): Category badges.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SLIDE TEMPLATES (v2.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HERO: Massive Title (Pt 44+). Horizontal line accent. 4 Key Stats in cards.
2. CATALOG: Asymmetric cards or Clean Grid showing app portfolio overview.
3. DETAIL: One per app. 1.618 ratio layout. 
   - Left (62%): Large Icon/Badge, Name, Tagline, Overview (chunked), Key Impact.
   - Right (38%): Features (Bulleted List - max 7), Metrics Card (3 stats).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CODE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Library: from pptx import Presentation; from pptx.util import Inches, Pt; from pptx.dml.color import RGBColor;
- Constants: Define Inches as unit.
- Errors: Ensure graceful fallback for missing BRIEF keys.
- Saving: prs.save(args.output).

OUTPUT ONLY THE COMPLETE PYTHON SCRIPT.`;



  try {
    console.log(`[PPTX Design Engine v2.0] Starting...`);
    const res = await model.invoke(prompt);
    const rawContent = res.content.toString();

    const pythonMatch = rawContent.match(/```python\s*([\s\S]*?)```/i);
    const genericMatch = rawContent.match(/```\s*([\s\S]*?)```/);
    const rawPython = rawContent.match(/import sys[\s\S]*prs\.save\(\)/i) || rawContent.match(/from pptx[\s\S]*prs\.save\(\)/i);

    let code = "";
    if (pythonMatch) code = pythonMatch[1].trim();
    else if (genericMatch) code = genericMatch[1].trim();
    else if (rawPython) code = rawPython[0].trim();
    else code = rawContent.trim();

    return code;
  } catch (err: any) {
    throw new Error(`PPTX Design Engine (v2.0) Failed: ${err.message}`);
  }
}

/**
 * Agent: Dashboard PPTX Generator (ANALYTICS DESIGN ENGINE v3.0)
 * - Uses website-extracted brand colours from themeData
 * - 13.333 × 7.5 inch widescreen landscape slides
 * - One slide per tab, charts matching HTML output types
 */
export async function runDashboardPptxGeneratorAgent(dashboardContext: any): Promise<string> {
  const model = createAzureModel(16000);

  // ── Extract brand colours from theme (website-scraped) ─────────────────────
  const theme = dashboardContext.theme || {};
  const finalColors = theme.finalColors || {};
  const brandColors = theme.brandColors || {};
  const chartColorList: string[] = theme.chartColors || ['#6366F1', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6'];

  const BG      = finalColors.background   || '#0F172A';
  const CARD    = finalColors.card         || '#1E293B';
  const TEXT    = finalColors.text         || '#F1F5F9';
  const MUTED   = finalColors.textMuted    || '#94A3B8';
  const BORDER  = finalColors.border       || '#334155';
  const ACCENT  = finalColors.accent       || brandColors.primary  || '#6366F1';
  const ACCENT2 = finalColors.secondary    || brandColors.secondary || '#10B981';
  const HDR     = brandColors.primary      || ACCENT;

  // Stringify chart colors as Python list literal
  const CHART_COLORS_PY = chartColorList.slice(0, 8)
    .map(c => `"${c.replace(/^#/, '')}"`)
    .join(', ');

  const clientName = theme.clientName || 'Dashboard';
  const industry   = theme.industry   || '';

  // Pass only the fields the LLM needs (keep token budget lean)
  const designPayload = {
    clientName,
    industry,
    kpiList:       (theme.kpiList || []).slice(0, 20),
    visualizations: (
      dashboardContext.design?.visualizations ||
      dashboardContext.design?.tabs           ||
      []
    ).slice(0, 40),
  };
  const contextStr = JSON.stringify(designPayload, null, 2);

  const PAGE_LABELS: Record<string, string> = {
    executive:   'Executive Overview',
    correlation: 'Correlation Analysis',
    operational: 'Operational Comparison',
    risk:        'Risk Monitoring',
    efficiency:  'Efficiency Insights',
    diagnostic:  'Diagnostic Analysis',
  };

  const prompt = `You are the IntelliFrame DASHBOARD PPTX ENGINE (v3.0).
Generate a SINGLE complete Python script using python-pptx that creates a professional analytics dashboard presentation.
The script must run without errors and produce a valid .pptx file.

═══════════════════════════════════════════════════════════
🎨 BRAND COLOURS — EXTRACTED FROM CLIENT WEBSITE (USE EXACTLY AS GIVEN)
═══════════════════════════════════════════════════════════
BG_HEX      = "${BG}"       # slide background
CARD_HEX    = "${CARD}"     # card / container fill
TEXT_HEX    = "${TEXT}"     # primary text
MUTED_HEX   = "${MUTED}"    # secondary / muted text
BORDER_HEX  = "${BORDER}"   # card borders
ACCENT_HEX  = "${ACCENT}"   # accent / highlight
ACCENT2_HEX = "${ACCENT2}"  # secondary accent
HDR_HEX     = "${HDR}"      # header bar colour
CHART_COLORS = [${CHART_COLORS_PY}]   # chart series colours IN ORDER

Define these as module-level constants at the top of the script.
Use RGBColor(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)) to convert (strip leading #).

═══════════════════════════════════════════════════════════
📐 SLIDE DIMENSIONS (MANDATORY — DO NOT CHANGE)
═══════════════════════════════════════════════════════════
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
Safe area: x ∈ [0.3, 13.0], y ∈ [0.3, 7.2]
Margins: left/right = 0.4 in, top (below header) = 0.9 in, bottom = 0.3 in

═══════════════════════════════════════════════════════════
📥 DASHBOARD CONTEXT
═══════════════════════════════════════════════════════════
${contextStr}

═══════════════════════════════════════════════════════════
🛠️ REQUIRED UTILITIES (define all before use)
═══════════════════════════════════════════════════════════
def rgb(h):
    h = h.lstrip('#')
    return RGBColor(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

def set_bg(slide, hex_color):
    # fills slide background with solid colour
    bg = slide.background; fill = bg.fill
    fill.solid(); fill.fore_color.rgb = rgb(hex_color)

def add_rect(slide, x, y, w, h, fill_hex, line_hex=None, line_w=0.5):
    from pptx.util import Pt as _Pt
    shape = slide.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid(); shape.fill.fore_color.rgb = rgb(fill_hex)
    if line_hex:
        shape.line.color.rgb = rgb(line_hex); shape.line.width = _Pt(line_w)
    else:
        shape.line.fill.background()
    return shape

def add_txt(slide, text, x, y, w, h, size_pt, color_hex, bold=False, align=2):
    from pptx.enum.text import PP_ALIGN as _PA
    txb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = txb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = [None, _PA.LEFT, _PA.CENTER, _PA.RIGHT][align]
    run = p.add_run(); run.text = str(text)[:120]
    run.font.size = Pt(size_pt); run.font.bold = bold
    run.font.color.rgb = rgb(color_hex)
    return txb

def add_header(slide, title, page_num=None):
    # Full-width header bar
    add_rect(slide, 0, 0, 13.333, 0.65, HDR_HEX)
    add_txt(slide, title, 0.4, 0.1, 10, 0.45, 20, "FFFFFF", bold=True, align=1)
    if page_num:
        add_txt(slide, str(page_num), 12.5, 0.15, 0.7, 0.35, 11, "FFFFFF", align=3)

def add_kpi_tile(slide, x, y, w, h, label, value, trend_str, trend_positive=True):
    add_rect(slide, x, y, w, h, CARD_HEX, BORDER_HEX)
    add_txt(slide, label[:30], x+0.1, y+0.1, w-0.2, 0.35, 10, MUTED_HEX, align=1)
    add_txt(slide, str(value), x+0.1, y+0.45, w-0.2, 0.55, 22, ACCENT_HEX, bold=True, align=1)
    trend_color = "10B981" if trend_positive else "EF4444"
    add_txt(slide, trend_str, x+0.1, y+h-0.4, w-0.2, 0.3, 9, trend_color, align=1)

CHART_TYPE_MAP = {
    "bar":           XL_CHART_TYPE.COLUMN_CLUSTERED,
    "column":        XL_CHART_TYPE.COLUMN_CLUSTERED,
    "stackedbar":    XL_CHART_TYPE.COLUMN_STACKED,
    "horizontalbar": XL_CHART_TYPE.BAR_CLUSTERED,
    "line":          XL_CHART_TYPE.LINE,
    "area":          XL_CHART_TYPE.AREA_STACKED,
    "pie":           XL_CHART_TYPE.PIE,
    "doughnut":      XL_CHART_TYPE.DOUGHNUT,
    "scatter":       XL_CHART_TYPE.XY_SCATTER,
    "radar":         XL_CHART_TYPE.RADAR,
    "combo":         XL_CHART_TYPE.COLUMN_CLUSTERED,
}

def add_chart_to_slide(slide, viz, cx, cy, cw, ch):
    ctype_str = (viz.get("type") or "bar").lower()
    xl_type = CHART_TYPE_MAP.get(ctype_str, XL_CHART_TYPE.COLUMN_CLUSTERED)
    cfg = viz.get("cfg") or {}
    cats = cfg.get("cat") or ["Q1","Q2","Q3","Q4","Q5","Q6"]
    vals = cfg.get("data") or [30,45,28,60,42,55]
    label = cfg.get("label") or viz.get("title") or "Series"
    chart_data = CategoryChartData()
    chart_data.categories = cats
    chart_data.add_series(label[:40], vals)
    # Add container background
    add_rect(slide, cx, cy, cw, ch, CARD_HEX, BORDER_HEX)
    # Chart title
    title_txt = (viz.get("title") or "")[:50]
    add_txt(slide, title_txt, cx+0.1, cy+0.05, cw-0.2, 0.3, 9, MUTED_HEX, align=1)
    # Actual chart (inset 0.1in on each side, 0.35in from top for title)
    chart_x = Inches(cx + 0.08)
    chart_y = Inches(cy + 0.38)
    chart_w = Inches(max(cw - 0.16, 0.5))
    chart_h = Inches(max(ch - 0.45, 0.5))
    chart = slide.shapes.add_chart(xl_type, chart_x, chart_y, chart_w, chart_h, chart_data).chart
    chart.has_title = False
    # Colour the first series with CHART_COLORS
    try:
        series = chart.series[0]
        c_hex = CHART_COLORS[0]
        series.format.fill.solid()
        series.format.fill.fore_color.rgb = rgb(c_hex)
    except Exception:
        pass

═══════════════════════════════════════════════════════════
📄 SLIDE LAYOUT RULES
═══════════════════════════════════════════════════════════

SLIDE 1 — TITLE SLIDE:
  set_bg(slide, HDR_HEX)
  Centered large title: clientName + " Analytics Dashboard" (36pt, white, bold)
  Subtitle: industry label (16pt, semi-white)
  Gradient accent strip: a 13.333×0.12in rectangle in ACCENT_HEX at y=3.9
  Date bottom-right (10pt), "Powered by IntelliFrame" bottom-center (9pt, muted)

SLIDE 2 — EXECUTIVE OVERVIEW:
  set_bg(slide, BG_HEX)
  add_header(slide, "Executive Overview")
  KPI TILES ROW at y=0.8:
    - Take the first 4 items from kpiList
    - 4 tiles in a row: tile_w=2.9, tile_h=1.5, gap=0.27, start_x=0.4
    - Use add_kpi_tile(); generate realistic sample values and "+X.X%" trend strings
  CHARTS AREA below KPIs (y=2.55, available height ≈ 4.65in):
    - Take all visualizations with pageId="executive" (max 2)
    - 2 charts side by side: cx=[0.4, 6.87], cy=2.55, cw=6.17, ch=4.45
    - If only 1 chart: full width (cx=0.4, cw=12.53)
    - Call add_chart_to_slide() for each

SLIDES 3+ — ONE SLIDE PER TAB:
  Group ALL remaining visualizations by their pageId.
  Process pageIds in this order: correlation, operational, risk, efficiency, diagnostic.
  Skip a pageId if it has zero visualizations.
  For each pageId group:
    set_bg(slide, BG_HEX)
    tab_label = PAGE_LABELS dict lookup (see below)
    add_header(slide, tab_label)
    Layout charts to fill the area y=0.75 → 7.2 (available_h = 6.45):
      1 chart  → full slide: cx=0.4, cy=0.75, cw=12.53, ch=6.45
      2 charts → side by side: cw=6.1, ch=6.45, gap=0.3
      3 charts → top row 2 charts + bottom 1 centred:
                  top: cw=6.1, ch=3.0, cy=0.75
                  bottom: cx=3.4, cy=4.0, cw=6.53, ch=3.1
      4+ charts → 2×2 grid: cw=6.1, ch=3.0, gaps 0.3in

PAGE_LABELS = {${Object.entries(PAGE_LABELS).map(([k,v]) => `\n    "${k}": "${v}"`).join(',')}\n}

═══════════════════════════════════════════════════════════
⚠️ CODE REQUIREMENTS (CRITICAL)
═══════════════════════════════════════════════════════════
Imports (all required):
  import sys, os, re, argparse, json
  from pptx import Presentation
  from pptx.util import Inches, Pt, Emu
  from pptx.dml.color import RGBColor
  from pptx.enum.text import PP_ALIGN
  from pptx.chart.data import CategoryChartData
  from pptx.enum.chart import XL_CHART_TYPE

CLI: argparse with --output argument.
Set slide size IMMEDIATELY after creating prs:
  prs = Presentation()
  prs.slide_width = Inches(13.333)
  prs.slide_height = Inches(7.5)
Use blank slide layout: prs.slide_layouts[6]
Embed dashboard data as a Python variable (do NOT rely on external files).
NEVER truncate the script. End with: prs.save(args.output)

OUTPUT ONLY THE COMPLETE PYTHON SCRIPT. NO MARKDOWN FENCES. NO COMMENTARY.`;

  try {
    console.log(`[Dashboard PPTX Engine v3.0] Generating brand-themed analytics presentation...`);
    const res = await model.invoke(prompt);
    let code = res.content.toString();

    code = code.replace(/```python/gi, '').replace(/```/gi, '').trim();
    if (!code.includes('from pptx') && !code.includes('import argparse')) {
      const scriptMatch = code.match(/import[\s\S]*?prs\.save\(/i) || code.match(/from pptx[\s\S]*/i);
      if (scriptMatch) code = scriptMatch[0].trim();
    }

    return code;
  } catch (err: any) {
    throw new Error(`Dashboard PPTX Design Engine v3.0 Failed: ${err.message}`);
  }
}


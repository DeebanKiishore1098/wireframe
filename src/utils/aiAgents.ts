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
    temperature: undefined,
    maxTokens: undefined,
    modelKwargs: {
      max_completion_tokens: maxTokens,
    }
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
  const apiKey   = process.env.AZURE_DOC_INTELLIGENCE_KEY;

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
  const kpiListStr = JSON.stringify(themeData.kpiList);
  const prompt = `Design a dashboard. Use only these KPIs: ${kpiListStr}
OUTPUT VALID JSON ONLY.`;

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
  const model = createAzureModel(8000);
  
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
 * Agent: Wireframe Generator (DESIGN ENGINE v2.0 - DETERMINISTIC REPORTLAB)
 */
export async function runWireframeGeneratorAgent(applicationBriefJson: string): Promise<string> {
  const model = createAzureModel(16000);

  const prompt = `You are the IntelliFrame WIREFRAME DESIGN ENGINE (v2.0 - PPTX Master).
Generate a SINGLE high-fidelity python-pptx script for multi-slide wireframes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PREMIUM DESIGN SYSTEM (v2.0 - frontend-design Edition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- THEME: Ultra Dark (#05080F base). "Restraint is luxury." No Overlaps.
- GRID & SPACING: Strict 8-pt Grid (8, 16, 24, 32, 48, 64). Use generous whitespace (Luxury = Breathing Room).
- RATIO: Golden Ratio (1.618) for all scale calculations:
    * Content : Sidebar = 62% : 38%
    * Typography Scale: Heading = Body * 1.618
- COLORS (60-30-10 Rule): 
    * 60% (Base): #080C14 (Deep Midnight)
    * 30% (Surface): #0F172A (Slate)
    * 10% (Accent): #2563EB (Electric Blue) -> NO PURPLE.
- TYPOGRAPHY: High-contrast hierarchy. Use Helvetica/Helvetica-Bold. Line-height: 1.5x.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 INPUT DATA (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${applicationBriefJson}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ RENDERER UTILITIES (MUST DEFINE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CLI: Use 'argparse' to capture '--output'.
- clean_txt(t): USE REGEX re.sub(r'<[^>]*>', '', t) TO STRIP ALL HTML/XML TAGS.
- set_bg(slide, hex): Apply corporate dark background.
- add_txt(slide, text, x, y, w, h, size, color_hex, bold=False, align=1): 
    * ⚠️ CALL WITH POSITIONAL ARGS ONLY: add_txt(slide, "Text", 1, 1, 3, 0.5, 12, "#FFFFFF", True, 1)
    * NOTE: Align values: 1=Left, 2=Center, 3=Right.
- add_rect(slide, x, y, w, h, fill_hex, line_hex, line_w=1.0, r=0.1): Rounded surface cards.
- add_pill(slide, x, y, text, bg_hex, fg_hex, size=10): Category badges.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SLIDE TEMPLATES (v2.0 - WIREFRAMES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HERO:
   - Left (62%): Portfolio Title (clean_txt applied). Large Typography (Pt 44+). 
   - Right (38%): 4 Stat Cards showing high-level highlights.
2. CATALOG: Asymmetric layout. Cards for all apps found in BRIEF with 8pt spacing.
3. DETAIL: One slide per app. 
   - Left (62%): App Identity (clean_txt), Overview (Miller's Law chunking), Features.
   - Right (38%): Technical Specs, Metrics, Domain Pills.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CODE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Library: from pptx import Presentation; from pptx.util import Inches, Pt; from pptx.dml.color import RGBColor;
- [UNIFORM CLEANING]: CALL clean_txt() ON EVERY STRING BEFORE RENDERING.
- Errors: Ensure graceful fallback for missing BRIEF keys.
- Saving: prs.save(args.output).

OUTPUT ONLY THE COMPLETE PYTHON SCRIPT.`;


  try {
    console.log(`[Design Engine v2.0] Starting...`);
    const res = await model.invoke(prompt);
    const rawContent = res.content.toString();

    const pythonMatch = rawContent.match(/```python\s*([\s\S]*?)```/i);
    const genericMatch = rawContent.match(/```\s*([\s\S]*?)```/);
    const rawPython = rawContent.match(/import sys[\s\S]*c\.save\(\)/i) || rawContent.match(/from reportlab[\s\S]*c\.save\(\)/i);

    let code = "";
    if (pythonMatch) code = pythonMatch[1].trim();
    else if (genericMatch) code = genericMatch[1].trim();
    else if (rawPython) code = rawPython[0].trim();
    else code = rawContent.trim();

    return code;
  } catch (err: any) {
    throw new Error(`Design Engine (v2.0) Failed: ${err.message}`);
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
 * Agent: Dashboard PPTX Generator (ANALYTICS DESIGN ENGINE v1.0)
 */
export async function runDashboardPptxGeneratorAgent(dashboardContext: any): Promise<string> {
  const model = createAzureModel(16000);
  const contextStr = typeof dashboardContext === 'object' ? JSON.stringify(dashboardContext, null, 2) : dashboardContext;

  const prompt = `You are the IntelliFrame ELITE DASHBOARD DESIGN ENGINE (v2.0 - PPTX Edition).
Your goal is to generate a premium, high-fidelity ANALYTICS PRESENTATION using python-pptx.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PREMIUM DESIGN SYSTEM (ELITE DARK INDIGO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- THEME: Elite Dark (#0F172A base). Accent Colors: Indigo (#6366F1), Emerald (#10B981), Rose (#F43F5E).
- TYPOGRAPHY: 
    * Titles: 32pt Bold, Silver White (#F8FAFC)
    * KPI Labels: 12pt, Slate (#94A3B8)
    * KPI Values: 28pt Bold, Indigo (#818CF8)
- SPACING: Inches scale. Slide size: 10x5.625 (16:9).
    * Margin-X: 0.5 inches
    * Margin-Y: 0.5 inches
    * Card Gaps: 0.25 inches

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 INPUT DASHBOARD CONTEXT (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${contextStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ ELITE RENDERER UTILITIES (MUST DEFINE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- import sys, os, re, argparse
- from pptx import Presentation
- from pptx.util import Inches, Pt
- from pptx.enum.text import PP_ALIGN
- from pptx.dml.color import RGBColor
- from pptx.chart.data import CategoryChartData
- from pptx.enum.chart import XL_CHART_TYPE
- CLI: Use 'argparse' to capture '--output'.
- clean_txt(t): re.sub(r'<[^>]*>', '', t).
- set_bg(slide, hex): Apply #0F172A background.
- add_txt(slide, text, x, y, w, h, size, color_hex, bold=False, align=1):
    * ⚠️ CALL WITH POSITIONAL ARGS ONLY: add_txt(slide, "Text", 1, 1, 3, 0.5, 12, "#FFFFFF", True, 1)
- add_card(slide, x, y, w, h, fill_hex="#1E293B", line_hex="#334155"): Rounded surface container.
- add_kpi(slide, x, y, label, value, trend): Create a beautiful KPI tile with specific trend color ( Emerald/Emerald for pos/neg).
- add_chart(slide, title, x, y, w, h, ctype_str): 
    * Function to add real charts (COLUMN_CLUSTERED, PIE, LINE).
    * Use dummy analytical data (e.g. [20, 35, 25, 45]) for the UI visualization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 GENERATION RULES (v2.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SLIDE 1 (TITLE): Dashboard Name, Organisation, Detailed Date.
2. SLIDE 2 (EXECUTIVE OVERVIEW): 
   * Top 4-6 KPIs from 'theme.kpiList' in a prominent grid.
   * A short 'Executive Insight' text block.
3. ANALYSIS SLIDES (ONE PER TAB):
   * Render every TAB from 'design.tabs'.
   * For each section:
     - If it's a KPI list, render small card group.
     - If it's a CHART, use 'add_chart' with the Tab Section Title.
4. BRANDING: Add a small "IntelliFrame Intelligence" watermark in bottom right.

OUTPUT ONLY THE SINGLE PYTHON SCRIPT. NO MARKDOWN. NO FENCES.`;

  try {
    console.log(`[Dashboard PPTX Engine v2.0] Orchestrating analytical layouts...`);
    const res = await model.invoke(prompt);
    let code = res.content.toString();

    // Cleaning logic
    code = code.replace(/```python/gi, '').replace(/```/gi, '').trim();
    if (code.includes('import sys') || code.includes('from pptx')) {
       // Valid script start
    } else {
       // Might need to extract if LLM added preamble
       const scriptMatch = code.match(/import sys[\s\S]*prs\.save\(\)/i) || code.match(/from pptx[\s\S]*prs\.save\(\)/i);
       if (scriptMatch) code = scriptMatch[0].trim();
    }

    return code;
  } catch (err: any) {
    throw new Error(`Dashboard PPTX Design Engine Failed: ${err.message}`);
  }
}


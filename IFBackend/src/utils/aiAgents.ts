import { ChatOpenAI } from "@langchain/openai";

// Uses process.env.AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_INSTANCE_NAME, AZURE_OPENAI_API_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION
export const createAzureModel = (maxTokens: number = 8000) => {
  return new ChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    temperature: 0,
    maxTokens: maxTokens,
  });
};

export async function runKpiAgent(brdText: string): Promise<string> {
  const model = createAzureModel(8000);
  
  const prompt = `You are a Business KPI Extraction Specialist. Your task is to analyze the
provided BRD and extract KPIs for dashboard generation. You must follow the KPI
sourcing hierarchy strictly.

CRITICAL OUTPUT RULES:
YOU MUST OUTPUT ONLY VALID JSON.
- NO JavaScript comments (// or /* */)
- NO markdown (\`\`\`json)
- NO explanations
- NO text before or after the JSON
- OUTPUT STARTS WITH {
- OUTPUT ENDS WITH }
VALID JSON ONLY

REQUIRED OUTPUT FORMAT:
{
  "clientName": "Extracted company name",
  "clientWebsite": "https://example.com",
  "clientEmail": "contact@example.com",
  "industry": "Industry name",
  "kpiList": [
    { "name": "KPI Name 1", "source": "BRD" }
  ],
  "metricList": [ "Metric Name 1" ],
  "preferredStyleMoods": [ "executive" ]
}

============================================================
KPI COUNT RULES (MANDATORY — NON-NEGOTIABLE)
- MINIMUM: 22 KPIs
- MAXIMUM: 32 KPIs
- Your kpiList array MUST contain between 22 and 32 items.

(Please follow all derivation validity gates from the strict guidelines).

OUTPUT ONLY VALID JSON.
NO EXPLANATIONS.
NO MARKDOWN.

BRD CONTENT:
${brdText}`;

  try {
    const res = await model.invoke(prompt);
    return res.content.toString();
  } catch (err: any) {
    throw new Error(`Agent 1 Failed: ${err.message}`);
  }
}

export async function runChartTypesAgent(themeData: any): Promise<string> {
  const model = createAzureModel(16000);
  
  // Serialize complex lists
  const kpiListStr = Array.isArray(themeData.kpiList) ? themeData.kpiList.map((k: any, i: number) => (i + 1) + '. ' + (typeof k === 'object' && k !== null ? (k.name || JSON.stringify(k)) : String(k))).join('\\n') : 'ERROR: No KPI list received';
  const kpiListLength = Array.isArray(themeData.kpiList) ? themeData.kpiList.length : 0;
  
  const prompt = `You are a Power BI Dashboard Designer creating a professional
${themeData._detectedDomain || 'SALES'} DASHBOARD with DYNAMIC LAYOUT. Generate
UNIQUE charts with NO gaps or blank spaces.

CLIENT DATA:
Name: ${themeData.clientName || 'Unknown Client'}
Industry: ${themeData.industry || 'General'}
Colors: ${themeData.websiteAnalysis && themeData.websiteAnalysis.colors ? JSON.stringify(themeData.websiteAnalysis.colors) : '{"primary":"#2563EB","secondary":"#1E40AF"}'}

LAYOUT CONFIGURATION:
Layout Type: ${themeData.layoutType || 'horizontal-kpi'}
Spacing: ${themeData.layoutSpacing || 'comfortable'}
Chart Density: ${themeData.chartDensity || 'standard'}
Required Pages: ${themeData.dashboardRules && themeData.dashboardRules.requiredPages ? themeData.dashboardRules.requiredPages : 4}

${themeData._domainInsightContext || ''}

ALLOWED KPIs (ACTIVE WHITELIST):
${kpiListStr}

TOTAL KPI COUNT: ${kpiListLength}

(Follow all strict JSON array mapping and Plotly chart generation distribution limits: MINIMUM 26 CHARTS excluding KPI cards. Output must be raw JSON valid mapping).

OUTPUT ONLY VALID JSON. DO NOT EXPLAIN.
`;

  try {
    const res = await model.invoke(prompt);
    return res.content.toString();
  } catch (err: any) {
    throw new Error(`Agent 2 Failed: ${err.message}`);
  }
}

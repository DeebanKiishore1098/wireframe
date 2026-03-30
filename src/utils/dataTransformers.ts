import { selectStyle } from './styleRegistry';
import { buildAdaptiveTheme, buildDomainInsightContext, detectRequestedAnalyses } from './themeEngine';

// ────────────────────────────────────────────────────────────
// cleanLLMJson — strips markdown fences + extracts first {}
// ────────────────────────────────────────────────────────────
function cleanLLMJson(rawJson: string): any {
  let cleaned = rawJson;
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.trim();

  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}') + 1;
  if (start === -1 || end === 0) throw new Error('No JSON object found in LLM output');
  cleaned = cleaned.substring(start, end);

  // Safe comment removal
  cleaned = cleaned.replace(/(^|\s)\/\/[^\n\r]*/gm, '$1');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  try {
    return JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(`JSON parse failed: ${e.message}`);
  }
}

// ────────────────────────────────────────────────────────────
// processAgent1Output
// Mirrors n8n "Client Details Verification from Website" node.
// Accepts raw JSON from Agent 1 or Agent 4 and normalises it
// into a consistent shape for downstream processing.
// ────────────────────────────────────────────────────────────
export function processAgent1Output(agent1RawJson: string, brdText: string): any {
  const data = cleanLLMJson(agent1RawJson);

  const clientInfo = data.client || {
    name:     data.clientName     || 'Unknown',
    website:  data.clientWebsite  || '',
    email:    data.clientEmail    || '',
    industry: data.industry       || 'General',
  };

  const kpiList    = data.kpiList    || [];
  const metricList = data.metricList || [];

  return {
    clientName:    clientInfo.name,
    clientWebsite: clientInfo.website,
    clientEmail:   clientInfo.email,
    industry:      clientInfo.industry,
    kpiList,
    metricList,
    brdText,
    stats: {
      kpiCount:    kpiList.length,
      metricCount: metricList.length,
    },
  };
}

// ────────────────────────────────────────────────────────────
// generateWebsiteTheme  (FULL PIPELINE)
// Mirrors  n8n nodes in order:
//   1. Dashboard Style Registry
//   2. Style Selector
//   3. Client Website Theme Implementation (strict contrast)
//   4. Domain Insight Injector
//   5. Analysis Detection Module
// ────────────────────────────────────────────────────────────
export async function generateWebsiteTheme(parsedKpiData: any): Promise<any> {
  const { clientWebsite, clientName, industry, kpiList, brdText } = parsedKpiData;

  /* ── Step 1 & 2: Pick style from registry ──────────────── */
  const selectedStyle = selectStyle();

  /* ── Step 3: Website scrape + adaptive theme ───────────── */
  const themeResult = await buildAdaptiveTheme(clientWebsite, selectedStyle);

  /* ── Step 4: Domain insight context ────────────────────── */
  const domainCtx = buildDomainInsightContext({
    _domain:  parsedKpiData._detectedDomain,
    industry: industry,
    kpiList:  kpiList,
  });

  /* ── Step 5: Analysis detection ────────────────────────── */
  const { requestedAnalyses, analysisDetails, analysisContext } = detectRequestedAnalyses(
    brdText || '',
    kpiList || []
  );

  /* ── Combine domain + analysis context for Agent 2 ─────── */
  const combinedInsightContext = domainCtx + analysisContext;

  /* ── Dynamic page count (3–5 based on KPI count) ─────────
     Mirrors n8n "DYNAMIC PAGE COUNT" logic in the theme node */
  const kpiCount = Array.isArray(kpiList) ? kpiList.length : 0;
  let requiredPages: number;
  if (kpiCount <= 12)      requiredPages = 4;
  else if (kpiCount <= 22) requiredPages = 5;
  else                     requiredPages = 6;

  /* ── Layout variation pool ──────────────────────────────── */
  const layoutVariations = [
    'horizontal-kpi', 'vertical-kpi-left', 'vertical-kpi-right', 'grid-kpi-2x2', 'stacked-kpi',
  ];
  const layoutType = layoutVariations[Math.floor(Math.random() * layoutVariations.length)];

  console.log(`[ThemeGen] style=${selectedStyle.id} | theme=${themeResult.adaptiveTheme} | pages=${requiredPages} | layout=${layoutType}`);
  console.log(`[ThemeGen] analyses detected: ${requestedAnalyses.join(', ') || 'none'}`);

  return {
    /* Pass-through from Agent 1 / Agent 4 */
    ...parsedKpiData,

    /* Style metadata */
    styleMode:     selectedStyle.id,
    selectedStyle: {
      ...selectedStyle,
      theme:        themeResult.adaptiveTheme,
      spacing:      selectedStyle.spacing,
      chartDensity: selectedStyle.chartDensity,
    },

    /* Colour scheme (strict contrast) */
    finalColors:        themeResult.finalColors,
    chartColors:        themeResult.chartColors,
    brandColors:        themeResult.brandColors,
    adaptiveTheme:      themeResult.adaptiveTheme,
    isDarkTheme:        themeResult.isDarkTheme,
    themeReason:        themeResult.themeReason,
    selectedBackground: themeResult.selectedBackground,

    /* Keep websiteAnalysis shape for dashboardGenerator compatibility */
    websiteAnalysis: {
      colors: {
        primary:   themeResult.finalColors.primary,
        secondary: themeResult.finalColors.secondary,
        accent:    themeResult.finalColors.accent,
        success:   themeResult.finalColors.success,
        warning:   themeResult.finalColors.warning,
        danger:    themeResult.finalColors.danger,
        neutral:   '#6b7280',
        background:       themeResult.finalColors.background,
        card:             themeResult.finalColors.card,
        headerGradient:   themeResult.finalColors.headerGradient,
        text:             themeResult.finalColors.text,
        textMuted:        themeResult.finalColors.textMuted,
        border:           themeResult.finalColors.border,
        allColors:        themeResult.brandColors.allColors,
      },
      fonts: {
        heading: 'Inter, Segoe UI, sans-serif',
        body:    'Inter, Segoe UI, sans-serif',
      },
      hasWebsite: themeResult.brandColors.extracted,
    },

    /* Layout */
    layoutType,
    layoutSpacing: selectedStyle.spacing,
    chartDensity:  selectedStyle.chartDensity,

    /* Dashboard rules */
    dashboardRules: {
      kpiCount,
      requiredPages,
      chartsPerPage:   Math.ceil(Math.max(kpiCount, 22) / requiredPages),
      minimumCharts:   Math.max(kpiCount, 22),
      maximumCharts:   Math.max(kpiCount + 4, 26),
      layoutType,
      mustUseAllKPIs:  true,
    },

    /* Domain + analysis injection (consumed by runChartTypesAgent) */
    _domainInsightContext:     combinedInsightContext,
    _requestedAnalyses:        requestedAnalyses,
    _analysisDetails:          analysisDetails,
    _analysisDetectionApplied: true,
  };
}

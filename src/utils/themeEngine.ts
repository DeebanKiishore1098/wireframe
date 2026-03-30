// ============================================================
// THEME ENGINE
// Migrated from n8n nodes:
//   • "Client website theme implementation" (strict contrast mode)
//   • "Domain Insight Injector"
//   • "Analysis detection module"
// ============================================================

import type { StyleEntry } from './styleRegistry';

// ── Colour helpers ───────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
    : { r: 128, g: 128, b: 128 };
}

function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.5;
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);
}

function adjustColorBrightness(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adj = (v: number) => Math.min(255, Math.max(0, Math.round(v + (255 * pct) / 100)));
  return `#${adj(r).toString(16).padStart(2, '0')}${adj(g).toString(16).padStart(2, '0')}${adj(b).toString(16).padStart(2, '0')}`;
}

// ── Background palettes ──────────────────────────────────────

const DARK_BACKGROUNDS = [
  { name: 'Midnight Blue', bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8' },
  { name: 'Charcoal',      bg: '#1a1a2e', card: '#16213e', border: '#0f3460', text: '#eaeaea', muted: '#a0a0a0' },
  { name: 'Dark Slate',    bg: '#1e1e2f', card: '#2d2d44', border: '#3d3d5c', text: '#ffffff', muted: '#b8b8d1' },
  { name: 'Deep Navy',     bg: '#0a1929', card: '#132f4c', border: '#1e4976', text: '#ffffff', muted: '#8796a5' },
  { name: 'Obsidian',      bg: '#121212', card: '#1e1e1e', border: '#2d2d2d', text: '#ffffff', muted: '#a0a0a0' },
  { name: 'Graphite',      bg: '#1c1c1c', card: '#2a2a2a', border: '#3a3a3a', text: '#f5f5f5', muted: '#999999' },
];

const LIGHT_BACKGROUNDS = [
  { name: 'Cool Gray',    bg: '#f1f5f9', card: '#ffffff', border: '#e2e8f0', text: '#1e293b', muted: '#64748b' },
  { name: 'Warm White',   bg: '#faf5f0', card: '#ffffff', border: '#e8e0d5', text: '#292524', muted: '#78716c' },
  { name: 'Soft Blue',    bg: '#f0f9ff', card: '#ffffff', border: '#e0f2fe', text: '#0c4a6e', muted: '#0369a1' },
  { name: 'Pearl Gray',   bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0', text: '#334155', muted: '#64748b' },
  { name: 'Ice Blue',     bg: '#ecfeff', card: '#ffffff', border: '#cffafe', text: '#164e63', muted: '#0891b2' },
  { name: 'Stone',        bg: '#f5f5f4', card: '#ffffff', border: '#e7e5e4', text: '#292524', muted: '#78716c' },
];

// ── Strict Contrast Theme Selection ─────────────────────────

export interface ThemeColors {
  background: string;
  card: string;
  headerGradient: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentGradient: string;
  success: string;
  warning: string;
  danger: string;
  primary: string;
  secondary: string;
  headerText: string;
}

export interface BrandColors {
  primary: string | null;
  secondary: string | null;
  tertiary: string | null;
  extracted: boolean;
  allColors: string[];
  averageLuminance: number;
}

export interface ThemeResult {
  adaptiveTheme: 'dark' | 'light';
  isDarkTheme: boolean;
  selectedBackground: { name: string; bg: string; card: string; border: string; text: string; muted: string };
  finalColors: ThemeColors;
  chartColors: string[];
  brandColors: BrandColors;
  themeReason: string;
}

/**
 * Applies strict contrast logic: light brand → dark background, dark brand → light background.
 * Mirrors n8n "Client website theme implementation" node.
 */
export async function buildAdaptiveTheme(
  clientWebsite: string | undefined,
  selectedStyle: StyleEntry
): Promise<ThemeResult> {
  // ── Step 1: Fetch brand colours from client website ────────
  const brandColors: BrandColors = {
    primary: null, secondary: null, tertiary: null,
    extracted: false, allColors: [], averageLuminance: 0.5,
  };

  if (clientWebsite && clientWebsite.trim()) {
    let url = clientWebsite.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
      });
      clearTimeout(tid);
      const html = await res.text();

      const hexMatches = html.match(/#([A-Fa-f0-9]{6})\b/g) || [];
      const filtered = [...new Set(hexMatches)].filter(c => {
        const h = c.toLowerCase();
        const skip = ['#ffffff', '#000000', '#f5f5f5', '#fafafa', '#eeeeee', '#333333', '#666666', '#999999', '#cccccc'];
        if (skip.includes(h)) return false;
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        if (r > 240 && g > 240 && b > 240) return false;
        if (r < 20 && g < 20 && b < 20) return false;
        if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10) return false;
        return true;
      });

      brandColors.allColors = filtered.slice(0, 10);
      if (filtered.length >= 1) { brandColors.primary = filtered[0]; brandColors.extracted = true; }
      if (filtered.length >= 2) brandColors.secondary = filtered[1];
      if (filtered.length >= 3) brandColors.tertiary = filtered[2];
      if (brandColors.allColors.length > 0) {
        const lums = brandColors.allColors.map(getLuminance);
        brandColors.averageLuminance = lums.reduce((a, b) => a + b, 0) / lums.length;
      }
      console.log(`[ThemeEngine] Brand colours extracted: ${brandColors.allColors.slice(0, 4).join(', ')}`);
    } catch (e: any) {
      console.log(`[ThemeEngine] Website fetch failed: ${e.message}`);
    }
  }

  // ── Step 2: Strict contrast decision ────────────────────────
  const primaryLuminance = brandColors.primary ? getLuminance(brandColors.primary) : 0.6;
  let adaptiveTheme: 'dark' | 'light';
  let selectedBackground: typeof DARK_BACKGROUNDS[0];
  let themeReason: string;

  if (brandColors.extracted) {
    if (primaryLuminance > 0.45) {
      adaptiveTheme = 'dark';
      selectedBackground = DARK_BACKGROUNDS[Math.floor(Math.random() * DARK_BACKGROUNDS.length)];
      themeReason = `Brand ${brandColors.primary} is LIGHT (lum ${primaryLuminance.toFixed(2)}) → DARK background: ${selectedBackground.name}`;
    } else {
      adaptiveTheme = 'light';
      selectedBackground = LIGHT_BACKGROUNDS[Math.floor(Math.random() * LIGHT_BACKGROUNDS.length)];
      themeReason = `Brand ${brandColors.primary} is DARK (lum ${primaryLuminance.toFixed(2)}) → LIGHT background: ${selectedBackground.name}`;
    }
  } else {
    // No brand colour — use the style registry's theme with a random palette
    adaptiveTheme = selectedStyle.theme;
    const pool = adaptiveTheme === 'dark' ? DARK_BACKGROUNDS : LIGHT_BACKGROUNDS;
    selectedBackground = pool[Math.floor(Math.random() * pool.length)];
    themeReason = `No brand colour extracted → style registry theme: ${adaptiveTheme.toUpperCase()} / ${selectedBackground.name}`;
  }

  console.log(`[ThemeEngine] ${themeReason}`);

  // ── Step 3: Build final colour set ──────────────────────────
  const isDark = adaptiveTheme === 'dark';
  const accent = brandColors.primary || selectedStyle.accentColor || '#0078D4';
  const secondary = brandColors.secondary || selectedStyle.chartColors[1] || adjustColorBrightness(accent, isDark ? 20 : -15);

  let headerGradient: string;
  if (brandColors.primary) {
    const g2 = brandColors.secondary || adjustColorBrightness(brandColors.primary, isDark ? 20 : -15);
    headerGradient = `linear-gradient(135deg, ${brandColors.primary} 0%, ${g2} 100%)`;
  } else {
    headerGradient = selectedStyle.headerGradient;
  }

  const finalColors: ThemeColors = {
    background: selectedBackground.bg,
    card: selectedBackground.card,
    headerGradient,
    text: selectedBackground.text,
    textMuted: selectedBackground.muted,
    border: selectedBackground.border,
    accent,
    accentGradient: `linear-gradient(135deg, ${accent}, ${secondary})`,
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    primary: accent,
    secondary,
    headerText: '#ffffff',
  };

  let chartColors: string[];
  if (brandColors.extracted && brandColors.allColors.length >= 3) {
    chartColors = [
      brandColors.primary!,
      brandColors.secondary || adjustColorBrightness(brandColors.primary!, 20),
      brandColors.tertiary || adjustColorBrightness(brandColors.primary!, -20),
      ...selectedStyle.chartColors.slice(3),
    ];
  } else {
    chartColors = [...selectedStyle.chartColors];
  }
  while (chartColors.length < 6) {
    chartColors.push(adjustColorBrightness(chartColors[chartColors.length - 1], 15));
  }

  return { adaptiveTheme, isDarkTheme: isDark, selectedBackground, finalColors, chartColors, brandColors, themeReason };
}


// ============================================================
// DOMAIN INSIGHT INJECTOR
// Migrated from n8n "Domain Insight Injector" node
// ============================================================

const DOMAIN_INSIGHT_LIBRARY: Record<string, {
  chartSelectionRationale: string;
  kpiChartPairingPriority: string;
  insightNarrativeIntent: string;
  categoryGeneration: string;
}> = {
  Sales: {
    chartSelectionRationale: `
SALES CHART SELECTION RATIONALE:
- Revenue KPIs → Line charts (trend tracking over time)
- Volume KPIs (Units, Orders) → Bar charts (period comparison)
- Conversion KPIs → Funnel-style Horizontal Bar (pipeline stages)
- Growth KPIs → Area charts (cumulative growth visualization)
- Performance KPIs (Win Rate, Quota) → Doughnut/Pie (achievement distribution)
- Comparison KPIs → Combo charts (actual vs target)`,
    kpiChartPairingPriority: `
SALES KPI-TO-CHART PAIRING PRIORITY:
1. Revenue metrics → Time-series trend (line)
2. Volume metrics → Period comparison (bar)
3. Pipeline metrics → Stage progression (horizontal bar)
4. Rate/Percentage metrics → Distribution (doughnut/pie)
5. Target metrics → Benchmark comparison (combo)`,
    insightNarrativeIntent: `
SALES INSIGHT NARRATIVE INTENT:
- PERFORMANCE: Track sales achievement against targets
- GROWTH: Identify revenue trends and acceleration
- PIPELINE: Monitor deal flow and conversion rates
- TERRITORY: Compare regional/team performance
- FORECASTING: Project future sales based on pipeline`,
    categoryGeneration: `
SALES-SPECIFIC CATEGORIES:
- Revenue KPIs: Time periods (Q1 FY24, Q2 FY24, etc.)
- Territory KPIs: Regions (North, South, East, West, Central)
- Product KPIs: Product lines or categories
- Channel KPIs: Sales channels (Direct, Partner, Online, Retail)`,
  },

  Finance: {
    chartSelectionRationale: `
FINANCE / RISK CHART SELECTION RATIONALE:
- Revenue/Margin KPIs → Line charts (fiscal period trends)
- Cost/Expense KPIs → Stacked Bar (composition by cost center)
- Ratio KPIs (ROA, ROE, NIM) → Combo charts (actual vs benchmark)
- Liquidity KPIs → Area charts (coverage trends)
- Risk KPIs (NPA, Provision, Delinquency) → Horizontal Bar (portfolio segmentation)
- Variance KPIs → Bar charts (budget vs actual bridges)
- Portfolio Distribution → Doughnut/Pie (segment composition)`,
    kpiChartPairingPriority: `
FINANCE KPI-TO-CHART PAIRING PRIORITY:
1. Profitability metrics → Trend visualization (line/area)
2. Efficiency ratios → Benchmark comparison (combo)
3. Risk exposure → Segmented analysis (stacked bar)
4. Compliance metrics → Threshold monitoring (KPI cards with indicators)
5. Cash flow → Period-over-period (clustered bar)
6. Delinquency/Default → Trend with threshold (line with reference)
7. Portfolio composition → Distribution (doughnut/pie)`,
    insightNarrativeIntent: `
FINANCE INSIGHT NARRATIVE INTENT:
- MONITORING: Track fiscal health indicators against thresholds
- EFFICIENCY: Identify cost optimization opportunities
- RISK: Highlight exposure concentrations and coverage gaps
- COMPLIANCE: Ensure regulatory ratio adherence (NIM, CAR, LCR)
- CREDIT QUALITY: Monitor delinquency trends and default patterns`,
    categoryGeneration: `
FINANCE-SPECIFIC CATEGORIES:
- P&L KPIs: Fiscal periods (Q1 FY24, Q2 FY24, Q3 FY24, Q4 FY24)
- Risk KPIs: Risk categories (Credit Risk, Market Risk, Operational Risk, Liquidity Risk)
- Loan KPIs: Loan segments (Retail, Corporate, SME, Agriculture)
- Delinquency KPIs: Aging buckets (Current, 30 DPD, 60 DPD, 90+ DPD)`,
  },

  Marketing: {
    chartSelectionRationale: `
MARKETING CHART SELECTION RATIONALE:
- Traffic/Volume KPIs → Area charts (channel volume trends)
- Conversion KPIs → Horizontal Bar (funnel stage progression)
- Engagement KPIs → Line charts (engagement trends over campaigns)
- Cost KPIs (CAC, CPC) → Bar charts (channel cost comparison)
- ROI/ROAS KPIs → Combo charts (spend vs return overlay)
- Attribution KPIs → Doughnut/Pie (channel contribution)`,
    kpiChartPairingPriority: `
MARKETING KPI-TO-CHART PAIRING PRIORITY:
1. Acquisition metrics → Channel comparison (bar)
2. Engagement metrics → Time-series trends (line/area)
3. Conversion metrics → Funnel visualization (horizontal bar)
4. Spend efficiency → ROI analysis (combo)
5. Attribution → Distribution analysis (doughnut/pie)`,
    insightNarrativeIntent: `
MARKETING INSIGHT NARRATIVE INTENT:
- GROWTH: Identify high-performing acquisition channels
- OPTIMIZATION: Highlight underperforming campaigns for budget reallocation
- ATTRIBUTION: Understand multi-touch journey contribution
- ROI: Justify marketing spend with return metrics`,
    categoryGeneration: `
MARKETING-SPECIFIC CATEGORIES:
- Channel KPIs: Paid Search, Organic Search, Social Media, Email, Display, Affiliate, Direct
- Campaign KPIs: Brand Awareness, Lead Gen, Retargeting, Seasonal
- Funnel KPIs: Awareness, Consideration, Conversion, Retention, Advocacy`,
  },

  Operations: {
    chartSelectionRationale: `
OPERATIONS CHART SELECTION RATIONALE:
- Efficiency KPIs (OEE, Utilization) → Line charts (trend over shifts/days)
- Volume KPIs (Production, Throughput) → Bar charts (period comparison)
- Quality KPIs (Yield, Defect Rate) → Area charts (quality trend)
- Time KPIs (Cycle Time, Downtime) → Horizontal Bar (process comparison)
- Compliance KPIs (Safety, SLA) → Combo charts (actual vs threshold)
- Resource KPIs → Stacked Bar (resource allocation breakdown)`,
    kpiChartPairingPriority: `
OPERATIONS KPI-TO-CHART PAIRING PRIORITY:
1. Efficiency metrics → Trend monitoring (line)
2. Volume metrics → Period comparison (bar)
3. Quality metrics → Defect tracking (area with threshold)
4. Time metrics → Process benchmarking (horizontal bar)
5. Resource metrics → Allocation analysis (stacked bar)`,
    insightNarrativeIntent: `
OPERATIONS INSIGHT NARRATIVE INTENT:
- EFFICIENCY: Monitor equipment and process effectiveness
- QUALITY: Track defect rates and yield improvements
- CAPACITY: Identify bottlenecks and utilization gaps
- COMPLIANCE: Ensure safety and SLA adherence`,
    categoryGeneration: `
OPERATIONS-SPECIFIC CATEGORIES:
- Production KPIs: Production lines (Line A, Line B, Line C, Assembly, Packaging)
- Shift KPIs: Morning Shift, Afternoon Shift, Night Shift
- Quality KPIs: Defect types (Critical, Major, Minor, Cosmetic)`,
  },

  HR: {
    chartSelectionRationale: `
HR CHART SELECTION RATIONALE:
- Headcount KPIs → Bar charts (department/location comparison)
- Turnover/Attrition KPIs → Line charts (trend over time)
- Engagement KPIs → Doughnut/Pie (score distribution)
- Recruitment KPIs → Horizontal Bar (funnel stages)
- Compensation KPIs → Combo charts (salary vs benchmark)`,
    kpiChartPairingPriority: `
HR KPI-TO-CHART PAIRING PRIORITY:
1. Workforce metrics → Composition analysis (bar/stacked bar)
2. Attrition metrics → Trend tracking (line)
3. Engagement metrics → Distribution (doughnut/pie)
4. Recruitment metrics → Pipeline funnel (horizontal bar)
5. Performance metrics → Rating distribution (area)`,
    insightNarrativeIntent: `
HR INSIGHT NARRATIVE INTENT:
- RETENTION: Monitor attrition trends and identify risk areas
- ENGAGEMENT: Track employee satisfaction and sentiment
- TALENT: Assess recruitment pipeline health
- PERFORMANCE: Evaluate workforce productivity`,
    categoryGeneration: `
HR-SPECIFIC CATEGORIES:
- Workforce KPIs: Engineering, Sales, Marketing, Operations, Finance, HR
- Tenure KPIs: Tenure bands (0-1 Year, 1-3 Years, 3-5 Years, 5+ Years)
- Performance KPIs: Rating categories (Exceeds, Meets, Needs Improvement)`,
  },
};

function normaliseDomainCategory(domain: string): string {
  const d = domain.toLowerCase().trim();
  if (d.includes('finance') || d.includes('banking') || d.includes('insurance') || d.includes('risk') || d.includes('credit')) return 'Finance';
  if (d.includes('marketing') || d.includes('advertising')) return 'Marketing';
  if (d.includes('operations') || d.includes('manufacturing') || d.includes('supply')) return 'Operations';
  if (d.includes('hr') || d.includes('human resource')) return 'HR';
  return 'Sales';
}

/** Infers domain from industry field when _domain is missing */
function inferDomainFromIndustry(industry: string): string {
  const i = industry.toLowerCase();
  if (['bank', 'financ', 'insurance', 'credit', 'lending', 'invest'].some(p => i.includes(p))) return 'Finance';
  if (['manufactur', 'logistics', 'supply', 'warehouse', 'automotive', 'industrial'].some(p => i.includes(p))) return 'Operations';
  if (['health', 'pharma', 'hospital', 'medical'].some(p => i.includes(p))) return 'Operations';
  if (['media', 'entertainment', 'advertis'].some(p => i.includes(p))) return 'Marketing';
  if (['energy', 'utilit', 'oil', 'gas', 'power'].some(p => i.includes(p))) return 'Operations';
  return 'Sales';
}

/**
 * Builds a domain-insight context string for injection into the Agent 2 prompt.
 * Mirrors n8n "Domain Insight Injector" node.
 */
export function buildDomainInsightContext(input: {
  _domain?: string;
  industry?: string;
  kpiList?: any[];
}): string {
  let detected = input._domain || '';

  if (!detected && input.industry) {
    detected = inferDomainFromIndustry(input.industry);
  }

  const category = detected ? normaliseDomainCategory(detected) : 'Sales';
  const lib = DOMAIN_INSIGHT_LIBRARY[category] || DOMAIN_INSIGHT_LIBRARY['Sales'];

  return `
═══════════════════════════════════════════════════════════
DOMAIN-SPECIFIC INSIGHT LOGIC: ${category.toUpperCase()}
═══════════════════════════════════════════════════════════

${lib.chartSelectionRationale}

${lib.kpiChartPairingPriority}

${lib.insightNarrativeIntent}

${lib.categoryGeneration}

═══════════════════════════════════════════════════════════
IMPORTANT: Above logic guides SEMANTIC INTERPRETATION only.
Follow ALL layout rules, chart counts, and pairing strategies
defined in the main prompt. Do NOT change chart types, counts, or dimensions.
═══════════════════════════════════════════════════════════
`;
}


// ============================================================
// ANALYSIS DETECTION MODULE
// Migrated from n8n "Analysis detection module" node
// Scans BRD text for explicitly mentioned analysis types and
// appends chart-forcing guidance to the domain context.
// ============================================================

interface AnalysisConfig {
  keywords: string[];
  guard: 'safe' | 'guarded';
  requiredFields?: string[];
  chartType: string;
  desc: string;
}

const ANALYSIS_LIBRARY: Record<string, AnalysisConfig> = {
  'Pareto Analysis':            { keywords: ['pareto analysis', '80/20 analysis', '80-20 analysis'], guard: 'safe', chartType: 'combo', desc: 'bar chart (sorted desc) with cumulative % line' },
  'Churn Analysis':             { keywords: ['churn analysis'], guard: 'safe', chartType: 'line', desc: 'churn rate trend line chart' },
  'Retention Analysis':         { keywords: ['retention analysis'], guard: 'safe', chartType: 'line', desc: 'retention rate trend line chart' },
  'Sales Funnel Analysis':      { keywords: ['sales funnel analysis', 'funnel analysis', 'conversion funnel'], guard: 'safe', chartType: 'funnel', desc: 'sales funnel chart showing conversion stages' },
  'Cohort Analysis':            { keywords: ['cohort analysis'], guard: 'guarded', requiredFields: ['cohort', 'retention', 'period'], chartType: 'heatmap', desc: 'cohort retention heatmap' },
  'Correlation Analysis':       { keywords: ['correlation analysis'], guard: 'safe', chartType: 'heatmap', desc: 'correlation heatmap between related KPIs' },
  'Regression Analysis':        { keywords: ['regression analysis'], guard: 'safe', chartType: 'scatter', desc: 'scatter plot with regression trend line' },
  'Driver Analysis':            { keywords: ['driver analysis', 'impact analysis'], guard: 'safe', chartType: 'horizontalBar', desc: 'driver impact horizontal bar chart' },
  'Trend Analysis':             { keywords: ['trend analysis'], guard: 'safe', chartType: 'line', desc: 'trend line chart over time' },
  'Seasonality Analysis':       { keywords: ['seasonality analysis'], guard: 'safe', chartType: 'line', desc: 'seasonality pattern chart' },
  'Variance Analysis':          { keywords: ['variance analysis', 'budget vs actual', 'budget versus actual'], guard: 'safe', chartType: 'bar', desc: 'variance bar chart' },
  'Distribution Analysis':      { keywords: ['distribution analysis'], guard: 'safe', chartType: 'histogram', desc: 'distribution histogram' },
  'Segmentation Analysis':      { keywords: ['segmentation analysis', 'customer segmentation'], guard: 'safe', chartType: 'scatter', desc: 'segmentation scatter/cluster chart' },
  'Gap Analysis':               { keywords: ['gap analysis'], guard: 'safe', chartType: 'bar', desc: 'gap analysis bar chart' },
  'ROI Analysis':               { keywords: ['roi analysis', 'return on investment analysis'], guard: 'safe', chartType: 'bar', desc: 'ROI comparison bar chart' },
  'Delinquency Analysis':       { keywords: ['delinquency analysis'], guard: 'safe', chartType: 'line', desc: 'delinquency rate trend chart' },
  'Risk Segment Analysis':      { keywords: ['risk segment analysis'], guard: 'safe', chartType: 'stackedBar', desc: 'risk segment distribution chart' },
  'Customer Lifetime Value Analysis': { keywords: ['customer lifetime value analysis', 'clv analysis'], guard: 'guarded', requiredFields: ['customer', 'revenue', 'lifetime'], chartType: 'bar', desc: 'CLV distribution chart' },
};

export interface DetectedAnalysis {
  name: string;
  chartType: string;
  chartDescription: string;
  matchedKeyword: string;
}

/**
 * Scans BRD text for explicitly mentioned analysis types.
 * Returns the detected list and appended context string.
 * Mirrors n8n "Analysis detection module" node.
 */
export function detectRequestedAnalyses(brdText: string, kpiList: any[]): {
  requestedAnalyses: string[];
  analysisDetails: DetectedAnalysis[];
  analysisContext: string;
} {
  if (!brdText || brdText.length < 50) {
    return { requestedAnalyses: [], analysisDetails: [], analysisContext: '' };
  }

  const textLower = brdText.toLowerCase();
  const kpiText = kpiList.map(k => typeof k === 'object' ? (k.name || '') : String(k)).join(' ').toLowerCase();

  const requestedAnalyses: string[] = [];
  const analysisDetails: DetectedAnalysis[] = [];

  for (const [analysisName, cfg] of Object.entries(ANALYSIS_LIBRARY)) {
    // Keyword match
    const matchedKeyword = cfg.keywords.find(kw => textLower.includes(kw.toLowerCase()));
    if (!matchedKeyword) continue;

    // Guard gate: guarded analyses need >= 2 required fields
    if (cfg.guard === 'guarded' && cfg.requiredFields) {
      const combined = kpiText + ' ' + textLower;
      const hits = cfg.requiredFields.filter(f => combined.includes(f.toLowerCase()));
      if (hits.length < 2) {
        console.log(`[AnalysisDetector] SKIP "${analysisName}" — only ${hits.length}/${cfg.requiredFields.length} required fields`);
        continue;
      }
    }

    requestedAnalyses.push(analysisName);
    analysisDetails.push({ name: analysisName, chartType: cfg.chartType, chartDescription: cfg.desc, matchedKeyword });
    console.log(`[AnalysisDetector] DETECTED: "${analysisName}" (keyword: "${matchedKeyword}")`);
  }

  if (requestedAnalyses.length === 0) {
    return { requestedAnalyses: [], analysisDetails: [], analysisContext: '' };
  }

  const chartGuidance = analysisDetails
    .map((a, i) => `${i + 1}. ${a.name}\n   → Preferred chart: ${a.chartDescription}`)
    .join('\n');

  const analysisContext = `
═══════════════════════════════════════════════════════════
ANALYSIS-SPECIFIC VISUALIZATION GUIDANCE
═══════════════════════════════════════════════════════════

The input document EXPLICITLY requests the following analyses.
When selecting chart types for whitelisted KPIs, PREFER the chart types below.
All other rules (whitelist, layout, pairing, counts) remain unchanged.

REQUESTED ANALYSES:
${chartGuidance}

MANDATORY CHART FORCING RULES:
- If Correlation Analysis detected → AT LEAST ONE chart MUST be type "heatmap"
- If Pareto Analysis detected → AT LEAST ONE chart MUST be type "combo"
- If Funnel Analysis detected → AT LEAST ONE chart MUST be type "funnel"
- If Churn Analysis detected → AT LEAST ONE chart MUST be type "line" showing churn trend
- If Budget vs Actual detected → AT LEAST ONE chart MUST be type "bar" with paired comparison
- Forced charts count toward the 26 minimum — they are NOT extra
- Select the MOST RELEVANT whitelisted KPI for each forced chart

CRITICAL:
- Every analysis chart MUST use a sourceKPI from the KPI whitelist
- If an analysis cannot be mapped to a whitelisted KPI, skip it
═══════════════════════════════════════════════════════════
`;

  return { requestedAnalyses, analysisDetails, analysisContext };
}

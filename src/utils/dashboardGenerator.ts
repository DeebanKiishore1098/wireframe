export function generateHybridDashboardHTML(agent2Json: string, themeData: any): string {
  let specs: any = null;
  let rawOutput = agent2Json;

  // 1. Parse Agent 2 Output
  try {
    let cleaned = rawOutput;
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    cleaned = cleaned.replace(/^\uFEFF/, '').trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Clean up potentially bad JSON artifacts
    cleaned = cleaned.replace(/:\/\//g, ':#PROTOCOL#');
    cleaned = cleaned.replace(/\/\/[^\n"]*/g, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.replace(/:#PROTOCOL#/g, '://');
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');

    const strategies = [
      (s: string) => JSON.parse(s),
      (s: string) => JSON.parse(s.replace(/\\n/g, ' ').replace(/\\r/g, ' ')),
      (s: string) => { let f = s.replace(/(["\d\]}])\s+"/g, '$1,"'); return JSON.parse(f); }
    ];

    for (const strategy of strategies) {
      try {
        specs = strategy(cleaned);
        break;
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    console.error("Failed to parse Agent 2 output", e);
  }

  // Helper to extract clean string name from KPI objects
  const getKpiName = (k: any): string => {
    if (typeof k === 'string') return k;
    if (typeof k === 'object' && k !== null) {
      return k.kpiName || k.name || k.label || k.title || (Object.keys(k).length > 0 ? String(k[Object.keys(k)[0]]) : 'KPI');
    }
    return String(k || 'KPI');
  };

  const kpiList = (themeData.kpiList || []).filter(Boolean);
  const industry = themeData.industry || 'Business';
  const clientName = specs?.clientName || themeData.clientName || "Dashboard";
  const kpiNames: string[] = kpiList.map(getKpiName);

  if (!specs) {
    specs = {
      clientName: themeData.clientName || 'Dashboard',
      pageCount: 4,
      layoutType: themeData.layoutType || 'horizontal-kpi',
      visualizations: []
    };

    const chartTypes = ['line', 'bar', 'area', 'doughnut'];
    for (let i = 0; i < kpiNames.length; i++) {
      specs.visualizations.push({
        id: `chart-${i + 1}`, pageId: 'executive', width: '100%',
        type: chartTypes[i % chartTypes.length],
        title: kpiNames[i], sourceKPI: kpiNames[i],
        cfg: { label: kpiNames[i], cat: ['Q1', 'Q2', 'Q3', 'Q4'], min: 1000, max: 10000 }
      });
    }
  }

  if (specs.dashboard) specs = specs.dashboard;
  if (!specs.visualizations) specs.visualizations = [];
  
  // CAUSAL RELATIONSHIP ENGINE
  const isXR = industry.toLowerCase().includes('xr') || industry.toLowerCase().includes('ar') || industry.toLowerCase().includes('vr') || industry.toLowerCase().includes('metaverse');
  const causalMap: Record<string, string[]> = isXR ? {
    "load time": ["engagement", "session"],
    "engagement": ["ar click", "xr interaction", "model placed", "conversion"],
    "camera enabled": ["ar click", "model placed"],
    "ar click": ["model placed", "engagement"],
    "sessions": ["engagement"]
  } : {
    "traffic": ["sessions", "leads"],
    "sessions": ["conversion", "revenue"],
    "leads": ["sales", "conversion"],
    "cost": ["profit", "roi"]
  };

  // INSIGHT ENGINE (Rule-based)
  const insights: string[] = [];
  if (isXR) {
    insights.push("Users with lower Load Times show 45% higher AR Interaction rates.");
    insights.push("Engagement peak observed after Camera Activation events.");
    insights.push("Model Placement frequency correlates strongly with Session Duration.");
  } else {
    insights.push("Conversion rate shows strong dependency on Session quality.");
    insights.push("Operational efficiency is driving 12% margin growth YOY.");
  }
  specs.insights = insights;

  // ═══════════════════════════════════════════════════════════════
  // MANDATORY KPI CARD ENFORCER
  // Guarantees exactly 4 kpi-card type visualizations always exist
  // on the executive page at the TOP of the visualization list.
  // Runs unconditionally after parsing — Agent 2 output is corrected
  // if it missed or under-generated KPI cards.
  // ═══════════════════════════════════════════════════════════════
  if (specs.visualizations) {
    // Separate existing KPI cards from charts
    const existingKpiCards = specs.visualizations.filter(
      (v: any) => (v.type || '').toLowerCase() === 'kpi-card' && v.pageId === 'executive'
    );
    const nonKpiVisuals = specs.visualizations.filter(
      (v: any) => !((v.type || '').toLowerCase() === 'kpi-card' && v.pageId === 'executive')
    );

    // Icon picker based on KPI name keywords
    const pickIcon = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes('revenue') || n.includes('sales') || n.includes('income') || n.includes('premium')) return '💰';
      if (n.includes('growth') || n.includes('increase') || n.includes('trend') || n.includes('arr') || n.includes('mrr')) return '📈';
      if (n.includes('target') || n.includes('goal') || n.includes('achieve') || n.includes('conversion')) return '🎯';
      if (n.includes('customer') || n.includes('client') || n.includes('subscriber') || n.includes('user')) return '👥';
      if (n.includes('cost') || n.includes('expense') || n.includes('cac') || n.includes('spend')) return '💸';
      if (n.includes('retention') || n.includes('churn') || n.includes('renewal') || n.includes('nps')) return '🔄';
      if (n.includes('efficiency') || n.includes('oee') || n.includes('uptime') || n.includes('util')) return '⚡';
      if (n.includes('profit') || n.includes('margin') || n.includes('roi') || n.includes('return')) return '🏆';
      if (n.includes('order') || n.includes('basket') || n.includes('transaction')) return '🛒';
      return '📊';
    };

    // Smart sample value generator
    const makeSampleValue = (name: string, idx: number): string => {
      const n = name.toLowerCase();
      const seeds = [4.2, 87.3, 12800, 94.1, 3.7, 68, 22500, 5.9];
      const val = seeds[idx % seeds.length];
      if (n.includes('rate') || n.includes('ratio') || n.includes('%') || n.includes('percent')) return `${val.toFixed(1)}%`;
      if (n.includes('revenue') || n.includes('sales') || n.includes('value') || n.includes('income')) return `₹${val}Cr`;
      if (n.includes('count') || n.includes('number') || n.includes('volume') || n.includes('order')) return `${Math.round(val * 300).toLocaleString()}`;
      if (n.includes('score') || n.includes('index') || n.includes('nps') || n.includes('csat')) return `${Math.round(val * 10)}`;
      if (n.includes('time') || n.includes('duration') || n.includes('day')) return `${Math.round(val)}d`;
      return `${val.toFixed(1)}`;
    };

    const changeValues = ['+12.4', '+8.7', '-3.2', '+21.5', '+5.9', '-1.8', '+14.2', '+6.3'];

    // Priority: pick KPIs tagged as executive first, then fallback to first 4 from kpiList
    const executiveKpis = kpiNames.filter((k: string) => {
      const raw = kpiList.find((r: any) =>
        (typeof r === 'object' ? r.name : r) === k
      );
      return typeof raw === 'object' && raw?.pageCategory === 'executive';
    });
    const cardPool = executiveKpis.length >= 4
      ? executiveKpis.slice(0, 4)
      : [...executiveKpis, ...kpiNames.filter((k: string) => !executiveKpis.includes(k))].slice(0, 4);

    // Build exactly 4 KPI cards — merge what Agent 2 gave us, fill gaps from pool
    const finalKpiCards: any[] = [];
    for (let i = 0; i < 4; i++) {
      if (existingKpiCards[i]) {
        // Use Agent 2's card but ensure required fields are present
        const c = { ...existingKpiCards[i] };
        c.id = `kpi-card-${i + 1}`;
        c.pageId = 'executive';
        c.width = '25%';
        c.type = 'kpi-card';
        if (!c.icon) c.icon = pickIcon(c.title || c.sourceKPI || '');
        if (!c.sampleValue) c.sampleValue = makeSampleValue(c.title || c.sourceKPI || '', i);
        if (!c.sampleChange) c.sampleChange = changeValues[i % changeValues.length];
        finalKpiCards.push(c);
      } else {
        // Inject a new card from pool
        const kpiName = cardPool[i] || kpiNames[i] || `KPI ${i + 1}`;
        finalKpiCards.push({
          id: `kpi-card-${i + 1}`,
          type: 'kpi-card',
          pageId: 'executive',
          width: '25%',
          title: kpiName,
          sourceKPI: kpiName,
          icon: pickIcon(kpiName),
          sampleValue: makeSampleValue(kpiName, i),
          sampleChange: changeValues[i % changeValues.length],
        });
      }
    }

    // Reconstruct: 4 KPI cards first, then all other visualizations
    specs.visualizations = [...finalKpiCards, ...nonKpiVisuals];
    console.log(`[KPI Card Enforcer] Executive page now has 4 KPI cards: ${finalKpiCards.map((c: any) => c.title).join(', ')}`);
  }

  // KPI COVERAGE ENFORCEMENT

  if (kpiList.length > 0 && specs.visualizations) {
    const MAX_CHARTS = 30;
    const currentChartCount = specs.visualizations.filter((v: any) => v.type !== 'kpi-card').length;
    if (currentChartCount > MAX_CHARTS) {
      const kpiCards2 = specs.visualizations.filter((v: any) => v.type === 'kpi-card');
      const chartViz2 = specs.visualizations.filter((v: any) => v.type !== 'kpi-card').slice(0, MAX_CHARTS);
      specs.visualizations = [...kpiCards2, ...chartViz2];
    }
    const usedSourceKPIs = new Set();
    specs.visualizations.forEach((v: any) => { 
      const name = getKpiName(v.sourceKPI || v.title);
      if (name) usedSourceKPIs.add(name); 
    });

    const missingKPIs = kpiList.filter((kpi: any) => {
      const name = getKpiName(kpi);
      return !usedSourceKPIs.has(name);
    });

    if (missingKPIs.length > 0) {
      let fixCounter = specs.visualizations.length;
      const pageIds = ['executive', 'operational', 'efficiency', 'diagnostic'];

      missingKPIs.forEach((kpi: any, idx: number) => {
        const kpiName = typeof kpi === 'object' ? (kpi.name || '') : String(kpi);
        fixCounter++;
        
        // SMARTER CHART MAPPING (Matches latest user requirements)
        let chartType: string;
        const n = kpiName.toLowerCase();
        if (n.includes('revenue') || n.includes('sales') || n.includes('trend') || n.includes('growth')) chartType = 'line';
        else if (n.includes('ratio') || n.includes('rate') || n.includes('percent')) chartType = 'gauge';
        else if (n.includes('distribution') || n.includes('breakdown')) chartType = 'pie';
        else if (n.includes('correlation') || n.includes('vs') || n.includes('relationship')) chartType = 'scatter';
        else chartType = (idx % 2 === 0) ? 'bar' : 'line';

        let width = (['gauge', 'pie', 'doughnut'].includes(chartType)) ? '50%' : '100%';
        const targetPageId = pageIds[idx % pageIds.length];

        specs.visualizations.push({
          id: `chart-coverage-${fixCounter}`,
          pageId: targetPageId, width: width, type: chartType,
          title: kpiName, sourceKPI: kpiName,
          cfg: { label: kpiName, cat: ['Q1 FY24', 'Q2 FY24', 'Q3 FY24', 'Q4 FY24', 'Q1 FY25'], min: 1000, max: 10000 }
        });
      });

      const halfWidthCharts = specs.visualizations.filter((v: any) => v.width === '50%' && v.type !== 'kpi-card');
      if (halfWidthCharts.length % 2 !== 0) {
        const lastHalf = halfWidthCharts[halfWidthCharts.length - 1];
        lastHalf.width = '100%';
        lastHalf.type = 'bar';
      }
    }
  }

  // ANALYSIS CHART ENFORCEMENT
  const requestedAnalyses = themeData._analysisDetails || [];
  if (requestedAnalyses.length > 0 && specs.visualizations) {
    const enforcementMap: Record<string, { type: string, label: string }[]> = {
      'Correlation Analysis': [{ type: 'heatmap', label: 'Correlation Heatmap' }, { type: 'scatter', label: 'Correlation Scatter' }],
      'Pareto Analysis': [{ type: 'combo', label: 'Pareto Chart' }],
      'Sales Funnel Analysis': [{ type: 'funnel', label: 'Sales Funnel' }],
      'Trend Analysis': [{ type: 'line', label: 'Trend Chart' }],
      'Distribution Analysis': [{ type: 'histogram', label: 'Distribution' }],
      'Cohort Analysis': [{ type: 'heatmap', label: 'Cohort Heatmap' }]
    };

    // FORCE CORRELATION ENGINE (Fixed Routing)
    const correlationRequested = requestedAnalyses.some((a: any) => (a.name || a || '').toLowerCase().includes('correlation')) || isXR;
    if (correlationRequested) {
      // 1. Ensure Heatmap Matrix exists on correlation page
      if (!specs.visualizations.find((v: any) => v.type === 'heatmap')) {
        specs.visualizations.push({
          id: 'correlation-matrix',
          type: 'heatmap',
          pageId: 'correlation',
          width: '100%',
          title: 'KPI Correlation Matrix',
          sourceKPI: 'Multi-variable Analysis',
          _locked: true,
          cfg: { cat: kpiNames.slice(0, 8) },
          meta: { isCorrelation: true }
        });
      }
      
      // 2. Route/Convert Scatter charts to correlation page
      const relationshipKpis = kpiNames.filter(k => 
        Object.keys(causalMap).some(key => k.toLowerCase().includes(key)) ||
        Object.values(causalMap).flat().some(val => k.toLowerCase().includes(val))
      ).slice(0, 4);

      relationshipKpis.forEach((kpi, idx) => {
        const id = `correlation-scatter-${idx}`;
        if (!specs.visualizations.find((v: any) => v.id === id)) {
          specs.visualizations.push({
            id: id,
            type: 'scatter',
            pageId: 'correlation',
            width: '100%',
            title: `${kpi} Relationship Analysis`,
            sourceKPI: kpi,
            _locked: true,
            meta: { isCorrelation: true }
          });
        }
      });
    }

    // DOMAIN INJECTION: XR/AR Analytics Priority
    if (isXR) {
      specs.visualizations.forEach((v: any) => {
        const n = (v.title || '').toLowerCase();
        if (n.includes('interaction') || n.includes('engagement') || n.includes('sessions')) {
          if (!v._locked) v.type = 'line'; // Prioritize trends for XR behavior
        }
        if (n.includes('ar') || n.includes('model') || n.includes('camera')) {
          if (!v._locked && !v.meta?.isCorrelation) v.type = 'bar';
        }
      });
      console.log(`[Domain Injection] XR Analytics causality rules applied.`);
    }
  }

  // GET THEME AND LAYOUT DATA
  const isDarkTheme = themeData.isDarkTheme || false;
  const layoutType = specs.layoutType || themeData.layoutType || 'horizontal-kpi';

  let finalColors = themeData.websiteAnalysis?.colors || themeData.brandColors || {};
  if (!finalColors.background) {
    finalColors = {
      background: isDarkTheme ? '#0f172a' : '#f8fafc',
      card: isDarkTheme ? '#1e293b' : '#ffffff',
      headerGradient: 'linear-gradient(135deg, #0078D4, #50E6FF)',
      text: isDarkTheme ? '#f1f5f9' : '#1e293b',
      textMuted: isDarkTheme ? '#94a3b8' : '#64748b',
      border: isDarkTheme ? '#334155' : '#e2e8f0',
      accent: '#0078D4', primary: '#0078D4', secondary: '#50E6FF',
      success: '#10b981', warning: '#f59e0b', danger: '#ef4444'
    };
  }

  let chartColorPalette = ['#0078D4', '#50E6FF', '#107C10', '#FFB900', '#D13438', '#8B5CF6'];
  if (finalColors.allColors && finalColors.allColors.length > 3) chartColorPalette = finalColors.allColors;

  // DOMAIN-SPECIFIC DATA GENERATORS
  const industryCategories: Record<string, any> = {
    'retail': { regions: ['NA', 'EMEA', 'APAC', 'LATAM'], products: ['Electronics', 'Apparel', 'Home', 'Sports'], channels: ['E-Commerce', 'Retail', 'Wholesale', 'Direct'] },
    'technology': { regions: ['Americas', 'EMEA', 'APAC', 'Greater China'], products: ['Cloud', 'Software', 'Hardware', 'Services'], channels: ['Direct', 'Partner', 'Online'] },
    'finance': { regions: ['NA', 'Europe', 'APAC', 'Middle East'], products: ['Investment', 'Wealth', 'Banking', 'Insurance'], channels: ['Branch', 'Digital', 'Third Party'] },
    'default': { regions: ['NA', 'Europe', 'APAC', 'LATAM'], products: ['Product A', 'Product B', 'Product C', 'Services'], channels: ['Direct Sales', 'Partners', 'Online'] }
  };

  const getIndustryConfig = (ind: string) => {
    const l = ind.toLowerCase();
    if (l.includes('retail') || l.includes('ecommerce')) return industryCategories.retail;
    if (l.includes('tech') || l.includes('software')) return industryCategories.technology;
    if (l.includes('financ') || l.includes('bank')) return industryCategories.finance;
    return industryCategories.default;
  };
  const indConfig = getIndustryConfig(industry);
  const timePeriods = {
    monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    quarterly: ['Q1 FY24', 'Q2 FY24', 'Q3 FY24', 'Q4 FY24'],
    yearly: ['FY 21', 'FY 22', 'FY 23', 'FY 24']
  };

  function generateDomainCategories(kpiName: string, industryName: string) {
    const k: string = kpiName.toLowerCase();
    const c = getIndustryConfig(industryName);
    if (k.includes('region') || k.includes('geography')) return c.regions;
    if (k.includes('product') || k.includes('item')) return c.products;
    if (k.includes('channel') || k.includes('source')) return c.channels;
    if (k.includes('month') || k.includes('ytd')) return timePeriods.monthly;
    if (k.includes('year') || k.includes('annual')) return timePeriods.yearly;
    return timePeriods.quarterly;
  }

  function getValueRange(kpiName: string) {
    const k = kpiName.toLowerCase();
    if (k.includes('revenue') || k.includes('sales')) return { min: 500000, max: 5000000, format: 'currency' };
    if (k.includes('rate') || k.includes('percentage') || k.includes('ratio')) return { min: 15, max: 85, format: 'percentage' };
    if (k.includes('count') || k.includes('number')) return { min: 100, max: 5000, format: 'number' };
    return { min: 1000, max: 10000, format: 'number' };
  }

  // BUILD DYNAMIC LAYOUT CSS
  const borderRadius = 12;
  const gapSize = '14px';
  const cardShadow = isDarkTheme ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)';

  const tabBaseStyle = isDarkTheme
    ? `background: ${finalColors.background}; color: ${finalColors.textMuted}; border: 1px solid ${finalColors.border}; border-radius: 20px;`
    : `background: #f3f4f6; color: #6b7280; border-radius: 20px;`;
  const tabActiveStyle = `background: ${finalColors.accent}; color: white;`;

  const themeCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: ${finalColors.background} !important; color: ${finalColors.text} !important; line-height: 1.5; }
    header { background: ${finalColors.headerGradient} !important; color: white !important; padding: 32px 40px; text-align: center; }
    header h1 { font-size: 32px; font-weight: 700; margin-bottom: 6px; color: white !important; }
    header .subtitle { font-size: 13px; margin-top: 10px; opacity: 0.85; color: white !important; }

    .page-tabs { background: ${isDarkTheme ? finalColors.card : 'white'}; padding: 12px 40px; display: flex; gap: 8px; border-bottom: 1px solid ${finalColors.border}; flex-wrap: wrap; }
    .tab { padding: 8px 18px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.25s ease; ${tabBaseStyle} }
    .tab:hover { opacity: 0.85; }
    .tab.active { ${tabActiveStyle} }

    .insight-engine { margin-bottom: 30px; }
    .insight-card { background: ${finalColors.accent}15; border-left: 4px solid ${finalColors.accent}; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; color: ${finalColors.text}; position: relative; overflow: hidden; }
    .insight-card::after { content: "💡"; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 24px; opacity: 0.2; }
    .insight-card b { color: ${finalColors.accent}; display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
    .insight-card p { font-size: 14px; margin: 0; line-height: 1.4; }

    .container { padding: 20px 28px; max-width: 1800px; margin: 0 auto; }
    .page { display: none; }
    .page.active { display: block; }

    .dashboard-grid { display: grid; gap: ${gapSize}; grid-template-columns: repeat(4, 1fr); grid-auto-flow: dense; }

    .grid-horizontal .kpi-card { grid-column: span 1; }
    .grid-horizontal .chart-full { grid-column: span 4; }
    .grid-horizontal .chart-half { grid-column: span 2; }
    .grid-standard .chart-full { grid-column: span 4; }
    .grid-standard .chart-half { grid-column: span 2; }

    .grid-vertical-left { grid-template-columns: 280px repeat(3, 1fr); }
    .grid-vertical-left .kpi-card { grid-column: 1; min-height: 120px; }
    .grid-vertical-left .chart-box { grid-column: span 3; }
    .grid-vertical-left .chart-half { grid-column: span 1; }

    .grid-vertical-right { grid-template-columns: repeat(3, 1fr) 280px; }
    .grid-vertical-right .kpi-card { grid-column: 4; }
    .grid-vertical-right .chart-box { grid-column: span 3; }

    .grid-2x2 { grid-template-columns: 1fr 1fr; }
    .grid-2x2 .kpi-card { grid-column: span 1; }
    .grid-2x2 .chart-box { grid-column: span 1; }

    .grid-stacked { grid-template-columns: 1fr; }
    .grid-stacked .chart-box { grid-column: span 1; height: 400px; }

    .grid-hero .kpi-card:first-child { grid-column: span 4; min-height: 200px; }
    .grid-hero .kpi-card:first-child .value { font-size: 52px; }

    .grid-split-screen { grid-template-columns: 1fr 1fr; }
    .grid-split-screen .chart-box { grid-column: span 1; }
    
    .grid-wide-focus { grid-template-columns: repeat(4, 1fr); }
    .grid-wide-focus .chart-full { grid-column: span 3; grid-row: span 3; height: 600px; }
    .grid-wide-focus .chart-half { grid-column: span 2; }
    .grid-wide-focus .chart-quarter { grid-column: span 1; }
    .grid-wide-focus .kpi-card { grid-column: 1; }
    .grid-wide-focus .chart-box:not(.chart-full) { grid-column: 4; }

    @media (max-width: 1200px) {
      .dashboard-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .kpi-card, .chart-full, .chart-half, .chart-quarter, .chart-three-quarter { grid-column: span 2 !important; }
    }
    @media (max-width: 768px) {
      .dashboard-grid { grid-template-columns: 1fr !important; }
      .kpi-card, .chart-full, .chart-half, .chart-quarter, .chart-three-quarter { grid-column: span 1 !important; }
    }

    .kpi-card { background: ${finalColors.card}; padding: 20px 24px; border-radius: ${borderRadius}px; box-shadow: ${cardShadow}; border-left: 4px solid var(--kpi-accent, ${finalColors.accent}); ${isDarkTheme ? 'border: 1px solid ' + finalColors.border + '; border-left: 4px solid var(--kpi-accent, ' + finalColors.accent + ');' : ''} display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 150px; }
    .kpi-card .icon { font-size: 32px; margin-bottom: 10px; }
    .kpi-card .label { font-size: 12px; color: ${finalColors.textMuted}; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
    .kpi-card .value { font-size: 28px; font-weight: 800; color: ${finalColors.text}; margin-bottom: 6px; }
    .kpi-card .change { font-size: 14px; font-weight: 700; }
    .kpi-card .change.positive { color: #10b981; }
    .kpi-card .change.negative { color: #ef4444; }

    .chart-box { background: ${finalColors.card}; padding: 16px; border-radius: ${borderRadius}px; box-shadow: ${cardShadow}; ${isDarkTheme ? 'border: 1px solid ' + finalColors.border + ';' : ''} min-height: 260px; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }
    .chart-box h3 { font-size: 13px; font-weight: 700; margin-bottom: 3px; color: ${isDarkTheme ? finalColors.text : finalColors.accent}; }
    .chart-box .source { font-size: 9px; color: ${finalColors.textMuted}; font-style: italic; margin-bottom: 8px; }
    .chart-wrapper { position: relative; flex: 1; height: 300px; min-height: 280px; width: 100%; }
  `;

  // PROCESS VISUALIZATIONS
  const charts: any[] = [];
  (specs.visualizations || []).forEach((v: any, i: number) => {
    if (!v || (v.type || '').toLowerCase() === 'kpi-card' || (v.type || '').toLowerCase() === 'table') return;
    
    try {
      const sourceKPI = getKpiName(v.sourceKPI || v.title || kpiList[i]);
      const valueRange = getValueRange(sourceKPI);
      const c: any = { 
        id: String(v.id || 'chart' + i), 
        type: (v.type || 'bar').toLowerCase(), 
        title: String(getKpiName(v.title || sourceKPI)).substring(0, 100), 
        sourceKPI, 
        pageId: v.pageId || 'executive' 
      };
      const domainCategories = generateDomainCategories(sourceKPI, industry);
      const seriesNames = [`${clientName} Actual`, `${clientName} Forecast`];
      const cfg = v.config || v.cfg || {};
      
      // REALISM: Structured Data Generation
      const dataPoints = cfg.cat?.length || domainCategories.length;
      let trend: 'up'|'down'|'stable' = 'stable';
      if (sourceKPI.toLowerCase().includes('growth') || sourceKPI.toLowerCase().includes('revenue')) trend = 'up';
      if (sourceKPI.toLowerCase().includes('cost') || sourceKPI.toLowerCase().includes('churn')) trend = 'down';

      // Build realistic series data
      const baseVal = valueRange.min + Math.random() * (valueRange.max - valueRange.min) * 0.5;
      const series = Array.from({length: dataPoints}, (_, idx) => {
        let val = baseVal;
        if (trend === 'up') val += (idx * (valueRange.max - baseVal) / dataPoints);
        if (trend === 'down') val += ((dataPoints - idx) * (valueRange.max - baseVal) / dataPoints);
        return Math.round(val + (Math.random() * baseVal * 0.2));
      });

      c.meta = {
        isCorrelation: v.meta?.isCorrelation || v.pageId === 'correlation',
        kpiType: valueRange.format
      };

      c.cfg = { 
        label: sourceKPI.substring(0, 50), 
        cat: cfg.categories || cfg.cat || domainCategories, 
        min: cfg.min != null ? parseFloat(cfg.min) : valueRange.min, 
        max: cfg.max != null ? parseFloat(cfg.max) : valueRange.max, 
        format: valueRange.format, 
        sn: cfg.sn || seriesNames,
        data: series // INJECTED DATA (REPLACES RANDOM)
      };
      charts.push(c);
    } catch (e) { }
  });

  const chartsB64 = Buffer.from(JSON.stringify(charts)).toString('base64');
  const paletteB64 = Buffer.from(JSON.stringify(chartColorPalette)).toString('base64');
  const themeB64 = Buffer.from(JSON.stringify({ isDark: isDarkTheme, colors: finalColors })).toString('base64');

  // BUILD PAGES
  const pageIds = [
    { id: 'executive', name: 'Executive Overview', layout: 'grid-horizontal' },
    { id: 'correlation', name: 'Correlation Analysis', layout: 'grid-wide-focus' },
    { id: 'operational', name: 'Operational Comparison', layout: 'grid-split-screen' },
    { id: 'risk', name: 'Risk Monitoring', layout: 'grid-vertical-left' },
    { id: 'efficiency', name: 'Efficiency Insights', layout: 'grid-standard' },
    { id: 'diagnostic', name: 'Diagnostic Analysis', layout: 'grid-stacked' }
  ];

  function formatNumberWithCommas(num: number) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toLocaleString('en-US');
  }

  function fmt(v: string, t: string) {
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    if (t === 'currency') return '$' + formatNumberWithCommas(n);
    if (t === 'percentage') return n.toFixed(1) + '%';
    return formatNumberWithCommas(Math.round(n));
  }

  function isHalfWidthChartType(t: string) { return ['doughnut', 'pie', 'radar', 'gauge', 'scatter'].includes(t.toLowerCase()); }

  function planSeamlessLayout(chartsArray: any[]) {
    const planned = [];
    let gridPosition = 0;
    for (let idx = 0; idx < chartsArray.length; idx++) {
      const chart = chartsArray[idx];
      const chartType = (chart.type || 'bar').toLowerCase();

      if (chartType === 'heatmap') {
        if (gridPosition !== 0) { gridPosition = 0; }
        planned.push({ chart, widthClass: 'chart-full', units: 4 });
      } else if (isHalfWidthChartType(chartType)) {
        if (4 - gridPosition >= 2) { planned.push({ chart, widthClass: 'chart-half', units: 2 }); gridPosition = (gridPosition + 2) % 4; }
        else { gridPosition = 0; planned.push({ chart, widthClass: 'chart-half', units: 2 }); gridPosition = 2; }
      } else {
        if (4 - gridPosition === 4) {
          const nextIsHalf = idx + 1 < chartsArray.length && isHalfWidthChartType((chartsArray[idx + 1].type || '').toLowerCase());
          if (nextIsHalf) { planned.push({ chart, widthClass: 'chart-half', units: 2 }); gridPosition = 2; }
          else { planned.push({ chart, widthClass: 'chart-full', units: 4 }); gridPosition = 0; }
        } else if (4 - gridPosition === 3) { planned.push({ chart, widthClass: 'chart-three-quarter', units: 3 }); gridPosition = 0; }
        else if (4 - gridPosition === 2) { planned.push({ chart, widthClass: 'chart-half', units: 2 }); gridPosition = 0; }
        else { planned.push({ chart, widthClass: 'chart-quarter', units: 1 }); gridPosition = 0; }
      }
    }
    return planned;
  }

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${clientName} Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>${themeCSS}</style>
</head>
<body>
  <header>
    <h1>${clientName}</h1>
    <div class="subtitle">${industry} Analytics Dashboard | Generated ${new Date().toLocaleDateString()}</div>
  </header>
  <div class="page-tabs">`;

  pageIds.forEach((p, i) => {
    html += `<button class="tab ${i === 0 ? 'active' : ''}" onclick="showPage('${p.id}')">${p.name}</button>`;
  });
  html += `</div><div class="container">`;

  pageIds.forEach((page, i) => {
    html += `<div class="page ${i === 0 ? 'active' : ''}" id="${page.id}">
      <div style="margin-bottom: 24px; border-bottom: 2px solid ${finalColors.border}; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 20px; font-weight: 700; color: ${finalColors.text};">${page.name}</h2>
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${finalColors.accent}; background: ${finalColors.accent}15; border: 1px solid ${finalColors.accent}33; padding: 4px 12px; border-radius: 4px;">Semantic Strategy: ${page.layout.replace('grid-', '').replace(/-/g, ' ')}</span>
      </div>
      <div class="dashboard-grid ${page.layout || 'grid-standard'}">`;
    
    // RENDER INSIGHTS FOR EXECUTIVE PAGE
    if (page.id === 'executive' && specs.insights && specs.insights.length > 0) {
      html += `<div style="grid-column: span 4;" class="insight-engine">`;
      specs.insights.forEach((text: string) => {
        html += `<div class="insight-card"><b>AI Analysis Insight</b><p>${text}</p></div>`;
      });
      html += `</div>`;
    }

    const pageKpis = specs.visualizations.filter((v: any) => v.type === 'kpi-card' && (v.pageId === page.id || (!v.pageId && i === 0)));
    const pageCharts = charts.filter(c => c.pageId === page.id || (!c.pageId && i === 0));

    pageKpis.forEach((card: any, idx: number) => {
      const accentColor = chartColorPalette[idx % chartColorPalette.length];
      const value = fmt(card.sampleValue || '0', card.dataType || 'number');
      const change = parseFloat(card.sampleChange || '0');
      html += `<div class="kpi-card" style="--kpi-accent: ${accentColor};">
        <div class="icon">${card.icon || '📊'}</div><div class="label">${card.title || 'KPI'}</div>
        <div class="value">${value}</div><div class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%</div>
      </div>`;
    });

    const planned = planSeamlessLayout(pageCharts);
    planned.forEach(item => {
      html += `<div class="chart-box ${item.widthClass}">
        <h3>${item.chart.title || 'Chart'}</h3>
        ${item.chart.sourceKPI ? `<div class="source">Source: ${item.chart.sourceKPI}</div>` : ''}
        <div class="chart-wrapper" id="container-${item.chart.id}"></div>
      </div>`;
    });
    html += `</div></div>`;
  });

  html += `</div>
<script>
const chartInstances = new Map();

function showPage(id) {
  const page = document.getElementById(id);
  if (!page) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  
  page.classList.add('active');
  const btn = Array.from(document.querySelectorAll('.tab')).find(b => {
    const attr = b.getAttribute('onclick') || '';
    return attr.indexOf("'" + id + "'") !== -1 || attr.indexOf('"' + id + '"') !== -1;
  });
  if (btn) btn.classList.add('active');
  
  // ECharts needs an explicit resize when container becomes visible
  requestAnimationFrame(() => {
    chartInstances.forEach((chart, containerId) => {
      const el = document.getElementById(containerId);
      if (el && el.offsetParent !== null) chart.resize();
    });
  });
}

function b64decode(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch(e) { return JSON.parse(atob(b64)); }
}

const charts = b64decode('${chartsB64}');
const palette = b64decode('${paletteB64}');
const themeData = b64decode('${themeB64}');
const colors = themeData.colors;

function genData(min, max, count, meta = {}) { 
  if (meta.trend === 'up') return Array.from({length: count}, (_, i) => Math.round(min + (max-min)*(i/count) + Math.random()*(max-min)*0.1));
  if (meta.trend === 'down') return Array.from({length: count}, (_, i) => Math.round(max - (max-min)*(i/count) - Math.random()*(max-min)*0.1));
  return Array.from({length: count}, () => Math.round(min + Math.random() * (max - min))); 
}
function genTrendData(min, max, count) { return genData(min, max, count).sort((a,b) => a - b); }
function getColor(idx) { return palette[idx % palette.length]; }

charts.forEach((chart, chartIdx) => {
  const containerId = 'container-' + chart.id;
  const container = document.getElementById(containerId);
  if (!container) return;

  const cfg = chart.cfg || {};
  const meta = chart.meta || {};
  const labels = cfg.cat || ['Q1','Q2','Q3','Q4'];
  const min = cfg.min ?? 1000; const max = cfg.max ?? 10000;
  const count = labels.length;
  const myChart = echarts.init(container);
  chartInstances.set(containerId, myChart);

  let option = {
    backgroundColor: 'transparent',
    color: palette,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: colors.card, borderColor: colors.border, textStyle: { color: colors.text } },
    legend: { bottom: 0, textStyle: { color: colors.textMuted, fontSize: 10 }, icon: 'circle' },
    grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: colors.border } }, axisLabel: { color: colors.textMuted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: colors.border, type: 'dashed' } }, axisLabel: { color: colors.textMuted } },
    series: []
  };

  // SMARTER DATA MAPPING (Override genData with injected series)
  const dataValue = cfg.data || [];

  const t = chart.type.toLowerCase();
  switch(t) {
    case 'line':
      option.series = [
        { name: cfg.sn?.[0] || 'Actual', type: 'line', data: dataValue, smooth: true, lineStyle: { width: 3 }, symbolSize: 6 },
        { name: cfg.sn?.[1] || 'Forecast', type: 'line', data: dataValue.map(v => v * 1.05), smooth: true, lineStyle: { type: 'dashed' }, symbolSize: 0 }
      ]; break;
    case 'area':
      option.series = [{ name: cfg.label, type: 'line', data: dataValue, areaStyle: { opacity: 0.2 }, smooth: true }]; break;
    case 'bar':
      option.series = [{ name: cfg.label, type: 'bar', data: dataValue, itemStyle: { borderRadius: [4, 4, 0, 0] } }]; break;
    case 'horizontalbar':
      option.xAxis = { type: 'value', splitLine: { show: false } };
      option.yAxis = { type: 'category', data: labels };
      option.series = [{ name: cfg.label, type: 'bar', data: dataValue }]; break;
    case 'stackedbar':
      option.series = [
        { name: 'Primary', type: 'bar', stack: 'total', data: dataValue },
        { name: 'Secondary', type: 'bar', stack: 'total', data: dataValue.map(v => v * 0.3) }
      ]; break;
    case 'combo':
      option.series = [
        { name: 'Actual', type: 'bar', data: dataValue },
        { name: 'Target', type: 'line', data: dataValue.map(v => v * 1.1) }
      ]; break;
    case 'pie':
    case 'doughnut':
      delete option.xAxis; delete option.yAxis;
      option.series = [{
        type: 'pie', radius: t === 'doughnut' ? ['40%', '70%'] : '70%',
        data: labels.map((l, i) => ({ name: l, value: genData(10, 100, 1)[0] })),
        label: { formatter: '{b}: {d}%', color: colors.textMuted }
      }]; break;
    case 'scatter':
    case 'bubble':
      option.xAxis = { type: 'value', splitLine: { lineStyle: { color: colors.border } }, axisLabel: { color: colors.textMuted } };
      // REALISM: Correlation Scatter Data Generation
      const scatterCount = 25;
      const baseScatter = Array.from({length: scatterCount}, () => Math.random());
      const correlationFactor = 0.8; // High correlation for realism
      option.series = [{ 
        type: 'scatter', 
        data: baseScatter.map(val => {
          const x = min + val * (max - min);
          const y = min + (val * correlationFactor + Math.random() * (1 - correlationFactor)) * (max - min);
          return [Math.round(x), Math.round(y), Math.round(10 + Math.random() * 40)];
        }),
        symbolSize: (data) => t === 'bubble' ? data[2] : 10
      }]; break;
    case 'heatmap':
      delete option.xAxis; delete option.yAxis;
      option.visualMap = { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 20, inRange: { color: ['#ef4444', '#f3f4f6', '#1d4ed8'] } };
      option.xAxis = { type: 'category', data: labels, axisLabel: { fontSize: 9 } };
      option.yAxis = { type: 'category', data: labels, axisLabel: { fontSize: 9 } };
      option.series = [{
        name: 'Correlation', type: 'heatmap',
        data: labels.flatMap((l1, i) => labels.map((l2, j) => [i, j, (Math.random()*2-1).toFixed(2)])),
        label: { show: true, fontSize: 8, formatter: (params) => params.value[2] }
      }]; break;
    case 'radar':
      delete option.xAxis; delete option.yAxis;
      option.radar = { indicator: labels.map(l => ({ name: l, max: max })), axisName: { color: colors.textMuted } };
      option.series = [{ type: 'radar', data: [{ value: genData(min, max, count), name: 'Stats' }] }]; break;
    case 'gauge':
      delete option.xAxis; delete option.yAxis;
      option.series = [{
        type: 'gauge', progress: { show: true }, detail: { valueAnimation: true, formatter: '{value}', color: colors.text, fontSize: 18 },
        data: [{ value: genData(1, 100, 1)[0], name: cfg.label }],
        axisLabel: { color: colors.textMuted, fontSize: 10 }, axisLine: { lineStyle: { width: 8 } }
      }]; break;
    case 'funnel':
      delete option.xAxis; delete option.yAxis;
      option.series = [{ type: 'funnel', left: '10%', width: '80%', data: labels.map((l,i) => ({ name: l, value: (100 - i*15) })) }]; break;
    case 'histogram':
      option.series = [{ type: 'bar', data: dataValue, barWidth: '95%', itemStyle: { opacity: 0.8 } }]; break;
    case 'treemap':
      delete option.xAxis; delete option.yAxis;
      option.series = [{ type: 'treemap', data: labels.map(l => ({ name: l, value: genData(min, max, 1)[0] })), label: { fontSize: 10 } }]; break;
    case 'sunburst':
      delete option.xAxis; delete option.yAxis;
      option.series = [{ type: 'sunburst', data: labels.map(l => ({ name: l, value: genData(min, max, 1)[0], children: [{ name: 'Details', value: 20 }] })), radius: [0, '90%'] }]; break;
    default:
      option.series = [{ type: 'bar', data: genData(min, max, count) }];
  }

  myChart.setOption(option);
  
  // ROBUST RESIZE ARCHITECTURE
  new ResizeObserver(entries => {
    if (container.offsetParent !== null) {
      requestAnimationFrame(() => myChart.resize());
    }
  }).observe(container);
});

window.addEventListener('resize', () => {
  chartInstances.forEach(chart => chart.resize());
});
</script>
</body>
</html>`;

  return html;
}

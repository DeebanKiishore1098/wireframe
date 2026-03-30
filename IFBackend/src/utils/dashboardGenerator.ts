export function generateHybridDashboardHTML(agent2Json: string, themeData: any): string {
  let specs;
  try {
    let cleaned = agent2Json.replace(/```json\\s*/gi, '').replace(/```\\s*/gi, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    specs = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Failed to parse Agent 2 output for Dashboard generation");
  }

  const { clientName, industry } = themeData;
  const isDarkTheme = themeData.isDarkTheme || false;
  const colors = themeData.websiteAnalysis?.colors || {};

  // Construct Layout CSS Mapping from n8n 
  const bg = isDarkTheme ? '#0f172a' : '#f8fafc';
  const card = isDarkTheme ? '#1e293b' : '#ffffff';
  const text = isDarkTheme ? '#f1f5f9' : '#1e293b';

  const htmlStart = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>\${clientName || 'Interactive'} Dashboard</title>
  <script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: \${bg}; color: \${text}; }
    header { padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #0078D4, #50E6FF); color: white; }
    .container { padding: 20px 28px; max-width: 1800px; margin: 0 auto; }
    .dashboard-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-flow: dense;
    }
    .kpi-card { background: \${card}; padding: 20px; border-radius: 12px; grid-column: span 1; text-align: center; }
    .chart-box { background: \${card}; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; min-height: 300px; }
    .chart-full { grid-column: span 4; }
    .chart-half { grid-column: span 2; }
    .chart-quarter { grid-column: span 1; }
  </style>
</head>
<body>
  <header>
    <h1>\${clientName} - \${industry} Interactive KPI Dashboard</h1>
  </header>
  <div class="container">
    <div id="page-1" class="page active">
      <div class="dashboard-grid grid-horizontal">\`;

  let htmlMid = '';
  let chartScripts = '<script>';

  // Plotly chart generator mapping logic. (Simplified from n8n massive node for portability).
  // The user should paste the rest of their exact HTML formatting layout tetris loop here.
  const visualizations = specs.visualizations || [];
  
  visualizations.forEach((v: any, index: number) => {
    if (v.type === 'kpi-card') {
      htmlMid += \`
        <div class="kpi-card">
          <div class="icon">\${v.icon || '📈'}</div>
          <div class="label">\${v.title}</div>
          <div class="value">\${v.sampleValue}</div>
        </div>\`;
    } else {
      const width = v.width === '100%' ? 'chart-full' : (v.width === '50%' ? 'chart-half' : 'chart-quarter');
      htmlMid += \`
        <div class="chart-box \${width}">
          <h3>\${v.title}</h3>
          <div class="source">\${v.sourceKPI}</div>
          <div class="chart-wrapper" id="\${v.id}"></div>
        </div>\`;

      // Plotly injection
      chartScripts += \`
        Plotly.newPlot('\${v.id}', [{
          type: '\${v.type === 'doughnut' ? 'pie' : v.type}',
          hole: \${v.type === 'doughnut' ? 0.4 : 0},
          x: \${JSON.stringify(v.cfg?.cat || ['A','B','C'])},
          y: \${JSON.stringify(v.cfg?.val || [10, 20, 30])},
          name: '\${v.sourceKPI}'
        }], {
          margin: { t: 10, b: 20, l: 30, r: 10 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '\${text}' }
        }, {responsive: true});
      \`;
    }
  });

  chartScripts += '</script>';

  const htmlEnd = \`
      </div>
    </div>
  </div>
  \${chartScripts}
</body>
</html>\`;

  return htmlStart + htmlMid + htmlEnd;
}

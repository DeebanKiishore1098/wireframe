import * as cheerio from "cheerio";

function cleanLLMJson(rawJson: string): any {
  let cleaned = rawJson;
  // Remove markdown
  cleaned = cleaned.replace(/```json\\s*/g, '').replace(/```\\s*/g, '');
  cleaned = cleaned.trim();

  // Extract JSON - find outermost braces
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}') + 1;
  if (start === -1 || end === 0) throw new Error('No JSON in output');
  cleaned = cleaned.substring(start, end);

  // SAFE COMMENT REMOVAL
  cleaned = cleaned.replace(/(^|\\s)\\/\\/[^\\n\\r]*/gm, '$1');
  cleaned = cleaned.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');

  try {
    return JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(`Parse attempt failed: ${e.message}`);
  }
}

export function processAgent1Output(agent1RawJson: string, brdText: string): any {
  const data = cleanLLMJson(agent1RawJson);
  const clientInfo = data.client || {
    name: data.clientName || 'Unknown',
    website: data.clientWebsite || '',
    email: data.clientEmail || '',
    industry: data.industry || 'General'
  };

  const kpiList = data.kpiList || [];
  const metricList = data.metricList || [];

  return {
    clientName: clientInfo.name,
    clientWebsite: clientInfo.website,
    clientEmail: clientInfo.email,
    industry: clientInfo.industry,
    kpiList,
    metricList,
    stats: {
      kpiCount: kpiList.length,
      metricCount: metricList.length,
    }
  };
}

// Emulates 'Client Details Verification from Website' node logic
export async function generateWebsiteTheme(parsedKpiData: any) {
  let { clientWebsite, clientName, industry, kpiList } = parsedKpiData;

  const brandColors = {
    primary: null as string | null,
    secondary: null as string | null,
    allColors: [] as string[],
    extracted: false
  };

  if (clientWebsite) {
    if (!clientWebsite.startsWith("http")) {
      clientWebsite = "https://" + clientWebsite;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const req = await fetch(clientWebsite, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const htmlText = await req.text();
      const hexMatches = htmlText.match(/#([A-Fa-f0-9]{6})\\b/g) || [];
      const filtered = [...new Set(hexMatches)].filter((hex) => {
        const c = hex.toLowerCase();
        if (["#ffffff", "#000000", "#f5f5f5"].includes(c)) return false;
        return true;
      });

      brandColors.allColors = filtered.slice(0, 10);
      if (filtered.length >= 1) {
        brandColors.primary = filtered[0];
        brandColors.extracted = true;
      }
      if (filtered.length >= 2) {
        brandColors.secondary = filtered[1];
      }
    } catch (e) {
      console.log("Failed to fetch client website: " + clientWebsite);
    }
  }

  return {
    ...parsedKpiData,
    brandColors,
    websiteAnalysis: {
      colors: brandColors
    },
    // Random layouts mapping
    layoutType: ["horizontal-kpi", "vertical-kpi-left", "grid-kpi-2x2"][Math.floor(Math.random() * 3)],
    layoutSpacing: "comfortable",
    chartDensity: "medium",
    dashboardRules: {
      requiredPages: 4,
      kpiCount: kpiList.length
    }
  };
}

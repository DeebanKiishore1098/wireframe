import { NextResponse } from "next/server";
import { parseDocument } from "@/utils/documentParser";
import { runKpiAgent, runChartTypesAgent } from "@/utils/aiAgents";
import { processAgent1Output, generateWebsiteTheme, getDashboardStats } from "@/utils/dataTransformers";
import { generateHybridDashboardHTML } from "@/utils/dashboardGenerator";

export const maxDuration = 300; // Allows up to 5 minutes execution on Vercel Pro, otherwise 60s for standard Node servers.

export async function POST(req: Request) {
  try {
    console.log("=== INITIATING N8N REPLACEMENT WORKFLOW ===");
    const formData = await req.formData();
    const file = formData.get("BRD"); // N8N expected 'BRD'

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing BRD file" }, { status: 400 });
    }

    /* 1. Extract Text from PDF/DOCX Document */
    console.log("[Phase 1] Parsing Document...");
    const fileBytes = await file.arrayBuffer();
    const brdText = await parseDocument(Buffer.from(fileBytes), file.name);

    if (!brdText || brdText.trim().length === 0) {
      return NextResponse.json({ error: "Failed to extract text from document" }, { status: 500 });
    }

    /* 2. Agent 1: KPI Extraction */
    console.log("[Phase 2] Agent 1 -> Extracting KPIs (Azure OpenAI gpt-4o)...");
    const agent1RawJson = await runKpiAgent(brdText);

    /* 3. Streamline JSON & Fix Output */
    console.log("[Phase 3] Streamlining Agent 1 JSON Output...");
    const parsedKpiData = processAgent1Output(agent1RawJson, brdText);

    /* 4. Client Details & Website Theme from Web Scraping */
    console.log("[Phase 4] Verifying Client Details & Theme...");
    const themeData = await generateWebsiteTheme(parsedKpiData);

    /* 5. Agent 2: Determine Chart Types */
    console.log("[Phase 5] Agent 2 -> Determining Chart Types...");
    const agent2RawJson = await runChartTypesAgent(themeData);

    /* 6. Dashboard Generation */
    console.log("[Phase 6] Hybrid Dashboard Generator (Plotly)...");
    const htmlOutput = generateHybridDashboardHTML(agent2RawJson, themeData);

    /* 7. HTML Convertor Return (Matching N8N output structure) */
    console.log("=== WORKFLOW COMPLETE ===");
    return NextResponse.json({
      success: true,
      message: "Dashboard generated successfully",
      html: htmlOutput
    });

  } catch (error: any) {
    console.error("Workflow Error:", error);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}

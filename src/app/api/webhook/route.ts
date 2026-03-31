import { NextResponse } from "next/server";
import { parseDocument } from "@/utils/documentParser";
import {
  classifyKpiPresence,
  runKpiAgent,
  runDomainClassificationAgent,
  runKpiGeneratorAgent,
  runChartTypesAgent,
  runApplicationBriefAgent,
  runWireframeGeneratorAgent,
  runPptxGeneratorAgent,
  runDashboardPptxGeneratorAgent,
  extractStructuredDataFromDI,
} from "@/utils/aiAgents";

import { processAgent1Output, generateWebsiteTheme } from "@/utils/dataTransformers";
import { generateHybridDashboardHTML } from "@/utils/dashboardGenerator";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { validatePythonScript, PYTHON_EXEC_TIMEOUT_MS, resolvePythonExecutable } from "@/utils/pythonSandbox";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function safeUnlink(filePath: string, retries = 5) {
  if (!fs.existsSync(filePath)) return;
  for (let i = 0; i < retries; i++) {
    try {
      await fs.promises.unlink(filePath);
      return;
    } catch (err: any) {
      if (err.code === "EBUSY" || err.code === "EPERM") {
        console.warn(`[SafeUnlink] File busy, retrying in 200ms (${i + 1}/${retries}): ${filePath}`);
        await delay(200);
      } else {
        console.error(`[SafeUnlink] Failed to delete ${filePath}:`, err.message);
        break;
      }
    }
  }
}


export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    console.log("=== INITIATING GENERATOR WORKFLOW ===");
    const formData = await req.formData();
    const file = formData.get("BRD") as File;
    const generatorType = formData.get("generatorType") as string;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing BRD file" }, { status: 400 });
    }

    /* ── Phase 1: Parse Document ──────────────────────────────────── */
    console.log("[Phase 1] Parsing Document...");
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);
    const brdText = await parseDocument(fileBuffer, file.name);

    if (!brdText || brdText.trim().length === 0) {
      return NextResponse.json({ error: "Failed to extract text from document" }, { status: 500 });
    }

    // --- APPLICATION WIREFRAME (PDF) PATH ---
    if (generatorType === "application-wireframe") {
      console.log("[PDF Path] Initiating Enhanced Application Wireframe Workflow...");

      // 1. Extract Structured Data from Azure DI
      console.log("[PDF Path] Calling Azure Document Intelligence (Prebuilt-Layout)...");
      const diData = await extractStructuredDataFromDI(fileBuffer, file.name);

      // 2. Generate Brief (Structuring Engine v2.0)
      console.log("[PDF Path] Running Application Brief Agent (Structuring Engine)...");
      const brief = await runApplicationBriefAgent(diData);

      // 3. Generate Python Script (Design Engine)
      console.log("[PDF Path] Running Wireframe Generator Agent (Design Engine - ReportLab)...");
      const pythonCode = await runWireframeGeneratorAgent(brief);

      // 3. Execute Python Code
      const timestamp = Date.now();
      const pyFilename = `gen_wireframe_${timestamp}.py`;
      const pptxFilename = `output_wireframe_${timestamp}.pptx`;
      const scriptPath = path.join(process.cwd(), pyFilename);
      const outputPath = path.join(process.cwd(), pptxFilename);

      try {
        // ── Security: validate generated code before touching disk ──
        console.log(`[PDF Path] Validating generated Python script...`);
        const validation = validatePythonScript(pythonCode);
        if (!validation.safe) {
          console.error(`[PDF Path] SECURITY: Script failed validation. Violations: ${validation.violations.join(', ')}`);
          throw new Error(`Generated script failed security validation (${validation.violations.length} violation(s) detected). Regenerate or contact support.`);
        }
        console.log(`[PDF Path] Script passed security validation.`);

        const pyExec = await resolvePythonExecutable();

        console.log(`[PDF Path] Writing temporary Python script to ${scriptPath}...`);
        console.log(`[PDF Path] Code Preview: ${pythonCode.substring(0, 100)}...`);
        await writeFileAsync(scriptPath, pythonCode);

        console.log("[PDF Path] Ensuring python-pptx is installed...");
        try {
          await execAsync(`${pyExec} -m pip install python-pptx`);
        } catch (e: any) {
          console.warn("PIP install warning (might already exist):", e.stderr || e.message);
        }

        console.log(`[PDF Path] Executing Python script: ${pyExec} "${scriptPath}" --output "${outputPath}"`);
        try {
          const { stdout, stderr } = await execAsync(
            `${pyExec} "${scriptPath}" --output "${outputPath}"`,
            { timeout: PYTHON_EXEC_TIMEOUT_MS }
          );
          if (stdout) console.log("[Python Script STDOUT]:", stdout);
          if (stderr) console.warn("[Python Script STDERR]:", stderr);
        } catch (execErr: any) {
          console.error("[Python EXEC ERROR]:", execErr.stderr || execErr.message);
          throw new Error(`Python execution failed: ${execErr.stderr || execErr.message}`);
        }

        if (!fs.existsSync(outputPath)) {
          console.error(`[PDF Path] Output file missing at ${outputPath}`);
          // List files in CWD for debug
          const files = fs.readdirSync(process.cwd());
          console.log("[PDF Path] Files in CWD:", files.filter(f => f.startsWith("output") || f.endsWith(".pptx")));
          throw new Error("Python script finished but the PPTX was not created. This usually means a logic error in the generated script.");
        }

        // Read the file
        const pptxBuffer = await readFileAsync(outputPath);

        // Cleanup on SUCCESS
        await safeUnlink(scriptPath);
        await safeUnlink(outputPath);

        console.log("=== WIREFRAME PPTX WORKFLOW COMPLETE ===");
        return new Response(pptxBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Content-Disposition": `attachment; filename="wireframe_${timestamp}.pptx"`,
          },
        });

      } catch (err: any) {
        console.error("[PDF Path] CRITICAL FAILURE:", err.message);
        // Attempt cleanup but don't let it crash the error response
        try {
          if (fs.existsSync(outputPath)) await safeUnlink(outputPath);
        } catch (cleanupErr) {
          console.warn("[PDF Path] Cleanup failed during error handling:", cleanupErr);
        }
        return NextResponse.json({ error: `Wireframe Engine Error: ${err.message}` }, { status: 500 });
      }
    }

    // --- APPLICATION PPTX PATH ---
    if (generatorType === "application-pptx") {
      console.log("[PPTX Path] Initiating Enhanced PPTX Presentation Workflow...");

      // 1. Extract Structured Data
      const diData = await extractStructuredDataFromDI(fileBuffer, file.name);

      // 2. Generate Brief
      const brief = await runApplicationBriefAgent(diData);

      // 3. Generate Python Script (PPTX Design Engine)
      const pythonCode = await runPptxGeneratorAgent(brief);

      // 4. Execute Python
      const timestamp = Date.now();
      const pyFilename = `gen_pptx_${timestamp}.py`;
      const pptxFilename = `output_presentation_${timestamp}.pptx`;
      const scriptPath = path.join(process.cwd(), pyFilename);
      const outputPath = path.join(process.cwd(), pptxFilename);

      try {
        // ── Security: validate generated code before touching disk ──
        console.log(`[PPTX Path] Validating generated Python script...`);
        const validation = validatePythonScript(pythonCode);
        if (!validation.safe) {
          console.error(`[PPTX Path] SECURITY: Script failed validation. Violations: ${validation.violations.join(', ')}`);
          throw new Error(`Generated script failed security validation (${validation.violations.length} violation(s) detected). Regenerate or contact support.`);
        }
        console.log(`[PPTX Path] Script passed security validation.`);

        const pyExec = await resolvePythonExecutable();
        await writeFileAsync(scriptPath, pythonCode);

        console.log(`[PPTX Path] Executing: ${pyExec} "${scriptPath}" --output "${outputPath}"`);
        await execAsync(
          `${pyExec} "${scriptPath}" --output "${outputPath}"`,
          { timeout: PYTHON_EXEC_TIMEOUT_MS }
        );

        if (!fs.existsSync(outputPath)) {
          throw new Error("Python script finished but the PPTX was not created.");
        }

        const pptxBuffer = await readFileAsync(outputPath);

        // Cleanup
        await safeUnlink(scriptPath);
        await safeUnlink(outputPath);

        console.log("=== PPTX WORKFLOW COMPLETE ===");
        return new Response(pptxBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Content-Disposition": `attachment; filename="wireframe_${timestamp}.pptx"`,
          },
        });
      } catch (err: any) {
        console.error("[PPTX Path] CRITICAL FAILURE:", err.message);
        try {
          if (fs.existsSync(scriptPath)) await safeUnlink(scriptPath);
          if (fs.existsSync(outputPath)) await safeUnlink(outputPath);
        } catch (cleanupErr) {
          console.warn("[PPTX Path] Cleanup failed during error handling:", cleanupErr);
        }
        return NextResponse.json({ error: `PPTX Engine Error: ${err.message}` }, { status: 500 });
      }
    }

    // --- DASHBOARD PPTX PATH ---
    if (generatorType === "dashboard-pptx") {
      console.log("[Dashboard PPTX Path] Initiating Analytics PPTX Workflow...");
      
      // 1. Run Analytics Pipeline
      const kpiPresence = await classifyKpiPresence(fileBuffer, file.name, brdText);
      let parsedKpiData: any;
      if (kpiPresence.hasKPIs) {
        const agent1RawJson = await runKpiAgent(brdText);
        parsedKpiData = processAgent1Output(agent1RawJson, brdText);
      } else {
        const domainClassification = await runDomainClassificationAgent(brdText);
        const agent4RawJson = await runKpiGeneratorAgent({
          domain: domainClassification.domain,
          industry: domainClassification.industry,
          subIndustry: domainClassification.subIndustry,
          clientName: domainClassification.clientName,
          clientWebsite: domainClassification.clientWebsite,
        });
        parsedKpiData = processAgent1Output(agent4RawJson, brdText);
      }
      
      const themeData = await generateWebsiteTheme(parsedKpiData);
      const dashboardDesign = await runChartTypesAgent(themeData);
      
      const dashboardContext = {
        theme: themeData,
        design: typeof dashboardDesign === 'string' ? JSON.parse(dashboardDesign) : dashboardDesign
      };

      // 2. Generate Python Script (Dashboard PPTX Design Engine)
      const pythonCode = await runDashboardPptxGeneratorAgent(dashboardContext);

      // 3. Execute Python
      const timestamp = Date.now();
      const pyFilename = `gen_dash_pptx_${timestamp}.py`;
      const pptxFilename = `dashboard_presentation_${timestamp}.pptx`;
      const scriptPath = path.join(process.cwd(), pyFilename);
      const outputPath = path.join(process.cwd(), pptxFilename);

      try {
        // ── Security: validate generated code before touching disk ──
        console.log(`[Dashboard PPTX Path] Validating generated Python script...`);
        const validation = validatePythonScript(pythonCode);
        if (!validation.safe) {
          console.error(`[Dashboard PPTX Path] SECURITY: Script failed validation. Violations: ${validation.violations.join(', ')}`);
          throw new Error(`Generated script failed security validation (${validation.violations.length} violation(s) detected). Regenerate or contact support.`);
        }
        console.log(`[Dashboard PPTX Path] Script passed security validation.`);

        const pyExec = await resolvePythonExecutable();
        await writeFileAsync(scriptPath, pythonCode);

        console.log(`[Dashboard PPTX Path] Executing: ${pyExec} "${scriptPath}" --output "${outputPath}"`);
        await execAsync(
          `${pyExec} "${scriptPath}" --output "${outputPath}"`,
          { timeout: PYTHON_EXEC_TIMEOUT_MS }
        );

        if (!fs.existsSync(outputPath)) {
          throw new Error("Python script finished but the Dashboard PPTX was not created.");
        }

        const pptxBuffer = await readFileAsync(outputPath);
        await safeUnlink(scriptPath);
        await safeUnlink(outputPath);

        console.log("=== DASHBOARD PPTX WORKFLOW COMPLETE ===");
        return new Response(pptxBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Content-Disposition": `attachment; filename="dashboard_${timestamp}.pptx"`,
          },
        });
      } catch (err: any) {
        console.error("[Dashboard PPTX Path] FAILURE:", err.message);
        try {
          if (fs.existsSync(scriptPath)) await safeUnlink(scriptPath);
          if (fs.existsSync(outputPath)) await safeUnlink(outputPath);
        } catch (cleanupErr) {
          console.warn("[Dashboard PPTX Path] Cleanup failed during error handling:", cleanupErr);
        }
        return NextResponse.json({ error: `Dashboard PPTX Engine Error: ${err.message}` }, { status: 500 });
      }
    }


    // --- DASHBOARD WIREFRAME (HTML) PATH (Original Logic) ---
    console.log("[HTML Path] Continuing with Dashboard Workflow...");
    /* ── Phase 2: Document & KPI Presence Classifier ─────────────── */
    console.log("[Phase 2] Document & KPI Presence Classifier running...");
    const kpiPresence = await classifyKpiPresence(fileBuffer, file.name, brdText);

    let parsedKpiData: any;
    if (kpiPresence.hasKPIs) {
      const agent1RawJson = await runKpiAgent(brdText);
      parsedKpiData = processAgent1Output(agent1RawJson, brdText);
      parsedKpiData._generationType = "extracted";
    } else {
      const domainClassification = await runDomainClassificationAgent(brdText);
      const agent4RawJson = await runKpiGeneratorAgent({
        domain: domainClassification.domain,
        industry: domainClassification.industry,
        subIndustry: domainClassification.subIndustry,
        clientName: domainClassification.clientName,
        clientWebsite: domainClassification.clientWebsite,
      });
      parsedKpiData = processAgent1Output(agent4RawJson, brdText);
      parsedKpiData._generationType = "auto-generated";
    }

    const themeData = await generateWebsiteTheme(parsedKpiData);
    const agent2RawJson = await runChartTypesAgent(themeData);
    const htmlOutput = generateHybridDashboardHTML(agent2RawJson, themeData);

    console.log("=== HTML WORKFLOW COMPLETE ===");
    return NextResponse.json({
      success: true,
      message: "Dashboard generated successfully",
      html: htmlOutput,
    });

  } catch (error: any) {
    console.error("Workflow Error:", error);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}

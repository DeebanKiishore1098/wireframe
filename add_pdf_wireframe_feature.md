# Implementation Plan: PDF Application Wireframe Feature

Adding a new feature to produce high-fidelity application wireframes as PDFs using Python and ReportLab.

## 1. ANALYSIS & DESIGN
- New generator mode: **Application Wireframe**.
- Technology: **Python** + **ReportLab**.
- Output: **PDF binary**.
- Strategy: Use the provided system prompt (Methodology) as the core instruction.

## 2. BACKEND UPDATES
### `src/utils/aiAgents.ts`
- Implement `runApplicationWireframeAgent(brief: string)`.
- System prompt: "You are an expert UI/UX wireframe generator...".
- Return: Self-contained Python script.

### `src/app/api/webhook/route.ts`
- Check `formData.get("outputType")`.
- If `wireframe`:
  - Call `runApplicationWireframeAgent`.
  - Save as `tmp_wireframe.py`.
  - Execute `python tmp_wireframe.py`.
  - Return the resulting `wireframe_output.pdf`.

## 3. FRONTEND UPDATES
### `src/app/page.js`
- Select box for "Dashboard (HTML)" vs "Application Wireframe (PDF)".
- Pass selection to `POST /api/webhook`.
- Handle binary blob for PDF download.

## 4. VERIFICATION
- `pip install reportlab`.
- Run generation with a sample BRD.
- Verify PDF visual structure.

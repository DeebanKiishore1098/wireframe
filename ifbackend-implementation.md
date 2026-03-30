# IFBackend Implementation Plan

## Goal
Create a Next.js backend application in the `IFBackend` folder to replace the N8N workflow for dashboard generation.

## Tasks
- [ ] Task 1: Initialize Next.js app in `IFBackend` → Verify: `IFBackend/package.json` exists
- [ ] Task 2: Install backend dependencies (AI SDK, PDF parsing, Cheerio) → Verify: dependencies installed
- [ ] Task 3: Create webhook API route for file upload → Verify: `api/webhook/route.ts` created
- [ ] Task 4: Port KPI Extraction & Agent Logic to server utilities → Verify: utils correctly shape data
- [ ] Task 5: Port Layout & Plotly CSS grid injection to HTML return → Verify: HTML structure builds natively
- [ ] Task 6: Return final HTML from Next.js backend → Verify: HTTP 200 Returns generated file

## Done When
- [ ] The full N8N dashboard generation pipeline runs efficiently inside `IFBackend`.

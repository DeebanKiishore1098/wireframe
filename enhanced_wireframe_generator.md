# Task: Enhanced Wireframe Generator Integration

Upgrade the existing `application-wireframe` feature in IntelliFrame to a deterministic, high-fidelity PDF rendering engine using Azure Document Intelligence and ReportLab.

## 📋 Status & Progress
- [x] Phase 1: Azure DI Structured Extraction
- [x] Phase 2: Structuring Engine (`runApplicationBriefAgent` update)
- [x] Phase 3: Design Engine (`runWireframeGeneratorAgent` update)
- [x] Phase 4: Route Handling & Execution
- [x] Phase 5: Verification & Testing

## 🏗 Subtasks

### Subtask 1: Refactor Azure DI Utility in `src/utils/aiAgents.ts`
- [ ] Add `extractStructuredDataFromDI` to handle "prebuilt-layout" with OCR and tables.

### Subtask 2: Update Structuring Agent (`runApplicationBriefAgent`)
- [ ] Update prompt to output the strict JSON schema.
- [ ] Root: `portfolio`, Child: `applications[]`.

### Subtask 3: Update Design Engine Agent (`runWireframeGeneratorAgent`)
- [ ] Update prompt with "DESIGN ENGINE RULES" and "PAGE STRUCTURE".
- [ ] Incorporate TOC (Catalog Page) logic.
- [ ] Enforce Dark Mode (#0F172A) and Blue accents.

### Subtask 4: Update API Route (`src/app/api/webhook/route.ts`)
- [ ] Call the new DI extraction.
- [ ] Orchestrate the structured JSON flow.
- [ ] Ensure PDF download works as before.

## 🏁 Verification
- Test with sample portfolio document.
- Confirm multi-page structure: Hero -> Catalog -> Detail Pages.
- Confirm Dark Mode aesthetics.

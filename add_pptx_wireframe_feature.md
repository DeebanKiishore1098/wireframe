# Implementation Plan: PPTX Wireframe Generator

This plan outlines the steps to add PowerPoint (PPTX) generation as an output format for the Intelliframe platform, leveraging the existing Python-driven Design Engine architecture.

## 📋 Status & Progress
- [ ] Phase 1: Environment Preparation
- [ ] Phase 2: Design Engine Agent (PPTX)
- [ ] Phase 3: API Route Integration
- [ ] Phase 4: Frontend Selection UI
- [ ] Phase 5: Verification & Testing

---

## 🏗 Detailed Steps

### Phase 1: Environment Preparation
- [ ] Run `python -m pip install python-pptx` to ensure the library is available for the execution environment.

### Phase 2: Design Engine Agent (`runPptxGeneratorAgent`)
- [ ] Location: `src/utils/aiAgents.ts`
- [ ] Create a new function `runPptxGeneratorAgent` that takes the `applicationBriefJson`.
- [ ] Define "DESIGN ENGINE RULES (PPTX)":
    - Master Slide: Dark Background (#0F172A).
    - Corporate Branding: Blue/Indigo accents.
    - Native PPT Shapes: Use `prs.slides.add_slide()`, `slide.shapes.add_textbox()`, `slide.shapes.add_shape()`.
    - Templates: Hero Slide (Title + Key Stats), Catalog Slide (Grid of Cards), Detail Slides (1 per App).

### Phase 3: API Route Integration (`src/app/api/webhook/route.ts`)
- [ ] Logic:
    - Check for `generatorType === "application-pptx"`.
    - Reuse the `Structuring Engine` (Phase 2 of existing PDF flow).
    - Call `runPptxGeneratorAgent` instead of `runWireframeGeneratorAgent`.
    - Handle `.pptx` file extension and `application/vnd.openxmlformats-officedocument.presentationml.presentation` MIME type.
    - Clean up temporary `.py` and `.pptx` files.

### Phase 4: Frontend Selection UI (`src/app/dashboard/page.js`)
- [ ] Add a selection dropdown or toggle for "Output Format" (HTML, PDF, PPTX).
- [ ] Send the selected format as `generatorType` in the multipart form data.

### Phase 5: Verification & Testing
- [ ] Test with a sample portfolio document.
- [ ] Verify slides are generated correctly and editable in PowerPoint.
- [ ] Confirm aesthetics match the dark mode vision.

---

## 🏁 Success Criteria
- [x] PPTX file downloaded successfully.
- [x] Slides contain correct data from the document.
- [x] Design is professional, high-fidelity, and editable.

# Abysentry PDF Editor — Engineering Handover

## Current status

The EditMyPDF text-editing implementation has been integrated into Abysentry's source tree as a dedicated module under `src/integrations/editmypdf/`. The Abysentry application shell, branding, existing Fabric-based annotation layer, Zustand store, and existing PDF export path have been retained.

**Important verification status:** source integration and Vite module transformation were inspected, but a clean production build and browser-level PDF editing/export tests could not be completed in this environment. The environment had no network access for installing Abysentry's existing dependencies, and the extracted reference project's `node_modules` did not contain Abysentry's existing `zustand`, `fabric`, and `react-dropzone` packages. Do not treat this archive as fully QA-approved until the checklist in `TESTING.md` is completed.

## Source projects

- Main project: Abysentry PDF Editor (React + Vite, JavaScript, Fabric.js, PDF.js, pdf-lib, Zustand).
- Reference: EditMyPDF, an MIT-licensed React/TypeScript PDF editor.
- The reference copyright and MIT licence are retained at `src/integrations/editmypdf/LICENSE`.

## Original editing defect being addressed

The old `PDFPage.jsx` workflow covered selected PDF text with a white Fabric rectangle and placed a Fabric `Textbox` above it. The whiteout rectangle had a small placement offset and did not always cover the selected text exactly. The reported editing defects included Backspace deleting the entire object, cursor placement not behaving like normal text editing, and a persistent `Type here` placeholder on blank-page insertion. The new existing-text path bypasses that mask-and-replacement workflow and uses the reference content model and `SpanEditor`.

## What was integrated

The reference implementation is not a simple editable overlay. Its relevant architecture includes:

1. `content.ts`: reads PDF.js text and graphics/operator information and builds page-level content elements with text runs, font metadata, geometry, and line layout.
2. `PageStage.tsx`: renders the PDF page and positions selectable/editable content patches.
3. `SpanEditor.tsx`: manages a `contentEditable` editing surface, styled spans, caret/selection offsets, and text edits.
4. `contentEdit.ts`, `textLayout.ts`, `textFormat.ts`, and `spanDom.ts`: edit styled runs, preserve layout metadata, and map browser selections to text offsets.
5. `contentStream.ts`: removes/replaces the original text-showing strings in PDF page content streams while preserving text advances where possible.
6. `exportPdf.ts`: writes text patches back into the PDF, including font embedding/substitution support.

These files are kept in a dedicated integration folder rather than replacing Abysentry's application source structure.

## Abysentry integration points

### `src/integrations/editmypdf/`

Contains the reference engine modules, the adapted `ReferenceTextPage.tsx` bridge, its small UI dependencies, the page-overlay styles, and the upstream MIT licence.

### `src/components/pdf/PDFPage.jsx`

Mounts `ReferenceTextPage` over every page. In the `Text` tool, the reference stage receives pointer events and the Fabric layer temporarily yields pointer input. In other tools, the reference stage remains visible but does not intercept pointer input, so text patches remain visible while the existing Fabric annotation tools remain usable.

### `src/components/layout/Workspace.jsx`

Passes per-page reference annotations and their update callbacks into `PDFPage`.

### `src/store/editorStore.js`

Stores reference-engine annotations separately from the existing Fabric `pageEdits` and maintains per-page reference edit history. New PDF loads reset both data sets.

### `src/App.jsx`

The export pipeline first calls the reference `exportAnnotatedPdf` when text patches exist, then passes the resulting PDF bytes through Abysentry's existing `exportEditedPdf` for Fabric annotations. The reference engine's coordinate mapper converts page viewport coordinates to PDF coordinates.

### `vite.config.js` and `package.json`

A Vite `@` source alias and the reference engine's runtime dependencies have been added. The PDF.js resource plugin also copies the reference engine's required CMaps, standard fonts, ICC profiles, and WASM decoders into the build. The lockfile was updated with dependency metadata available from the reference package installation.

## Expected user workflow

1. Open a PDF in Abysentry.
2. Choose the `Text` tool.
3. Click an existing text element on the page.
4. Edit the text in the reference engine's inline editor. The editor preserves styled runs and supports cursor placement, selection, insertion, and deletion.
5. Use the reference editor's contextual formatting controls where available.
6. To add new text on blank page space, double-click the blank area; this still creates a normal Abysentry Fabric text annotation. Existing PDF text edits use the reference content-aware engine.
7. Switch to other Abysentry tools as needed; text patches should remain visible while the Fabric annotation layer receives pointer input.
8. Export. The reference engine rewrites the affected text content and Abysentry then applies the existing overlay annotations.

## Important technical boundaries

- PDF text editing is not guaranteed for every PDF. Some documents use unusual encodings, Type 3 fonts, form XObjects, unsupported content streams, or text converted to vector outlines.
- Scanned/image-only PDFs require OCR before their image text can be edited. OCR is not added by this integration.
- Some PDF content streams cannot be safely rewritten. The reference engine tracks uncertain stripping cases; inspect the exported document carefully.
- The integration retains Abysentry's existing `pdfjs-dist` version. The reference project used a slightly different PDF.js version; compatibility must be tested with representative files.
- Existing Fabric annotations remain in the original Abysentry state model. Reference text patches are stored separately in `referenceAnnotations`.
- Reference engine source files use TypeScript/TSX and explicit `.ts` import extensions. Vite transforms them; the Abysentry project does not currently run a separate TypeScript type-check step.

## First steps for the next coding agent

1. Run `npm install` from the project root.
2. Run `npm run build` and fix any dependency, import, or Vite issues.
3. Run `npm run dev` and load a text-based PDF.
4. Test clicking and editing existing text, including a mixed-style paragraph.
5. Switch between Text and non-text tools and verify patches remain visible.
6. Export the edited PDF and reopen it in a separate PDF viewer.
7. Verify Fabric annotations still export on top of text patches.
8. Complete `TESTING.md`; record actual results rather than marking unrun tests as passed.
9. If the integration needs changes, preserve Abysentry's shell and keep reference code isolated under `src/integrations/editmypdf/`.

## Do not

- Replace Abysentry's App, Workspace, toolbar, or branding with the reference application's UI.
- Reintroduce Fabric text masks as the primary implementation for editing existing PDF text.
- Remove the reference MIT copyright/licence notice.
- Claim scanned-PDF text editing without OCR.
- Claim that a PDF export is correct until the exported file has been reopened and inspected.

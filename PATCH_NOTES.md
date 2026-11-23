# Patch Notes

## Text-editing engine integration

- Added the EditMyPDF content-aware text editing engine under `src/integrations/editmypdf/`.
- Added the reference `PageStage` and `SpanEditor` editing surfaces, content extraction/layout helpers, content-stream text stripping, font helpers, and PDF export implementation.
- Added `ReferenceTextPage.tsx` as an adapter between the reference engine and Abysentry's PDF.js page lifecycle.
- Connected per-page text patches to Abysentry's Zustand editor store.
- Added per-page text-patch history and connected it to the existing Undo/Redo actions.
- Updated PDF export to apply reference text patches first and then apply Abysentry's existing Fabric annotation export.
- Kept the Abysentry application shell, branding, workspace, toolbar, and existing Fabric annotation path.
- Added the required reference runtime dependencies, Vite source alias, and same-origin PDF.js resource plugin for CMaps, standard fonts, ICC profiles, and WASM decoders.
- Retained the reference project's MIT licence in `src/integrations/editmypdf/LICENSE`.

## Verification status

The integration has not yet received browser-level QA. A clean build could not be completed in the isolated environment because the environment lacked several existing Abysentry packages and npm registry access was unavailable. See `TESTING.md` and `HANDOVER.md` before treating the integration as production-ready.

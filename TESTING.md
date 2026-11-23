# Testing Record — Abysentry PDF Editor Text Engine Integration

## Environment test record

| Check | Result | Notes |
|---|---|---|
| Archive extraction | Passed | Both supplied ZIP archives were extracted for inspection. |
| Reference licence inspection | Passed | The reference project contains an MIT licence; notice retained in the integration folder. |
| Reference engine source inspection | Passed | Reviewed `PageStage`, `SpanEditor`, `content`, `contentEdit`, `contentStream`, and export modules. |
| Vite source transformation | Passed | Vite transformed 2,903 modules, including the integrated TypeScript/TSX engine. |
| Bundler integration check | Passed with test-only externals | A Vite production bundle was generated after temporarily externalizing `zustand`, `fabric`, and `react-dropzone`, which were absent from the extracted reference `node_modules`. This verifies the remaining import graph but is not a clean application build. |
| Clean production build | Not verified | The available extracted `node_modules` did not include Abysentry's existing `zustand`, `fabric`, and `react-dropzone` packages. Installing from npm failed because the environment could not resolve `registry.npmjs.org` (EAI_AGAIN). |
| Browser-level text editing | Not run | Requires a clean dependency installation and a browser session. |
| PDF export/reopen test | Not run | Requires browser-level verification with representative PDFs. |
| Undo/redo interaction | Not run | Must be tested after dependencies are installed. |
| Existing annotation regression test | Not run | Must be tested after dependencies are installed. |

## Required local verification

Run from the project directory:

```bash
npm install
npm run build
npm run dev
```

Then test:

- [ ] A PDF with ordinary selectable text.
- [ ] Editing one word with cursor placement in the middle.
- [ ] Backspace and Delete on individual characters.
- [ ] Selecting and replacing a word.
- [ ] Editing a paragraph with multiple lines.
- [ ] A paragraph containing bold and italic runs.
- [ ] A PDF with embedded fonts.
- [ ] A PDF with a Type 3 font, if available.
- [ ] A PDF containing images and text.
- [ ] Switching to Shapes, Whiteout, Images, or Sign and confirming text patches remain visible.
- [ ] Existing Fabric annotation creation and manipulation.
- [ ] Undo and redo for text edits.
- [ ] Exporting a text edit and reopening the result in a separate PDF viewer.
- [ ] Exporting a text edit together with a Fabric annotation.
- [ ] Confirming unrelated page content remains intact.

Record browser, operating system, PDF sample characteristics, and actual outcome for every test. Do not mark a test as passed based only on a successful application launch.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Existing PDF text editing

The `Text` tool uses the integrated EditMyPDF content-aware text engine. Click an existing text block to edit it inline. The engine reads text runs and font/layout metadata from PDF.js and writes supported text changes back into the PDF content stream during export. Abysentry's existing Fabric-based annotation tools remain available in the other toolbar modes.

See:

- `HANDOVER.md` for architecture and integration details.
- `TESTING.md` for the verification checklist and current test status.
- `PATCH_NOTES.md` for the change summary.
- `THIRD_PARTY_NOTICES.md` for third-party licensing.

After installing dependencies, run `npm run build` and complete the browser/PDF export tests before using this integration in production.

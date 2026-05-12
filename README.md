# JobTrail

A Chrome extension that auto-detects job applications from Gmail and tracks them on a 6-stage Kanban dashboard. Free forever. MIT licensed. BYO Gemini API key — no developer-controlled servers.

> **Status:** Pre-build, week 1. Scaffolding only. Functionality lands across weeks 1–8 (see `JobTrail-Build-Spec.md` section 14).

## Scripts

- `npm run build` — produce a production bundle in `dist/`
- `npm run dev` — Vite dev server with hot reload
- `npm test` — run the Vitest suite (no tests yet)

## Loading the extension in Chrome

1. Run `npm run build` to produce `dist/`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` folder

The extension will appear in your toolbar. Click the icon to open the popup.

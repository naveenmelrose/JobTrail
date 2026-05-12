# JobTrail

A Chrome extension that reads job-application emails from Gmail (read-only) and tracks each application on a 6-stage Kanban dashboard. Runs entirely in the browser — no servers, no third-party data sharing. Users bring their own Google Gemini API key for the AI classification step.

## Status

Pre-alpha, week 1 of 8, OAuth flow only. The scaffold is in place and Gmail sign-in works end-to-end; email fetch, classification, and the dashboard arrive in weeks 2–8. See `JobTrail-Build-Spec.md` section 14 for the full schedule.

## Local development

### Prerequisites
- Node.js 20 or newer
- Google Chrome
- An OAuth 2.0 Client ID of type "Chrome Extension" from Google Cloud Console, populated into `manifest.json` under `oauth2.client_id` (see build spec section 5)

### Install
```bash
git clone https://github.com/naveenmelrose/JobTrail.git
cd JobTrail
npm install
```

### Scripts
- `npm run build` — production bundle into `dist/`
- `npm run dev` — Vite dev server (uncommon for extension dev; the usual loop is rebuild then reload in Chrome)
- `npm test` — Vitest (no tests yet)

### Load in Chrome
1. `npm run build`
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder
4. Click the JobTrail toolbar icon to open the popup

## Project structure

- `src/popup/` — extension popup (sign-in UI)
- `src/dashboard/` — full-page Kanban dashboard (placeholder)
- `src/onboarding/` — onboarding flow (placeholder)
- `src/background/` — Manifest V3 service worker
- `src/lib/` — pure JS modules: Gmail client, classifier, state machine, storage wrapper (empty in week 1)
- `src/styles/` — design tokens (Tailwind v4 `@theme`)
- `public/` — static assets and icons
- `manifest.json` — Chrome Manifest V3 declaration
- `vite.config.js` — Vite + `vite-plugin-web-extension` build config

## License

MIT. See `LICENSE`.

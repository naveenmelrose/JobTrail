# JobTrail — Week 1 Kickoff Brief for Claude Code

> Hand this to Claude Code at the start of week 1. Companion documents (read in order):
> 1. `JobTrail-Project-Context.md` — what and why
> 2. `JobTrail-Build-Spec.md` — full technical spec
> 3. This doc — week 1 task sequence
> Last updated: May 12, 2026

---

## Read these first

Before writing any code, read in this order:
1. `JobTrail-Project-Context.md` — full context, locked decisions
2. `JobTrail-Build-Spec.md` sections 1–5, 14 (week 1 row), 15, Appendix A
3. `MEMORY.md` — append-only decision log

Do not skip any of these. Locked decisions in the context doc must not be contradicted without flagging.

---

## Week 1 goal

**A working Chrome extension skeleton that runs the Gmail OAuth flow end-to-end and displays the signed-in user's email address.**

That's the only deliverable. No Gmail fetch yet (week 2). No classification (week 3). No dashboard UI (week 5). Resist scope creep.

### What "working" means at end of week 1
- Extension loads in Chrome via "Load unpacked"
- Clicking the extension icon opens a popup
- Popup has a "Sign in with Google" button
- Clicking the button triggers the standard Google OAuth consent screen
- After consent, the popup shows the user's Gmail address
- OAuth token is stored in `chrome.storage.local`
- Re-opening the popup shows the same email without re-prompting (token persists)

---

## Pre-work decisions to make in the first session

These are open questions from spec Appendix A. Resolve before writing code:

### Decision 1 — Build tool
**Recommendation:** Vite
**Why:** Modern, fast, good MV3 support, well-documented for multi-entry extensions. Webpack works but is heavier. Parcel less common for extensions.
**Action:** Confirm Vite or push back with reasoning.

### Decision 2 — Testing framework
**Recommendation:** Vitest, but skip writing tests in week 1.
**Why:** Pairs natively with Vite. Setting it up now costs little; using it in week 1 is premature. Add the first real test in week 3 when classifier logic exists.
**Action:** Confirm Vitest setup, no tests this week.

### Decision 3 — State management
**Recommendation:** React hooks only (`useState`, `useReducer`, `useContext`).
**Why:** State is small. Zustand or Redux is overkill.
**Action:** Confirm hooks only.

### Decision 4 — UUID generation
**Recommendation:** `crypto.randomUUID()` (built into modern browsers).
**Why:** No dependency.
**Action:** Confirm.

### Decision 5 — Date handling
**Recommendation:** Built-in `Intl.DateTimeFormat` + `Date` for week 1. Revisit if date math gets gnarly in week 6 (state machine, ghosted detection).
**Action:** Confirm.

**Default rule:** When in doubt, prefer built-in over a dependency.

---

## Task sequence

Work through these in order. Each task has a clear "done when" checkpoint. Do not move to the next task until the current one is verified.

---

### Task 1 — Project scaffold

**Do:**
- Create the folder structure from spec section 3
- `npm init` and install: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`
- Set up `vite.config.js` with multi-entry build for the three surfaces: `popup`, `dashboard`, `onboarding`
- Configure Tailwind: `tailwind.config.js` + `postcss.config.js` + base `index.css`
- Create placeholder HTML files for each surface (just `<h1>JobTrail Popup</h1>` etc.)
- Create empty `src/background/service-worker.js`
- Add `.gitignore` (node_modules, dist, .env, local API key file)
- Add `LICENSE` (MIT) and minimal `README.md` stub

**Done when:**
- `npm run build` succeeds and produces a `dist/` folder with three HTML files plus the service worker
- Folder structure matches spec section 3

**Watch out for:**
- Vite + multi-entry Chrome extensions has known gotchas (asset paths, MV3 service worker bundling). Use `vite-plugin-web-extension` or hand-roll the multi-entry config. **Surface this choice to me before deciding.**

---

### Task 2 — Manifest V3 + load unpacked

**Do:**
- Generate `manifest.json` per spec section 4
- Build the project so `dist/` has the manifest + bundled files
- Load the unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked → select `dist/`)
- **Capture the extension ID Chrome generates** — this is needed for OAuth setup next

**Done when:**
- Extension appears in Chrome's extension list with the JobTrail name and icon (placeholder icon is fine)
- Clicking the extension icon opens the popup placeholder
- Extension ID is captured and shared with me — I'll use it to create the OAuth Client ID

**Watch out for:**
- Do **not** add the `oauth2` block to `manifest.json` yet. Chrome rejects manifests with an empty `oauth2.client_id` (verified May 12, 2026). The whole block gets added in Task 3 once Google Cloud Console has issued the real Client ID. See `JobTrail-Build-Spec.md` section 4 for the shape.

---

### Task 3 — OAuth Client ID setup (manual, by me)

**This is my task, not Claude Code's.** Once task 2 is done and I have the extension ID:

1. Go to Google Cloud Console → project `jobtrail-496006`
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Type: Chrome Extension
4. Application ID: paste extension ID from task 2
5. Copy the generated Client ID
6. Paste into `manifest.json` `oauth2.client_id`
7. Confirm with Claude Code so it can move to task 4

**Done when:**
- `manifest.json` has a real Client ID string
- Extension still loads cleanly after the change

---

### Task 4 — OAuth flow with chrome.identity

**Do:**
- Build a minimal React popup (`src/popup/popup.jsx`) with one button: "Sign in with Google"
- On button click, call `chrome.identity.getAuthToken({ interactive: true })`
- On success, store the token in `chrome.storage.local` under key `jobtrail.token`
- On failure, log the error clearly and surface a user-facing message
- After token retrieval, fetch user info from `https://www.googleapis.com/oauth2/v2/userinfo` (the `userinfo.email` scope makes this available)
- Display the email address in the popup

**Done when:**
- Click button → Google consent screen → consent → popup shows my email address
- Token is in `chrome.storage.local` (verify in DevTools)
- Closing and re-opening the popup shows the email without re-prompting (token cached)

**Watch out for:**
- The first OAuth attempt often fails with a clear error pointing to a Cloud Console config gap. That's expected — read the error and fix the config rather than the code.
- `gmail.readonly` is a *restricted* scope. In testing mode, only added test users can grant it. Confirm my email (`[me]@gmail.com`) is on the test user list in the OAuth consent screen config.

---

### Task 5 — Token persistence + sign-out

**Do:**
- On popup load, check `chrome.storage.local` for an existing token
- If present, skip the sign-in button and show the email directly
- Add a "Sign out" link that clears the token via `chrome.identity.removeCachedAuthToken` + `chrome.storage.local.remove`
- After sign-out, popup returns to the "Sign in with Google" state

**Done when:**
- Sign in → close popup → reopen → email shown, no prompt
- Click "Sign out" → close popup → reopen → "Sign in" button shown
- Both flows work reliably across at least 5 cycles

---

### Task 6 — README + initial commit hygiene

**Do:**
- Write a minimal README covering: what JobTrail is (1 paragraph), how to load unpacked for dev, scripts (`npm run dev`, `npm run build`)
- Commit progress to git in logical chunks (scaffold, manifest, OAuth flow, persistence)
- Do not commit the OAuth Client ID if it ends up anywhere unusual — manifest.json is fine since the Client ID alone isn't a secret, but flag anything that looks credential-shaped

**Done when:**
- README is readable by someone who's never seen the project
- Git log shows clean, atomic commits (not one giant "week 1 done" blob)

---

## What's NOT in week 1 (push back if it creeps in)

- Gmail API calls beyond `userinfo` (that's week 2)
- Any UI beyond the popup (no dashboard, no onboarding screens)
- API key entry for Gemini (week 4)
- Classification logic (weeks 3–4)
- Tailwind styling beyond minimal — popup can be ugly
- Tests
- Submitting OAuth verification to Google (defer to week 8 or later — testing mode is fine for now)

---

## Open issues to surface back to me

Stop and ask before assuming on any of these:

1. **Vite multi-entry approach** — `vite-plugin-web-extension` vs hand-rolled config. Choose with reasoning.
2. **Icon assets** — placeholders are fine for week 1 but flag when real icons are needed (likely week 8).
3. **Anything in spec marked [VERIFY]** that comes up — section 4 has two of them (OAuth scope strings, calendar scope omission).

---

## End-of-week checklist

Before declaring week 1 done:

- [ ] Extension loads via "Load unpacked"
- [ ] Popup opens on icon click
- [ ] Sign-in flow works end-to-end
- [ ] Email displays after sign-in
- [ ] Token persists across popup opens
- [ ] Sign-out works and resets state
- [ ] Folder structure matches spec section 3
- [ ] Git history is clean
- [ ] README is minimally readable
- [ ] Any decisions made on open issues are logged to `MEMORY.md` with date, choice, reasoning, alternatives rejected

---

*End of week 1 kickoff brief.*

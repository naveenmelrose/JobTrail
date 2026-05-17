# MEMORY.md — JobTrail Decision Log

> Append-only log of significant decisions, in chronological order.
> Read this at the start of every session before doing anything.
> Never contradict a logged decision without flagging it first.

---

## May 11, 2026 — Move from planning to build, Path 1 selected

**What was decided:** Move forward with the build phase, starting with a written technical spec (Path 1), even though feedback from HR friends / brother / wife on the mockup is still pending.

**Why:** The technical spec is independent of UI/UX feedback. If feedback returns with significant changes, only the UI sections (5, 10) need revising. Other locked decisions (architecture, OAuth, BYO key, state machine) are stable.

**What was rejected:**
- Path 2 (skip spec, start coding immediately) — would force Claude Code to invent decisions on the fly, especially Gemini prompt and state machine
- Waiting for feedback — feedback only affects ~20% of the spec; bad use of idle time

**Risk accepted:** If reviewers come back with major changes (new stages, different modal contents), some weeks 5–7 work may need redoing. Low probability, low impact.

---

## May 11, 2026 — Spec format: single markdown file, medium depth

**What was decided:** Build spec written as one `JobTrail-Build-Spec.md` file, medium depth (decisions + examples + sample prompt + state transition table).

**Why:** Single file is easier to keep coherent, easier to hand to Claude Code, and easier to update. Medium depth covers the riskiest parts (Gemini prompt, state machine) without spending a week on documentation.

**What was rejected:**
- Multiple files split by area (oauth.md, gemini.md, etc.) — overhead of cross-referencing not worth it at this stage
- Weekly task files (week-1.md through week-8.md) — premature splitting; one file gives Claude Code full context when it needs to look back
- Light depth — would leave too much to Claude Code's judgment on classification logic
- Heavy depth — overkill for v1

---

## May 11, 2026 — Defer OAuth Client ID to week 1

**What was decided:** Don't create the Chrome Extension OAuth Client ID now. Create it in week 1 once Claude Code has built the extension scaffold and Chrome has generated a real extension ID.

**Why:** Creating the OAuth client now would require a placeholder extension ID that needs to be replaced later. Cleaner to do it once with the real ID.

**What was rejected:** Creating with placeholder ID now (Path A) — adds a fake-ID-floating-around problem; defers no real work.

---

## May 11, 2026 — Defer Tier 1 billing for Gemini until week 4

**What was decided:** Stay on Gemini free tier through development. Revisit Tier 1 (billing-linked) decision in week 4 when actual LLM integration happens.

**Why:** 
- Free tier (5 RPM / 20 RPD on Gemini 2.5 Flash) is sufficient for dev testing on own inbox
- Decision benefits from real usage data — at week 4 we'll know whether typical scans actually exceed 20 RPD after ATS whitelist filtering
- No need to expose credit card during weeks 1–7 when no real LLM calls will happen
- Tier 1 upgrade is instant if needed later

**What was rejected:**
- Add billing now with safeguards (budget alerts, quota caps) — protections work but card sits unused for 6+ weeks
- Use virtual disposable card — over-engineering for what's likely a $1/year exposure

**Note on context doc accuracy:** Context doc section 3 says "BYO API key — user brings their own Google Gemini key (free tier)." This is technically still true for development but production users will likely need Tier 1 (free tier 20 RPD is too tight for typical inbox scans). Soften this language when context doc is next updated.

---

## May 11, 2026 — Tier 1 will be the recommended user path for production

**What was decided:** For production end-users, recommended onboarding path is Tier 1 (link billing account, ~$1/year typical cost). Free tier remains as fallback for light users.

**Why:**
- Verified May 11, 2026: free tier is 5 RPM / 20 RPD on Gemini 2.5 Flash, per project
- A 500-email initial scan with ~30–50 LLM calls would exceed 20 RPD on day 1
- Tier 1 has ~10,000 RPD, plenty of headroom
- Tier 1 cost for typical JobTrail use: well under $1/year per user
- Tier 1 has $250/month cap (Google's ceiling), preventing runaway charges
- Tier 1 upgrade is instant, no minimum spend required
- BYO-key architecture means each user's billing is their own concern, not the developer's

**What was rejected:**
- Force free tier with aggressive pre-filtering — risks accuracy loss; complex engineering for $1/year savings
- Switch to a different LLM provider (Groq, OpenRouter) — would require new prompt testing and lose Gemini's reliability advantages
- Recommend Tier 1 mandatorily — free tier still works for light users who don't want to link billing

---

## May 11, 2026 — Batch API noted as fallback option

**What was decided:** Note Gemini Batch API as a potential fallback if interactive rate limits become problematic at week 4. Don't design for it now.

**Why:**
- Batch API has its own quota separate from interactive RPM/RPD (3M batch tokens on Tier 1 Gemini 2.5 Flash)
- Initial scan doesn't need real-time response — async batch fits well
- But batch adds complexity (async job management, polling, error handling)
- Premature optimization to design for it now

**What was rejected:** Designing the initial scan around batch from day 1 — over-engineering before knowing if interactive fails.

---

## May 11, 2026 — Google Cloud setup completed

**What was decided:** Complete all Google Cloud paperwork that doesn't depend on extension code being built.

**State:**
- Project created: `JobTrail` (ID: `jobtrail-496006`)
- Gmail API enabled
- OAuth consent screen configured (External, testing mode, self as test user)
- Scopes added: `gmail.readonly` (restricted), `userinfo.email` (non-sensitive)
- Gemini API key created (`jobtrail-test-api-key`), stored locally outside repo
- GitHub repo created via GitHub Desktop, main branch, initial commit pushed

**Deferred to later:**
- OAuth Client ID (week 1)
- Tier 1 billing (week 4)
- OAuth verification submission (week 8 or beyond)

---

## May 11, 2026 — Defer context doc update on "free tier" language until week 4

**What was decided:** Do not update the context doc to soften "free tier" language right now. Revisit in week 4 after real testing reveals actual LLM call volume on typical job-seeker inboxes.

**Why:**
- Target users are job seekers, often unemployed — credit-card-linking friction at the wrong moment for them
- The 30–50 LLM calls per scan estimate was pessimistic, based on a power-user with 500 emails
- Realistic typical user: 10–15 applications/month, ATS whitelist catches 80%+, actual LLM calls maybe 5–10 per scan — likely under 20 RPD
- We don't know yet whether free tier is actually a problem for the real target user
- Context doc is for internal use (Claude + me); user-facing copy is in the app and can change independently
- Updating now would create unnecessary friction before we know if it's needed

**What was rejected:**
- Option A: Update context doc to explicitly mention Tier 1 — would frame the project as "needs payment" before we know that's true
- Option C: Softer compromise wording — still introduces billing concept prematurely

**Risk accepted:** If reviewers ask "is this really free?" while looking at the mockup, the honest answer is: "AI part is free for typical use. Heavy users may eventually need to pay Google ~$1/year. I'm testing to find the line."

**Revisit trigger:** Week 4 testing. If real LLM call volume on a typical inbox stays under 20/day, no update needed — keep "free tier" framing. If it exceeds, update context doc with honest framing of when Tier 1 becomes necessary.

---

## May 11, 2026 — Gmail Primary tab only on all scans

**What was decided:** Initial and re-scans query Gmail with `category:primary` filter. Skip Promotions, Social, Updates, and Forums tabs entirely.

**Why:**
- Job-related emails (ATS confirmations, recruiter replies, interview invites) almost always land in Primary
- LinkedIn job alerts, Indeed digests, marketing emails land in Updates/Promotions — already on the "don't classify as Applied" list
- Cuts LLM call volume meaningfully without sacrificing recall on legitimate emails
- Users with tabs disabled: everything is Primary, filter is harmless
- Disclosed to user in onboarding + settings (transparency principle)

**What was rejected:**
- Option 2: Primary + Updates — safer but adds back noise from job digests we already skip
- Option 3: No tab filter, rely on whitelist + LLM — wastes LLM quota on emails we'd reject anyway

**Risk accepted:** A legit ATS confirmation occasionally misrouted by Gmail to Updates would be missed. Rare. Acceptable in v1.

---

## May 11, 2026 — Re-scan trigger model: on-open only

**What was decided:** Extension scans Gmail for new emails only when user opens the dashboard. No background polling, no scheduled scans, no real-time push.

**Why:**
- Matches "no backend" locked architecture
- Matches "simplicity wherever possible" principle
- API calls happen only when user is actively looking — predictable quota usage
- Job hunting isn't real-time; users check applications a few times a day at most
- 5–15 second delay on open is acceptable and expected
- User confirmed the delay is reasonable

**What was rejected:**
- Manual-only refresh — feels dated, dashboard goes stale
- Background polling via Chrome alarms — uses LLM quota when user isn't looking, more battery/network use, more complex
- Gmail Pub/Sub push notifications — would require a backend, breaks locked architecture
- Hybrid (on-open + light background check) — adds complexity for marginal gain; revisit in v2 if users ask

**Note:** Phase 1B calendar sync (Interview Scheduled → Awaiting Outcome auto-transition) is time-based, not email-based — separate question, handle when 1B work starts.

---

## May 11, 2026 — Monetization: free forever + optional Buy Me a Coffee

**What was decided:** JobTrail is free forever. No paywall, no premium tier, no usage limits behind payment. A small "Buy Me a Coffee" link at the bottom of the settings drawer for users who want to support voluntarily. Platform: Buy Me a Coffee (matches warm/direct brand tone).

**Why:**
- Aligns with locked principle "learning over revenue"
- Aligns with locked principle "no marketing pressure"
- MIT license + paywall is messy (forks could remove paywall legally)
- Adding payments = real product business (Stripe, support, refunds, tax complexity) — conflicts with learning project framing
- Zero infrastructure: BMaC + Stripe handle everything
- Doesn't compromise privacy story
- Honest signal — people who genuinely value the tool can say thanks; everyone else never sees it

**Placement rules:**
- Settings drawer only, at the bottom
- No mention during onboarding
- No banner on dashboard
- No nag screens or "consider supporting" popups
- Single line copy: "JobTrail is free and open source. If it saved you time, you can buy me a coffee." ☕

**What was rejected:**
- $5 one-time pay-to-continue after threshold — high churn risk at exact moment user has done the hard work; bait-and-switch feel; MIT license conflict; payment infra overhead before knowing if anyone retains
- Freemium with paid tier — biggest betrayal of "simple, private, yours" story
- Pay upfront — kills 95% of installs before value is shown
- No support option at all — leaves no avenue for genuine fans to contribute
- GitHub Sponsors — fits open source vibe but requires supporter to have a GitHub account (more friction)
- Ko-fi — similar to BMaC, slightly more creator-focused; BMaC won on brand-tone match

**Revisit trigger:** Only if usage genuinely grows and donation pattern emerges. Not before. Even then, the existing decision stands unless real data justifies a change.

---

## May 11, 2026 — Ireland tax handling for Buy Me a Coffee (informational)

**What was decided:** No additional action needed before launch. Standard Revenue Ireland declaration process applies. Not a product decision but logged so future sessions don't re-research.

**The rules (verified May 11, 2026):**
- BMaC payments go directly to creator's Stripe/bank — BMaC withholds nothing
- Ireland Revenue treats this as taxable side income
- Under €5,000 profit/year → declare via Form 12 in myAccount (simple add-on to existing PAYE return)
- Over €5,000 profit/year → must register for full self-assessment (Form 11)
- VAT registration threshold (€42,500 for services) — well beyond likely volume
- Realistic forecast for JobTrail: €0–€200/year in year one

**Action items:**
- Set up BMaC + Stripe account when ready to launch the link
- Keep donation records (BMaC dashboard handles this)
- Declare on Form 12 once a year
- If donations ever exceed €5k/year: register for self-assessment

**Caveat:** Not tax advice. 15-minute chat with an Irish accountant recommended before launch but not a blocker.

---

## May 12, 2026 — Week 1 toolchain decisions locked

**What was decided:**
- **Build tool:** Vite
- **Testing framework:** Vitest — installed in week 1, no tests written this week
- **State management:** React's built-in hooks only (`useState`, `useReducer`, `useContext`)
- **UUID generation:** `crypto.randomUUID()` (built into Chrome)
- **Date handling:** Built-in `Date` + `Intl.DateTimeFormat` for week 1; revisit if week 6 ghosted-timer math gets gnarly
- **Vite multi-entry approach for MV3:** Use `vite-plugin-web-extension` rather than hand-rolling the multi-entry config

**Why:**
- All five primary choices follow the spec's default rule: prefer built-in, skip the dependency
- Vitest pairs natively with Vite, so wiring it now is near-zero cost and pays off when classifier logic appears in week 3
- State is small (jobs list, modal, search input) — hooks are sufficient and avoid adding a library the user would later need to understand
- `crypto.randomUUID()` is native in modern Chrome; an external `uuid` package adds bytes for no gain
- Week 1 has no real date math; built-ins handle formatting and basic comparisons fine
- For Vite + MV3: `vite-plugin-web-extension` handles the known gotchas (MV3 service worker bundling, asset paths, manifest generation). It's a build-time-only dependency that never ships to end users, so "skip the dependency" applies less strongly here than for runtime libraries

**What was rejected:**
- Webpack and Parcel for build tool — heavier or less common for extensions
- Jest for testing — more friction when paired with Vite
- Skipping tests entirely for v1 — defensible but creates rework risk later
- Zustand and Redux for state — overkill for the size of state JobTrail has
- `uuid` npm package — Chrome already does this natively
- `date-fns` and `dayjs` — premature; only revisit if week 6 needs them
- Hand-rolled Vite multi-entry config for MV3 — more local config to maintain when a community plugin already solves the MV3-specific pain points

**Revisit trigger:** If `vite-plugin-web-extension` proves unmaintained or buggy, fall back to a hand-rolled multi-entry config. If week 6 date math (ghosted timer, status transitions) gets gnarly, reconsider `date-fns`.

---

## May 12, 2026 — Tailwind v4 chosen; spec section 3 file tree drifts

**What was decided:**
- Use Tailwind v4 for the JobTrail extension build (`tailwindcss` + `@tailwindcss/vite`)
- The repo therefore does **not** contain `tailwind.config.js` or `postcss.config.js` — both files referenced in spec section 3 are unused in Tailwind v4
- Design tokens (coral, navy, cream) live in `src/styles/tokens.css` via `@theme`, replacing what those config files would have held in v3
- Spec section 3 file tree to be edited to drop the two filenames on the next spec touch — not blocking week 1 build

**Why:**
- Tailwind v4 (released Jan 2025) is the mainstream default by May 2026; v3 is legacy
- v4's CSS-first config is simpler (one Vite plugin instead of plugin + two config files)
- Fewer files for a non-code-reading project owner to later understand or maintain
- The locked decision in the context doc is "use Tailwind" — v3 vs v4 was an implementation choice, surfaced and approved partway through Task 1

**What was rejected:**
- Tailwind v3 to match spec section 3 verbatim — would keep two extra config files for no working benefit; legacy setup

**Spec drift to fix later:** Remove these two lines from `JobTrail-Build-Spec.md` section 3 file tree:
- `├── tailwind.config.js`
- `├── postcss.config.js`

No urgency. Section 3 is a reference doc, not a build artifact. Fix on the next spec update.

---

## May 12, 2026 — Session summary: week 1 tasks 1–2

**Worked on:**
- JobTrail-Week1-Kickoff.md tasks 1 and 2 (project scaffold, manifest, load unpacked)
- The three pre-work context documents (project context, build spec, kickoff) read in order before any code

**Completed:**
- **Task 1 — Project scaffold.** Folder structure per spec section 3, npm dependencies (React 19, Vite, Tailwind v4, Vitest, vite-plugin-web-extension), placeholder source files for popup/dashboard/onboarding, empty service worker, README stub. `npm run build` produces a working `dist/`.
- **Task 2 — Manifest V3 + load unpacked.** Extension loaded successfully via `chrome://extensions` → Load unpacked → `dist/`. Popup opens and displays placeholder text without errors.
- **Extension ID captured:** `nkiejbmfhfellaikbjjkfjkafnbhfpnf` — needed for OAuth Client ID creation in next session.

**In progress / not yet done:**
- Task 3 (manual, by user, in next session): create OAuth 2.0 Client ID in Google Cloud Console using the captured extension ID; paste into `manifest.json` under a fresh `oauth2` block
- Tasks 4–6 (rest of week 1): OAuth flow via `chrome.identity`, token persistence + sign-out, README polish + commit hygiene

**Decisions made today:**
- Five toolchain choices locked: Vite, Vitest (installed, no tests yet), React hooks only, `crypto.randomUUID()`, built-in dates
- Vite multi-entry approach: `vite-plugin-web-extension` over hand-rolled config (build-time plugin handles MV3 gotchas; doesn't ship to users)
- Tailwind v4 over v3 (separate entry above)
- The `oauth2` block must **not** exist in `manifest.json` until a real Client ID is available — verified that Chrome rejects an empty `client_id`. Both build spec section 4 and kickoff Task 2 watch-out were updated to reflect this.

**Spec / doc updates this session:**
- `JobTrail-Build-Spec.md` section 4: oauth2 block removed from main JSON example; new warning sub-section added with the eventual oauth2 shape and the empty-client_id gotcha
- `JobTrail-Week1-Kickoff.md` Task 2 watch-out: corrected guidance — "do not add the oauth2 block yet"
- `MEMORY.md`: three new entries (toolchain decisions, Tailwind v4 deviation, this summary)
- Spec section 3 file tree deviation noted in MEMORY.md but not yet applied in the spec file itself

**Next session — start here:**
1. Open `MEMORY.md`, scan the entries below "Open watchpoints" and the last three dated entries
2. Hand the extension ID `nkiejbmfhfellaikbjjkfjkafnbhfpnf` to Google Cloud Console — project `jobtrail-496006` → APIs & Services → Credentials → Create OAuth 2.0 Client ID → type "Chrome Extension" → paste extension ID
3. Add the real `oauth2` block to `manifest.json` per build spec section 4
4. Rebuild and verify the JobTrail card in `chrome://extensions` shows no warnings
5. Begin Task 4: OAuth flow with `chrome.identity`

---

## May 12, 2026 — Session summary: week 1 tasks 3–6

**Worked on:**
- JobTrail-Week1-Kickoff.md Tasks 3 (OAuth Client ID setup), 4 (OAuth sign-in flow), 5 (token persistence + sign-out), and 6 (README + commit hygiene)
- MEMORY.md re-read at the start of each task; targeted re-reads of build spec sections 4 and 5 (for Task 4) and kickoff Task 5 (for Task 5)

**Completed:**
- **Task 3 — OAuth Client ID.** Created in Google Cloud Console (project `jobtrail-496006`), Application Type "Chrome Extension", paired to extension ID `nkiejbmfhfellaikbjjkfjkafnbhfpnf`. Client ID populated into `manifest.json` under a fresh `oauth2` block.
- **Task 4 — OAuth sign-in flow.** `src/popup/popup.jsx` rewritten to call `chrome.identity.getAuthToken({ interactive: true })`, fetch userinfo from `https://www.googleapis.com/oauth2/v2/userinfo` with a Bearer token, store the access token in `chrome.storage.local` under key `jobtrail.token`, and display the signed-in email.
- **Task 5 — Token persistence + sign-out.** Added `useEffect` mount-time verification, a `clearStoredToken` helper, sign-out handler, and three new visual states (`checking`, `signed-in` with sign-out link, `network-error` with retry + sign-out escape). 401 from userinfo clears storage and falls back to signed-out with explanation; other network/server errors show retry without clearing the token.
- **Task 6 — README + commit hygiene.** README rewritten with prerequisites (Node 20+, Chrome, OAuth Client ID), install steps, npm scripts, load-unpacked instructions, project structure, and license. Three forward commits applied to the repo in conventional-commit format (`feat:` / `docs:`).

**In progress / not yet done:**
- Week 2 work begins next session: Gmail fetch via `src/lib/gmail.js`, raw email list display in a stub dashboard
- OAuth verification submission to Google still deferred (kickoff says week 8 or later — testing mode is fine for now)
- Real icons still deferred (kickoff says week 8)

**Decisions made today:**
- **Task 5 — 401-only token cleanup.** On mount-time userinfo failure, only HTTP 401 triggers automatic token cleanup. Other 4xx/5xx responses and network errors route to a `network-error` state with a retry button and the token preserved. Reason: 401 is the specific signal that the token is rejected; other errors are likely transient and clearing the token would force re-sign-in for a network blip.
- **Task 5 — `network-error` retry preserves the token.** Retry re-reads from `chrome.storage.local` so storage stays the source of truth; a sign-out escape hatch is shown alongside retry for users who want to manually reset. The token is never cleared on transient failure.
- **Task 5 — `checking` initial state with "Loading…" UI.** Added explicitly so the popup doesn't flash wrong-state UI before the mount-time storage read resolves. Not in the kickoff brief but worth the small addition.
- **Task 6 — Commit reorganization Path B (forward-only, no force-push).** `ad972a5` was already pushed to GitHub, so rewriting it would have required force-push. Picked the additive path: leave `ad972a5` alone as a one-time pre-hygiene combo, apply conventional-commit format from Task 3 onward. Tasks 4 and 5 were combined into a single commit honestly because no intermediate commit existed on disk — the Task 4 `popup.jsx` was overwritten when Task 5 was implemented.
- **Commit-as-you-go rule going forward.** Commit each task after verification, before moving to the next. Prevents the Tasks 4/5 entanglement from recurring and keeps the log atomic.

**Spec / doc updates this session:**
- `manifest.json` — `oauth2` block added with real Client ID (committed as `e7a53f6`)
- `src/popup/popup.jsx` — full sign-in flow + persistence + sign-out (committed as `7159228`)
- `README.md` — expanded from week-1 stub to contributor-oriented README (committed as `3dd94cf`)
- `MEMORY.md` — this entry
- `JobTrail-Build-Spec.md` section 3 file tree — about to be edited in this same session to drop `tailwind.config.js` and `postcss.config.js` (Tailwind v4 deviation logged on May 12 earlier; this applies the change to the spec itself)

**Spec drift not yet applied at time of writing:** none after the section 3 edit lands in this same session.

**Next session — start here:**
1. Open `MEMORY.md` and scan the most recent dated entries plus "Open watchpoints"
2. Re-read `JobTrail-Build-Spec.md` section 11 (Scan behavior) for the Gmail fetch shape
3. Skim `JobTrail-Build-Spec.md` section 6 (Gemini integration) for context — not used in week 2, but informs how the classifier will plug in later
4. Begin week 2: implement `src/lib/gmail.js`, fetch the last 30 days of Primary-tab emails using `newer_than:30d -in:chats category:primary`, and display the raw list in a stub Dashboard page
5. Commit-as-you-go: each verified milestone gets its own commit before moving on

---
## May 16, 2026 — Week 2 architecture decisions locked

**What was decided:**
1. **Render surface:** Dashboard tab. Popup becomes a launcher (sign-in/out + "Open JobTrail" button via `chrome.tabs.create`); email list renders in `dashboard/index.html`.
2. **Fetch location:** Dashboard page directly. Token read from `chrome.storage.local`, fetch on mount. No service worker / message passing in week 2.
3. **Data depth:** Sender + subject + date + Gmail snippet. No full message bodies, no classification.
4. **Fetch strategy:** Sequential `messages.get` calls. No batch requests in week 2.

**Why:**
- Dashboard tab is the final architecture (Kanban lives there from week 5); building a popup list then ripping it out is wasted work.
- Fetch-in-page is the simplest place to get the fetch working; central coordination isn't needed until re-scan + state machine arrive.
- Snippets come free in the metadata fetch; full bodies aren't needed until week 3 classification.
- Sequential is simple and stays well under Gmail quota; a typical 30-day Primary inbox is 200–400 emails (~8–15s load), acceptable for now.

**What was rejected:**
- Email list in popup — too cramped, closes on click-away.
- Fetch in service worker — premature plumbing for week 2.
- Full message bodies in week 2 — kilobytes per email for data not yet used.
- Batch requests in week 2 — more code before typical volumes are known.

**Deferred:**
- Move fetch to service worker — revisit week 6 (re-scan + state machine need a coordinator).
- Gmail batch requests (up to 100 calls/request, ~5x faster perceived load) — revisit week 6.


---

## May 16, 2026 — Week 2 task 3 fetch measurements (dev inbox)

**Numbers (single dev inbox, naveenmelrose@outlook.com signed-in account):**
- Primary-tab emails in last 30 days: **150**
- Sequential `messages.get` wall-clock: **~30 seconds** (~0.2s per email, rough — measure more precisely on next run)
- Pagination: **confirmed working against real data** — 150 > 100 means `nextPageToken` was exercised across two pages of `messages.list`
- Final dashboard render: clean, no console errors, count logged

**Why this matters for week 6 batch decision:**
- Sequential at ~0.2s/email scales linearly: 400-email Primary inbox = 80s wall-clock, 500-email cap = 100s
- "Heavy but realistic" users (job seekers with newsletters + alerts in Primary) will hit 1.5–2 minute load times — past the threshold where users assume the page is broken
- The "5–15 second" estimate the May 16 decision used (typical 200–400-email Primary inbox at batched speed) is fine for batch but not for sequential

**Position change:**
- Original May 16 framing: batch requests are "deferred, revisit week 6"
- Updated framing (May 16, post-task-3): **Gmail batch requests are likely necessary at week 6, not optional.** Sequential is acceptable for week 2 dev use but unacceptable as the production scan path for any inbox larger than the dev measurement.
- Service-worker move is still a separate question (coordinator role for re-scan + state machine) — independently decided in week 6.

**Action at week 6:**
- Default plan: implement Gmail batch fetching as the initial-scan path. Sequential remains as fallback only.
- Re-measure on at least one heavier inbox before committing to the design.

---

Session Summary — May 16, 2026
Worked on: Week 2 — Gmail fetch + raw email list in stub dashboard. All five kickoff tasks.
Completed:

Task 1 — Popup launcher. "Open JobTrail" button added to signed-in popup state; opens dashboard tab via chrome.tabs.create + chrome.runtime.getURL. Week 1 auth states preserved.
Task 2 — src/lib/gmail.js. Pure-logic module: getToken, listMessages (paginates via nextPageToken up to 500 cap), getMessageMetadata (pulls From/Subject/Date by header name, returns normalized object incl. snippet). GmailApiError class with .status field — HTTP code on HTTP failures, null on network/parse failures.
Task 3 — Dashboard raw list. Dashboard.jsx fetches on mount, sequential messages.get, progress indicator ("Loading X of N…"), renders From/Subject/Date/Snippet table, newest first.
Task 4 — Error handling. Distinct states for no-token ("not signed in"), 401 ("session expired", no retry), 403 (quota message), network ("couldn't reach Gmail" + working Retry button).
Verification: All four error scenarios passed in Chrome. Scenario 3 verified against a real internet drop mid-scan. 403 code-reviewed only (structurally identical to 401 branch).
Commits: Five week 2 commits (three feat:, two docs:), all atomic, pushed to origin/main. Newest: 13dfd76.

In progress: None — week 2 fully closed.
Decisions made:

Week 2 architecture (4 decisions, locked May 16): dashboard-tab render surface, in-page fetch, metadata-only depth, sequential gets. (Logged in separate May 16 entry.)
Token-missing vs 401 — keep distinct, do NOT collapse. A missing token (never signed in / signed out) and a server-rejected 401 (token expired) are different situations and get different messages: "not signed in — open the popup to sign in" vs "session expired — sign in again." Rejected collapsing both into a synthesized GmailApiError{status:401} — manufacturing a fake 401 for a non-network condition is a category error and contradicts the brief (Task 3 handles missing-token on mount; Task 4 handles real 401 separately). getToken() returning null is checked before any fetch; the real Gmail 401 is caught from the fetch.
Batch-vs-sequential position shift (week 6): Task 3 measured ~30s for 150 emails (~0.2s/email). Linear scaling → 400-email inbox ≈ 80s, 500-cap ≈ 100s — past the "page looks broken" threshold. Position moved from "defer / revisit" to Gmail batch requests likely necessary at week 6, not optional. (Logged with the measurement entry.)

Measurement (dev inbox): 150 Primary-tab emails / 30 days. Sequential fetch ~30s. Pagination confirmed against real data (150 > 100 → nextPageToken exercised).
Next session — start here:

Read JobTrail-Project-Context.md, then MEMORY.md (this entry + the two other May 16 entries + Open watchpoints).
Re-upload the current MEMORY.md to project knowledge — it was edited locally + by Claude Code this week; the project-knowledge copy is stale.
Week 3 = whitelist classification. Re-read JobTrail-Build-Spec.md section 7 (classification logic, ATS whitelist) and section 8 (data model — week 3 starts persisting jobtrail.jobs to storage).
Week 3 will need a format=full body-fetch path added to gmail.js — week 2 deliberately fetched metadata only. Not a surprise; flagged here.
Draft JobTrail-Week3-Kickoff.md before Claude Code starts.

## May 17, 2026 — Week 3 scope decisions locked

**What was decided:**
1. **What "classified" means in week 3:** Whitelist match only. A whitelisted
   sender domain = a job. Status is hardcoded to `Applied` for every week-3 job.
   Real status detection waits for the state machine in week 6.
2. **Data depth:** Metadata only (sender / subject / date / snippet). No
   `format=full` body fetch in week 3 — whitelist classifies on sender domain
   alone. Body fetch moves to week 4 where Gemini consumes body text.
3. **Thread grouping:** In scope for week 3. Matched emails collapse to jobs by
   `threadId`. One thread = one job (spec section 8).
4. **Whitelist storage:** A JSON data file (`src/lib/ats-whitelist.json`),
   loaded by `classifier.js`. Growing the list never requires a code change.

**Why:**
- Status detection is explicitly week 6 work; guessing status from subject
  keywords in week 3 builds throwaway logic that the real state machine replaces.
- Whitelist classification needs only the `From` header — full bodies would be
  kilobytes of unused data until Gemini arrives in week 4.
- The data model is keyed on threads; collapsing messages now avoids reworking
  the jobs array later.
- Spec section 7 explicitly says treat the whitelist as data, not code.

**What was rejected:**
- Match + naive subject-keyword status guessing — throwaway logic, reworked in
  week 6.
- Adding the `format=full` body-fetch path in week 3 — code sitting unused for a
  week; belongs with Gemini in week 4.

**Planning-note correction:** The May 16 "next session" note said week 3 would
need a `format=full` body-fetch path added to `gmail.js`. That assumption was
wrong — whitelist-only classification uses only the `From` header. Body fetch is
a week-4 task. No locked decision is contradicted; only a forward-planning note
is corrected.

**Field-population boundary:** Week 3 populates only fields derivable from
metadata + the whitelist match (`threadId`, `appliedAt`, `lastActivityAt`,
`latestEmail.*`, `recruiter.email`, `source`, `id`, the constant flags). It does
NOT populate `company`, `role`, `recruiter.name`, `jobDescription` (week 4
Gemini) or `statusUpdatedAt` (week 6). No guessing company/role from the domain.

---

## May 17, 2026 — OAuth verification: cannot submit yet, blockers identified

**What was decided:** Do not attempt full OAuth verification submission now.
Clear the non-video blockers this week (privacy policy + homepage); submit when
the demo video is recordable, realistically week 5–6.

**Why:**
- The original "submit in week 1" watchpoint assumed verification is a
  paperwork-only task. It is not. Google requires a demo video showing the
  `gmail.readonly` scope being used in a functioning app — impossible until the
  dashboard renders real classified data (week 5+).
- Three hard blockers: (a) homepage URL must be live + reachable, (b) privacy
  policy URL must be live + reachable, (c) demo video must show the scope in use.
- (a) and (b) are pure writing/hosting tasks with no dependency on build
  progress — worth doing now so submission is a 1-day task later.
- (c) genuinely gates on a working app; deferring it is unavoidable, not a slip.

**Action plan:**
- Privacy policy: drafted in chat (May 17). Must honestly state read-only Gmail
  access, data stays in `chrome.storage.local`, BYO Gemini key, no developer
  servers, no telemetry.
- Homepage: single static page on GitHub Pages (free, no domain purchase). Hosts
  what JobTrail is + link to the privacy policy.
- Logo: placeholder coral inbox icon — verify submission-readiness at week 5.
- Demo video: record at week 5–6 once the dashboard shows real data.

**What was rejected:**
- Submit now anyway — incomplete submissions get bounced; wastes a review cycle.
- Defer everything to week 5 — leaves privacy policy + homepage on the critical
  path for no reason.

**Watchpoint update:** The "submit early in week 1" item under Open watchpoints
is now corrected — realistic submit window is week 5–6, gated on the demo video.

## Open watchpoints (not yet decisions, things to track)

- **HR friends / brother / wife feedback on mockup** — context doc section 9; if their feedback requires UI changes, sections 5 and 10 of the spec will need updating before week 5
- **OAuth verification for `gmail.readonly`** — highest risk dependency in the project; submit early in week 1
- **Gemini prompt accuracy** — section 6 prompt is v0; needs 20+ real emails for testing in week 4
- **Initial scan UX for heavy users** — if free tier is exceeded, how do we explain "we'll keep scanning over 2-3 days" to users? Decide in week 4.
- **Free tier viability for typical users** — week 4: measure actual LLM call volume on a real job seeker's 30-day inbox. If under 20 RPD, keep "free tier" framing in context doc. If over, update context doc per Option C honest framing.
- **BMaC link placement and copy** — defer final wording until v1 polish week 8. Default copy: "JobTrail is free and open source. If it saved you time, you can buy me a coffee." Verify BMaC URL is live before submitting to Chrome Web Store.

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

## Open watchpoints (not yet decisions, things to track)

- **HR friends / brother / wife feedback on mockup** — context doc section 9; if their feedback requires UI changes, sections 5 and 10 of the spec will need updating before week 5
- **OAuth verification for `gmail.readonly`** — highest risk dependency in the project; submit early in week 1
- **Gemini prompt accuracy** — section 6 prompt is v0; needs 20+ real emails for testing in week 4
- **Initial scan UX for heavy users** — if free tier is exceeded, how do we explain "we'll keep scanning over 2-3 days" to users? Decide in week 4.
- **Free tier viability for typical users** — week 4: measure actual LLM call volume on a real job seeker's 30-day inbox. If under 20 RPD, keep "free tier" framing in context doc. If over, update context doc per Option C honest framing.

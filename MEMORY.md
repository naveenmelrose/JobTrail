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

## Open watchpoints (not yet decisions, things to track)

- **HR friends / brother / wife feedback on mockup** — context doc section 9; if their feedback requires UI changes, sections 5 and 10 of the spec will need updating before week 5
- **OAuth verification for `gmail.readonly`** — highest risk dependency in the project; submit early in week 1
- **Gemini prompt accuracy** — section 6 prompt is v0; needs 20+ real emails for testing in week 4
- **Initial scan UX for heavy users** — if free tier is exceeded, how do we explain "we'll keep scanning over 2-3 days" to users? Decide in week 4.
- **Free tier viability for typical users** — week 4: measure actual LLM call volume on a real job seeker's 30-day inbox. If under 20 RPD, keep "free tier" framing in context doc. If over, update context doc per Option C honest framing.
- **BMaC link placement and copy** — defer final wording until v1 polish week 8. Default copy: "JobTrail is free and open source. If it saved you time, you can buy me a coffee." Verify BMaC URL is live before submitting to Chrome Web Store.

# JobTrail — Build Spec (v0.1)

> Technical build specification. Companion to `JobTrail-Project-Context.md`.
> Context doc = *what* and *why*. This doc = *how*.
> Last updated: May 11, 2026

---

## 0. How to use this doc

- Hand this to Claude Code one section at a time, matched to the week in section 14.
- Anything marked **[VERIFY]** needs you (or Claude Code) to confirm before relying on it. These are things I'm not certain about right now.
- Anything marked **[ITERATE]** is a starting point that will need real-data testing to refine.
- Anything marked **[OUT OF SCOPE]** is explicitly not v1 — push back if Claude Code tries to add it.

---

## 1. Project overview

JobTrail is a Chrome extension (Manifest V3) that:
1. Reads the user's Gmail (read-only) on a 30-day window.
2. Classifies emails as job-application-related or not.
3. Determines the status of each application (Applied, In Conversation, etc.).
4. Displays everything on a 6-column Kanban dashboard.
5. Lets the user drill into a card to see the latest email, JD, and metadata.

**No backend. No server. No database.** Everything runs in the browser. State lives in `chrome.storage.local`. Source of truth is Gmail itself — if storage is lost, re-scan rebuilds it.

**BYO key.** User brings their own Google Gemini API key. JobTrail never sees or stores anyone's data on a developer-controlled server.

---

## 2. Locked decisions (from context doc — do not change without flagging)

- 6 stages: Applied, In Conversation, Interview Scheduled, Awaiting Outcome, Offer/Rejected/Withdrawn, Ghosted
- Ghosted threshold: 30 days, hardcoded in v1
- Initial scan window: 30 days
- Max emails per initial scan: 500
- Gmail access: read-only, never write
- One Gmail thread = one job (no cross-thread linking in v1)
- ATS whitelist + LLM hybrid classification
- Calendar integration: phase 1B (weeks 9–12), not phase 1A
- License: MIT, open source
- Stack: JavaScript + Chrome Manifest V3 + React + Tailwind

---

## 3. File and folder structure

```
JobTrail/
├── manifest.json              # Chrome extension manifest (V3)
├── package.json               # npm dependencies + build scripts
├── vite.config.js             # build tool config [VERIFY: Vite vs other]
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── LICENSE                    # MIT
├── .gitignore
├── public/
│   ├── icons/                 # 16, 32, 48, 128 px PNGs
│   └── ...
├── src/
│   ├── background/
│   │   └── service-worker.js  # background script (OAuth, scan triggers)
│   ├── popup/
│   │   ├── index.html
│   │   ├── popup.jsx          # small popup that opens the dashboard
│   │   └── popup.css
│   ├── dashboard/
│   │   ├── index.html
│   │   ├── Dashboard.jsx      # main Kanban view (the app)
│   │   ├── Kanban.jsx
│   │   ├── JobCard.jsx
│   │   ├── JobModal.jsx
│   │   ├── SettingsDrawer.jsx
│   │   └── ...
│   ├── onboarding/
│   │   ├── index.html
│   │   ├── Onboarding.jsx     # 5-screen flow from mockup
│   │   └── ...
│   ├── lib/
│   │   ├── gmail.js           # Gmail API calls
│   │   ├── gemini.js          # Gemini API calls
│   │   ├── classifier.js      # whitelist + LLM logic
│   │   ├── state-machine.js   # status transitions
│   │   ├── storage.js         # chrome.storage wrapper
│   │   └── utils.js
│   └── styles/
│       └── tokens.css         # design tokens from mockup
└── docs/
    ├── PROJECT-CONTEXT.md     # copy of context doc
    └── BUILD-SPEC.md          # this file
```

**Why this shape:** Each major surface (background, popup, dashboard, onboarding) is its own folder so Vite can build them as separate entry points. Pure logic lives under `lib/` with no React, so it's testable and reusable.

---

## 4. Chrome manifest (V3)

Key fields (illustrative — Claude Code should generate the actual file):

```json
{
  "manifest_version": 3,
  "name": "JobTrail",
  "version": "0.1.0",
  "description": "Auto-track your job applications from Gmail.",
  "permissions": ["storage", "identity"],
  "host_permissions": [
    "https://gmail.googleapis.com/*",
    "https://generativelanguage.googleapis.com/*"
  ],
  "oauth2": {
    "client_id": "[FILLED IN AT BUILD TIME]",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  },
  "background": { "service_worker": "background/service-worker.js" },
  "action": { "default_popup": "popup/index.html" }
}
```

**[VERIFY]** Exact scope strings — Google occasionally changes these. Confirm at https://developers.google.com/identity/protocols/oauth2/scopes before publishing.

**[VERIFY]** Calendar scope (`calendar.readonly`) is **not** in v1 manifest. Add only in phase 1B.

---

## 5. Gmail OAuth setup

### What the user sees
1. Click "Continue with Google" in onboarding.
2. Standard Google consent screen.
3. JobTrail requests: read Gmail, see email address.
4. User clicks Allow.
5. Extension receives a token, stores it in `chrome.storage.local`.

### What the developer (you) needs to set up
1. Create a Google Cloud project at console.cloud.google.com.
2. Enable the Gmail API.
3. Create OAuth 2.0 Client ID (type: Chrome Extension).
4. Add the extension ID to the authorized list.
5. Configure OAuth consent screen — initially in "testing" mode (up to 100 test users).
6. **[VERIFY]** Submit for verification before public release. Verification for `gmail.readonly` is reviewed by Google and can take weeks. **This is the highest risk dependency in the whole project.**

### Scopes used in v1
- `gmail.readonly` — read messages and metadata
- `userinfo.email` — get the user's email address for storage

### What is *not* used
- `gmail.modify`, `gmail.send`, `gmail.compose` — never. The extension must never write to Gmail.

---

## 6. Gemini API integration

### Model choice
- **Default:** `gemini-2.0-flash` or whichever current model is the cheapest fast model with sufficient quality. **[VERIFY at build time]** — Gemini's lineup changes frequently.
- **Why flash:** Classification is a simple task. Latency matters more than reasoning depth. Free tier covers it.

### Auth
- User pastes their API key during onboarding (screen 3 in mockup).
- Key stored in `chrome.storage.local`. Never synced. Never sent anywhere except `generativelanguage.googleapis.com`.

### Request shape
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=USER_KEY
```

### Free tier reality check
**[VERIFY at build time]** Gemini free tier currently allows N requests per minute and M per day. A 500-email initial scan must fit within that, or the scan needs rate-limiting / batching. Check before week 4.

### Failure modes the code must handle
- Key invalid → show clear error, send user back to onboarding step 3
- Rate limited → back off, retry, eventually surface error to user
- Network error → retry with exponential backoff, then queue for next scan
- Gemini returns malformed JSON → parse defensively, treat as "uncertain" classification, skip the email (don't crash)

---

## 7. Email classification logic

### The hybrid approach (locked)

```
For each email in the inbox window:
  1. Is the sender domain on the ATS whitelist?
     YES → Auto-classify as job-related. Determine status via rules.
     NO  → Send to LLM for classification.

  2. LLM returns: {isJobApplication: bool, status: enum, confidence: 0-1}
     If confidence < threshold → mark "uncertain", skip.
     If isJobApplication = true → store with detected status.
```

### ATS whitelist (starter list — [ITERATE])
- greenhouse.io / @greenhouse-mail.io
- lever.co / @hire.lever.co
- ashbyhq.com
- workday.com / myworkday.com
- smartrecruiters.com
- jobvite.com
- icims.com
- bamboohr.com
- workable.com
- breezy.hr
- recruitee.com
- teamtailor.com
- successfactors.com
- taleo.net
- linkedin.com (jobs alerts and messages — needs sub-filtering)
- indeed.com
- glassdoor.com
- wellfound.com (formerly angel.co)
- otta.com / welcometothejungle.com
- ycombinator.com (workatastartup)

**[ITERATE]** This list will grow. Treat it as data, not code — keep in a JSON file the user can extend.

### Gemini prompt (v0 — [ITERATE])

```
You are classifying an email to determine if it relates to a job application
the recipient submitted, and what stage that application is in.

Email:
From: {{from}}
Subject: {{subject}}
Body (first 2000 chars):
{{body}}

Classify and respond ONLY with valid JSON in this shape:
{
  "isJobApplication": true | false,
  "status": "Applied" | "InConversation" | "InterviewScheduled" | "AwaitingOutcome" | "Offer" | "Rejected" | "Withdrawn" | null,
  "company": "string or null",
  "role": "string or null",
  "confidence": 0.0 to 1.0,
  "reasoning": "one short sentence"
}

Rules:
- isJobApplication is TRUE only if the recipient applied to a job. Cold recruiter outreach where the recipient did not apply is FALSE.
- Job alerts, newsletters, digests are FALSE.
- "Applied" = confirmation that an application was received.
- "InConversation" = recruiter is asking questions, requesting assignments, or replying to scheduling.
- "InterviewScheduled" = explicit calendar invite or confirmed time and date.
- "AwaitingOutcome" = interview is done, decision pending.
- "Offer" = formal offer extended.
- "Rejected" = explicit rejection ("moving forward with other candidates", "not a fit").
- "Withdrawn" = the recipient withdrew (rare to detect from email alone — usually false).
- If unsure between two statuses, pick the earlier one.
- confidence < 0.6 means you're guessing — say so.
```

**[ITERATE]** This prompt needs at least 20 real emails tested against it before it's trustworthy. Plan a week of refinement.

---

## 8. Data model

Stored in `chrome.storage.local` under a single key `jobtrail.jobs`:

```json
{
  "jobs": [
    {
      "id": "uuid-v4",
      "threadId": "gmail-thread-id",
      "company": "Stripe",
      "role": "Senior Product Manager",
      "status": "InterviewScheduled",
      "statusUpdatedAt": "2026-05-08T14:30:00Z",
      "appliedAt": "2026-04-12T09:15:00Z",
      "lastActivityAt": "2026-05-08T14:30:00Z",
      "source": "LinkedIn",
      "recruiter": { "name": "Sarah Chen", "email": "sarah.chen@stripe.com" },
      "latestEmail": {
        "messageId": "gmail-msg-id",
        "subject": "Re: Interview scheduled — Tuesday 3pm PT",
        "snippet": "Hi! We loved your background — would you have time...",
        "receivedAt": "2026-05-08T14:30:00Z"
      },
      "jobDescription": "Lead product development for Stripe's payments platform...",
      "userNotes": "",
      "isManual": false,
      "isGhosted": false,
      "ghostedAt": null
    }
  ],
  "meta": {
    "lastScanAt": "2026-05-11T10:00:00Z",
    "scanWindowDays": 30,
    "userEmail": "user@example.com",
    "apiKeyPresent": true
  }
}
```

**Notes:**
- `id` is JobTrail's own UUID. `threadId` is Gmail's. They're separate so manual entries (no Gmail thread) still have IDs.
- `userNotes` is reserved for the Edit/Notes feature shown in the modal.
- `isManual = true` for jobs the user added by hand (no Gmail thread).
- API key stored separately under key `jobtrail.apikey` (not under `meta` — keeps it isolated for security audits).

---

## 9. State machine

### Allowed transitions

| From | Can move to |
|---|---|
| (new) | Applied, InConversation, InterviewScheduled (rare), Manual |
| Applied | InConversation, InterviewScheduled, Rejected, Ghosted, Withdrawn |
| InConversation | InterviewScheduled, AwaitingOutcome, Rejected, Ghosted, Withdrawn |
| InterviewScheduled | AwaitingOutcome, InterviewScheduled (next round), Rejected, Withdrawn |
| AwaitingOutcome | Offer, Rejected, InterviewScheduled (follow-up round), Withdrawn |
| Offer | (terminal) |
| Rejected | (terminal) |
| Withdrawn | (terminal) |
| Ghosted | Any active state (if recruiter resurfaces) |

### Ghosted detection
- Runs on every scan.
- For each non-terminal job: if `lastActivityAt > 30 days ago`, mark `isGhosted = true` and set `ghostedAt`.
- "Activity" includes inbound emails *and* user's own outbound replies (Gmail's `SENT` label on the same thread).
- If a new inbound email arrives on a ghosted thread, un-ghost it and re-classify status.

### Implementation note
Keep the state machine as a pure function in `lib/state-machine.js`:
```
nextStatus(currentJob, newEmail) -> { status, reason }
```
No side effects. Easy to test. The dashboard just calls it and displays results.

---

## 10. UI components

The mockup is the visual spec. Component breakdown (Claude Code can refine):

| Component | Maps to mockup screen |
|---|---|
| `Onboarding` | Screens 1–5 (welcome, signin, aikey, scanning, dashboard) |
| `Dashboard` | Screen 5 wrapper |
| `Kanban` | The 6-column grid |
| `KanbanColumn` | One column |
| `JobCard` | One card |
| `JobModal` | The drill-in modal |
| `SettingsDrawer` | The right-side settings panel |
| `SearchBar` | Top search input |
| `SummaryBar` | The pills row (Total / Active / This week) |

**Design tokens** from the mockup (`:root` CSS variables) become `tokens.css` and feed Tailwind config. Coral `#F96167`, navy `#2F3C7E`, cream `#FFF7F2`, etc.

**[OUT OF SCOPE]** Animations beyond the mockup's basic fade/slide. Dark mode. Mobile layout (extensions are desktop-only anyway).

---

## 11. Scan behavior

### Initial scan (first install)
1. After OAuth + API key entry, trigger scan.
2. Fetch up to 500 emails from the last 30 days using Gmail search query:
   `newer_than:30d -in:chats`
3. Filter by sender domain against ATS whitelist → fast batch.
4. Non-whitelist emails → batch through Gemini with rate-limit awareness.
5. Build initial `jobs` array, store, render dashboard.

### Re-scan (manual button in dashboard)
- Same as initial but only fetches emails newer than `meta.lastScanAt`.
- Updates existing jobs if `threadId` matches.
- Adds new jobs for new threads.

### Background scan
**[OUT OF SCOPE for v1]** Auto-scan on a schedule. v1 is manual re-scan only.

### Rate limiting
- Gmail API: 1 billion quota units/day, ~250/sec per user. Not a real concern at 500 emails.
- Gemini free tier: **[VERIFY]** Currently around 15 req/min for flash. Initial scan of ~100 non-whitelist emails could hit this. Solution: process in chunks of 10 with a 5-second pause.

---

## 12. Edge cases and known unknowns

Things Claude Code will need to handle or ask about:

1. **What if a thread has multiple emails with conflicting statuses?** → Use the most recent email's classification. The state machine takes care of "is this a valid transition."
2. **What if the user receives a rejection then a re-engagement from the same recruiter weeks later?** → Same thread = same job. Status moves Rejected → InConversation (allowed via Ghosted exception? Or special case?). **[VERIFY]** Decide before building state-machine.js.
3. **What if Gemini returns valid JSON but with hallucinated company names?** → Cross-check against the email's `From` domain. If mismatch and confidence < 0.8, flag as uncertain.
4. **What if the user is applying via the same recruiter for multiple roles at the same company?** → Different Gmail threads usually. Each thread is its own job. Acceptable in v1.
5. **What happens when the OAuth token expires?** → Chrome's `chrome.identity` handles refresh transparently in most cases. Build a clear "re-authenticate" flow for when it doesn't.
6. **What if the user has 10,000 emails in 30 days?** → Cap at 500 (locked). Show a message: "We scanned the most recent 500 emails. Older emails not included."
7. **What about non-English emails?** → Gemini handles them. The prompt doesn't restrict language. **[ITERATE]** Test with at least one non-English recruiter email.

---

## 13. Out of scope for v1 (don't drift)

Listed explicitly so Claude Code doesn't add them on enthusiasm:

- Multi-account Gmail support
- Cross-thread linking (one job = one thread, period)
- Phase indicators within stages
- Status audit history / change log
- Days-active traffic light indicators
- Configurable ghosted threshold (locked at 30)
- Recruiter cold-outreach detection
- "Are you free Tuesday?" interview parsing without calendar invite
- Backend / cloud sync
- Mobile version
- Notifications (browser or otherwise)
- Calendar integration (that's phase 1B)
- Auto-scheduled background scans
- Dark mode
- Analytics / telemetry of any kind (privacy story)

---

## 14. Build sequence (matches context doc weeks 1–8)

### Week 1 — Scaffold + OAuth
- npm init, install React, Vite, Tailwind
- Generate manifest.json
- Set up Google Cloud project, OAuth client
- Build minimal popup that successfully runs the OAuth flow and displays the user's email address
- **Done when:** User can click extension icon → consent → see their email.

### Week 2 — Gmail fetch
- Implement `lib/gmail.js` — fetch last 30 days of messages
- Display raw list (no classification yet) in a stub dashboard page
- **Done when:** Console shows fetched emails, basic list renders.

### Week 3 — Whitelist classification
- Implement `lib/classifier.js` with ATS whitelist only (no LLM yet)
- Pipe Gmail results through it, show classified jobs in a stub Kanban
- **Done when:** Real ATS confirmations show up in the right column.

### Week 4 — Gemini integration + BYO key
- API key entry screen (onboarding step 3)
- `lib/gemini.js` with the v0 prompt
- Wire classifier to fall back to Gemini for non-whitelist emails
- **Done when:** A non-ATS recruiter email gets correctly classified.

### Week 5 — Dashboard UI
- Port mockup HTML/CSS into React + Tailwind
- All 6 columns, cards, search bar, summary bar
- **Done when:** Dashboard looks like the mockup, populated with real data.

### Week 6 — Status detection + state machine
- Implement `lib/state-machine.js`
- Status updates on re-scan
- Ghosted timer logic
- **Done when:** Re-scanning an existing install correctly moves jobs between columns.

### Week 7 — Modal + Gmail link
- JobModal component with email, JD, metadata
- "Open in Gmail" link works
- Manual add and edit/notes flow
- **Done when:** Clicking any card shows full detail, can open the source email.

### Week 8 — Polish + ship
- Edge cases from section 12
- Settings drawer (real, not mockup)
- CSV export
- Submit to Chrome Web Store (testing track first)
- **Done when:** Submitted for review.

---

## 15. Risks and unknowns to track

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google OAuth verification for `gmail.readonly` is denied or takes months | Medium | High | Start verification process in week 1, not week 8. Have a "testing mode" build ready as fallback. |
| Gemini free tier limits make 500-email scans too slow | Medium | Medium | Test in week 4 with real data. If broken, chunk + delay. |
| Gemini prompt accuracy is below useful threshold | Medium | High | Budget extra time in week 4 for prompt iteration. Have at least 20 real emails to test against. |
| Mockup-to-React port surfaces design gaps | Low | Low | The mockup is detailed. Most gaps will be minor. |
| User's Gmail has weird edge cases not in test data | High | Low | Accept it. Iterate post-launch based on real reports. |
| Chrome Web Store rejects on first submission | Medium | Low | Common, usually fixable. Read policy carefully. |

---

## 16. What's NOT in this spec (deliberately)

- React component code (Claude Code writes it from the mockup)
- Test files (decide testing strategy with Claude Code at week 1)
- CI/CD (overkill for v1; ship manually)
- Branding refinement (logo placeholder is fine for v1)
- README content (write in week 8 alongside submission)

---

## 17. When to update this spec

- After any **[VERIFY]** is resolved → update the doc, remove the marker
- After any **[ITERATE]** lands on a stable answer → update
- If a locked decision changes → flag in chat first, then update both this doc and the context doc
- After each build week → add a "Week N notes" entry at the bottom with what actually happened vs. plan

---

## Appendix A — Open questions for week 1 kickoff

Things to decide with Claude Code before writing a line of code:

1. Vite vs. Webpack vs. Parcel for the build? (Recommend Vite — modern, fast, well-supported for extensions.)
2. Testing framework — Vitest, Jest, or skip tests for v1?
3. State management — React's built-in hooks, Zustand, or something else? (Recommend hooks only; state is small.)
4. UUID library — `crypto.randomUUID()` (built into modern browsers) or a package?
5. Date library — `Intl.DateTimeFormat` (built-in) or `date-fns`?

Default answer to all: **prefer built-in, skip the dependency.**

---

*End of spec v0.1. Next update: after week 1 kickoff or after any [VERIFY] is resolved.*

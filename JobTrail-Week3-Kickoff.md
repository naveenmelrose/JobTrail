# JobTrail — Week 3 Kickoff Brief for Claude Code

> Hand this to Claude Code at the start of week 3. Companion documents (read in order):
> 1. `JobTrail-Project-Context.md` — what and why
> 2. `JobTrail-Build-Spec.md` — full technical spec
> 3. `MEMORY.md` — append-only decision log
> 4. This doc — week 3 task sequence
> Last updated: May 17, 2026

---

## Read these first

Before writing any code, read in this order:
1. `JobTrail-Project-Context.md` — full context, locked decisions
2. `JobTrail-Build-Spec.md` sections 7 (classification logic, ATS whitelist), 8 (data model), 14 (week 3 row)
3. `MEMORY.md` — every dated entry, especially the three May 16 entries and the May 17 "Week 3 scope decisions locked" entry

Do not skip any of these. Locked decisions in the context doc and MEMORY.md must not be contradicted without flagging.

---

## Week 3 goal

**Pipe the week-2 Gmail fetch through an ATS-whitelist classifier, group matched emails into jobs by thread, persist them to `chrome.storage.local`, and display them in a stub 6-column Kanban.**

That's the only deliverable. No Gemini / LLM (week 4). No full message body fetch (week 4). No real status detection (week 6). No styled UI, no modal, no settings drawer (week 5). Resist scope creep.

### What "working" means at end of week 3
- The dashboard fetches Gmail (week-2 logic, unchanged), then runs every email through the whitelist classifier
- Emails whose sender domain matches the ATS whitelist become jobs; non-matching emails are dropped silently
- Matched emails are grouped so one Gmail thread = one job
- Jobs are written to `chrome.storage.local` under key `jobtrail.jobs`
- The dashboard renders a stub Kanban: 6 columns, every job appears as a plain card in the **Applied** column
- On reopen, the dashboard reads jobs from storage first, then re-fetches and rebuilds — storage is not stale
- Console logs: emails fetched, emails matched, jobs created, no errors

---

## Scope decisions (already locked — do not re-litigate)

Resolved May 17, 2026 and logged in MEMORY.md. Listed here so they are not re-opened:

| # | Decision | Choice |
|---|---|---|
| 1 | What "classified" means | Whitelist match only. A matched email = a job. **Status is hardcoded to `Applied`** for every job. Real status detection is week 6. |
| 2 | Data depth | Metadata only (sender / subject / date / snippet). **No `format=full` body fetch.** Whitelist classifies on sender domain alone. Body fetch is added in week 4 for Gemini. |
| 3 | Thread grouping | In scope. Collapse messages to jobs by `threadId`. One thread = one job (spec section 8). |
| 4 | Whitelist storage | A JSON data file (`src/lib/ats-whitelist.json`), loaded by the classifier. Growing the list never requires a code change. |

If any of these turns out to be wrong while building, stop and flag it — do not silently change course.

### Note on decision 2 — a planning-note correction
The May 16 MEMORY.md "next session" note said week 3 would need a `format=full` body-fetch path added to `gmail.js`. That assumption was wrong: whitelist-only classification needs only the `From` header, which week-2 metadata already provides. The body-fetch path moves to **week 4**, where Gemini actually consumes body text. No locked *decision* is contradicted — only a forward-planning note. This is logged in MEMORY.md (May 17).

---

## What week 3 can and cannot populate in the data model

The spec's `jobtrail.jobs` model (section 8) has many fields. Whitelist + metadata classification can only honestly fill some of them. Do **not** invent data for the rest — Gemini fills them in week 4.

| Field | Week 3 value | Source |
|---|---|---|
| `id` | `crypto.randomUUID()` | generated |
| `threadId` | Gmail thread ID | metadata |
| `status` | always `"Applied"` | hardcoded (decision 1) |
| `appliedAt` | date of the **earliest** email in the thread | metadata |
| `lastActivityAt` | date of the **most recent** email in the thread | metadata |
| `latestEmail.messageId` | most recent message's ID | metadata |
| `latestEmail.subject` | most recent message's subject | metadata |
| `latestEmail.snippet` | most recent message's snippet | metadata |
| `latestEmail.receivedAt` | most recent message's date | metadata |
| `recruiter.email` | sender address of the most recent email | metadata (`From` header) |
| `source` | the matched ATS name (e.g. `"Greenhouse"`, `"Lever"`) | whitelist match |
| `isManual` | `false` | constant |
| `isGhosted` | `false` | constant (ghosted logic is week 6) |
| `ghostedAt` | `null` | constant |
| `company` | `null` | **week 4 (Gemini)** — do not guess from domain |
| `role` | `null` | **week 4 (Gemini)** |
| `recruiter.name` | `null` | **week 4 (Gemini)** |
| `jobDescription` | `null` | **week 4 (Gemini)** |
| `statusUpdatedAt` | `null` | **week 6 (state machine)** |
| `userNotes` | `""` | empty until week 7 |

`meta` block: set `lastScanAt` (now), `scanWindowDays` (30), `userEmail` (from storage if present), `apiKeyPresent` (`false` — no key flow until week 4).

**Do not** populate `company` / `role` by parsing the domain or subject line. That is classification logic that belongs to Gemini. A card showing the sender domain and subject is the correct, honest week-3 output.

---

## Task sequence

Work through these in order. Each task has a clear "done when" checkpoint. Do not move to the next task until the current one is verified. Commit each task after verification, before starting the next (commit-as-you-go rule, locked May 12).

---

### Task 1 — ATS whitelist data file

**Do:**
- Create `src/lib/ats-whitelist.json`
- Seed it from spec section 7's starter list (greenhouse.io, lever.co, ashbyhq.com, workday.com / myworkday.com, smartrecruiters.com, jobvite.com, icims.com, bamboohr.com, workable.com, breezy.hr, recruitee.com, teamtailor.com, successfactors.com, taleo.net, indeed.com, glassdoor.com, wellfound.com, otta.com, welcometothejungle.com, ycombinator.com)
- Structure each entry so the classifier can both **match** a domain and **name** the ATS — e.g. an array of `{ "name": "Greenhouse", "domains": ["greenhouse.io", "greenhouse-mail.io"] }` objects. Final shape is your call; surface it if you change it from this.
- **Exclude `linkedin.com` from the week-3 file.** Spec section 7 flags it as "needs sub-filtering" — a raw `linkedin.com` match would pull in job alerts and digests, which are explicitly NOT applications. LinkedIn handling waits for Gemini in week 4. Leave a comment in the JSON noting why it's omitted.

**Done when:**
- `ats-whitelist.json` exists, is valid JSON, and is loadable by the classifier
- LinkedIn is intentionally absent with a noted reason

**Watch out for:**
- This is a `[ITERATE]` list per the spec — it is data, not code. Do not bury domains in a `.js` file.

---

### Task 2 — `src/lib/classifier.js`

**Do:**
- Create `src/lib/classifier.js` as pure logic (no React), importing the whitelist JSON
- Export a function `classifyEmail(email)` that:
  - Extracts the sender domain from the email's `from` field (handle the `Display Name <addr@domain.com>` format — the domain is after the `@`)
  - Checks the domain against every whitelist entry's `domains` list, including **subdomain matches** (e.g. `jobs.greenhouse.io` should match `greenhouse.io`)
  - Returns `{ isJobApplication: true, source: "<ATS name>" }` on a match, or `{ isJobApplication: false, source: null }` on no match
- Export a function `buildJobsFromEmails(emails)` that:
  - Runs every email through `classifyEmail`
  - Drops non-matches
  - Groups matched emails by `threadId`
  - Produces one job object per thread, populated per the field table above
- No LLM call. No body parsing. No status logic beyond hardcoded `"Applied"`.

**Done when:**
- `classifyEmail` correctly matches a known ATS domain and a subdomain of one, and correctly rejects a non-ATS domain (e.g. a personal gmail address)
- `buildJobsFromEmails` turns a list of week-2 metadata objects into a list of job objects with no null/undefined crashes
- Two emails sharing a `threadId` collapse into exactly one job

**Watch out for:**
- Domain extraction is the fragile part. `From` headers vary: `"Greenhouse <no-reply@greenhouse-mail.io>"`, `no-reply@greenhouse-mail.io`, occasionally malformed. Parse defensively — a header you cannot parse is a non-match, not a crash.
- Subdomain matching must be a true suffix match on a dot boundary. `notgreenhouse.io` must NOT match `greenhouse.io`.

---

### Task 3 — `src/lib/storage.js` and persisting jobs

**Do:**
- Create `src/lib/storage.js` as a thin wrapper over `chrome.storage.local`, exporting at minimum:
  - `getJobs()` — read and return the `jobtrail.jobs` object, or a sensible empty default (`{ jobs: [], meta: {} }`) if absent
  - `saveJobs(data)` — write the full `jobtrail.jobs` object
- The data written must match the spec section 8 shape (`{ jobs: [...], meta: {...} }`)
- Week 3 writes the jobs array and the `meta` block. It does NOT touch `jobtrail.token` or `jobtrail.apikey` — those are separate keys.

**Done when:**
- After a dashboard scan, `jobtrail.jobs` is present in `chrome.storage.local` (verify in DevTools) with a populated `jobs` array and `meta` block
- `getJobs()` on a fresh install (nothing stored) returns the empty default without throwing

**Watch out for:**
- `chrome.storage.local` is async — every call is a promise / callback. Do not write it as if it were synchronous.
- This is the first time JobTrail persists application data. Week 2 displayed and discarded. From here on, storage is real.

---

### Task 4 — Dashboard: classify, persist, render stub Kanban

**Do:**
- Update `src/dashboard/Dashboard.jsx`:
  - On mount: call `getJobs()` first and render whatever is already stored (instant paint, no blank screen)
  - Then run the week-2 Gmail fetch (unchanged — `listMessages` + sequential `getMessageMetadata`)
  - Pipe the fetched emails through `buildJobsFromEmails`
  - Call `saveJobs` with the rebuilt data
  - Re-render with the fresh jobs
- Replace the week-2 raw email table with a **stub Kanban**: 6 columns titled exactly — Applied, In Conversation, Interview Scheduled, Awaiting Outcome, Offer / Rejected, Ghosted
- Every job renders as a plain card in the **Applied** column (every job's status is hardcoded `Applied`). The other five columns render empty. That is correct and expected for week 3.
- Each card shows: `source` (the ATS name), the latest email subject, the sender address, the latest activity date. No company/role — those are null.
- Keep the week-2 progress indicator during the fetch
- Keep all week-2 error handling (401 / 403 / network / no-token) intact and working

**Done when:**
- Opening the dashboard shows stored jobs immediately, then refreshes after the scan
- Real ATS confirmation emails from the dev inbox appear as cards in the Applied column
- The other five columns are present but empty
- Console logs emails fetched, emails matched, jobs created — no errors

**Watch out for:**
- Minimal styling only — an unstyled or barely-styled 6-column layout is fine. The real Kanban port from the mockup is week 5. Do not build the polished UI now.
- Do not add the modal, search bar, or summary pills. Stub Kanban only.
- The five empty columns are not a bug. Do not add fake data to fill them.

---

### Task 5 — Commit hygiene

**Do:**
- Commit each task after verification, in conventional-commit format (`feat:` / `fix:` / `docs:`), consistent with weeks 1–2
- Suggested commits: whitelist JSON; `classifier.js`; `storage.js`; dashboard stub Kanban
- Do not combine tasks into one blob commit

**Done when:**
- Git log shows four (or so) clean, atomic commits for week 3, each describing one verified milestone

---

## What's NOT in week 3 (push back if it creeps in)

- Gemini / LLM calls of any kind (week 4)
- `format=full` message body fetching (week 4)
- API key entry screen (week 4)
- LinkedIn email handling — needs sub-filtering, waits for Gemini (week 4)
- Real status detection / the state machine — every week-3 job is `Applied` (week 6)
- Ghosted timer logic (week 6)
- `company` / `role` / `recruiter.name` / `jobDescription` extraction (week 4 Gemini)
- The polished Kanban, job cards, modal, search, summary bar, settings drawer (week 5)
- On-open re-scan diffing — week 3 rebuilds the whole jobs array each scan; incremental re-scan is week 6
- Tailwind styling beyond minimal
- Tests
- Moving the fetch into the service worker (week 6)

---

## Open issues to surface back to me

Stop and ask before assuming on any of these:

1. **Match rate.** Once the classifier runs against the real dev inbox, report: emails fetched, how many matched the whitelist, how many distinct jobs (threads) resulted. This number tells us whether the starter whitelist is catching real applications or missing them.
2. **Whitelist gaps.** If you can see (from the dev inbox) obvious job-application emails that did NOT match — note the sender domains. They are candidates for the whitelist or confirmation that Gemini is doing real work in week 4.
3. **Anything in the spec marked [VERIFY] or [ITERATE]** that surfaces during the build.

---

## End-of-week checklist

Before declaring week 3 done:

- [ ] `src/lib/ats-whitelist.json` exists, valid JSON, LinkedIn intentionally excluded with a noted reason
- [ ] `src/lib/classifier.js` exists with `classifyEmail` and `buildJobsFromEmails`
- [ ] Subdomain matching works; `notgreenhouse.io` does not false-match
- [ ] `src/lib/storage.js` exists with `getJobs` / `saveJobs`
- [ ] `jobtrail.jobs` is written to `chrome.storage.local` after a scan (verified in DevTools)
- [ ] Stored jobs render instantly on reopen, before the re-scan completes
- [ ] Dashboard shows a 6-column stub Kanban; all jobs land in Applied; other columns empty
- [ ] Week-2 fetch, progress indicator, and 401/403/network/no-token error states still work
- [ ] Console logs fetched / matched / job counts, no errors
- [ ] Git history is clean — one atomic commit per task
- [ ] Match-rate numbers reported back (emails fetched / matched / jobs created)
- [ ] Any decisions made on open issues are logged to `MEMORY.md` with date, choice, reasoning, alternatives rejected

---

*End of week 3 kickoff brief.*

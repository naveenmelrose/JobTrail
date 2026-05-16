# JobTrail — Week 2 Kickoff Brief for Claude Code

> Hand this to Claude Code at the start of week 2. Companion documents (read in order):
> 1. `JobTrail-Project-Context.md` — what and why
> 2. `JobTrail-Build-Spec.md` — full technical spec
> 3. `MEMORY.md` — append-only decision log
> 4. This doc — week 2 task sequence
> Last updated: May 16, 2026

---

## Read these first

Before writing any code, read in this order:
1. `JobTrail-Project-Context.md` — full context, locked decisions
2. `JobTrail-Build-Spec.md` sections 8 (data model), 11 (scan behavior), 14 (week 2 row)
3. `MEMORY.md` — every dated entry, especially the May 16 "Week 2 architecture decisions locked" entry and the "Open watchpoints" section

Do not skip any of these. Locked decisions in the context doc and MEMORY.md must not be contradicted without flagging.

---

## Week 2 goal

**Fetch the last 30 days of Primary-tab Gmail messages and display them as a raw list in a stub dashboard page.**

That's the only deliverable. No classification (week 3). No Gemini (week 4). No Kanban columns, no styling beyond minimal, no modal (week 5). Resist scope creep.

### What "working" means at end of week 2
- Clicking the extension icon opens the popup; popup has an "Open JobTrail" button
- Clicking that button opens the dashboard in a new browser tab
- The dashboard page, on load, fetches the user's last 30 days of Primary-tab emails
- The dashboard renders a plain list/table: sender, subject, date, snippet — one row per email
- Console shows the fetched email count, no errors
- A clean error state shows if the token is missing/expired or the network fails

---

## Architecture decisions (already locked — do not re-litigate)

Resolved May 16, 2026 and logged in MEMORY.md. Listed here so they are not re-opened:

| # | Decision | Choice |
|---|---|---|
| 1 | Render surface | Dashboard tab (not popup). Popup is a launcher only. |
| 2 | Fetch location | Dashboard page directly. No service worker, no message passing in week 2. |
| 3 | Data depth | Sender + subject + date + Gmail snippet. No full message bodies. |
| 4 | Fetch strategy | Sequential `messages.get` calls. No batch requests in week 2. |

If any of these turns out to be wrong while building, stop and flag it — do not silently change course.

---

## Task sequence

Work through these in order. Each task has a clear "done when" checkpoint. Do not move to the next task until the current one is verified. Commit each task after verification, before starting the next (commit-as-you-go rule, locked May 12).

---

### Task 1 — Popup becomes a launcher

**Do:**
- Modify `src/popup/popup.jsx` so that, when signed in, the popup shows the signed-in email (as now) plus an "Open JobTrail" button
- The button calls `chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })`
- Keep all existing week 1 behavior: the `checking` / signed-in / `network-error` states, sign-in, sign-out
- Do not remove sign-in or sign-out — only add the launch button

**Done when:**
- Signed in → popup shows email + "Open JobTrail" button
- Clicking the button opens the dashboard page in a new tab
- Sign-in / sign-out still work across several cycles

**Watch out for:**
- The dashboard HTML path must match what `vite-plugin-web-extension` outputs in `dist/`. Verify the built path before hardcoding it.

---

### Task 2 — `src/lib/gmail.js`

**Do:**
- Create `src/lib/gmail.js` as pure logic (no React), exporting three functions:
  - `getToken()` — read the access token from `chrome.storage.local` key `jobtrail.token`; return null if absent
  - `listMessages({ query, maxResults })` — call `GET https://gmail.googleapis.com/gmail/v1/users/me/messages` with the `q` and `maxResults` params and a Bearer token; return the array of `{ id, threadId }` objects
  - `getMessageMetadata(messageId)` — call `GET https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}` with `format=metadata` and `metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`; return a normalized object `{ id, threadId, from, subject, date, snippet }`
- Query string for `listMessages` in week 2: `newer_than:30d -in:chats category:primary`
- `maxResults`: cap at 500 (locked in spec section 2). Note: Gmail's `messages.list` returns at most 100 per page — implement pagination via `nextPageToken` until 500 is reached or results run out.
- Each function should throw a typed/identifiable error on HTTP failure so the dashboard can distinguish 401 from 403 from network errors.

**Done when:**
- Calling `listMessages` from the dashboard returns real message IDs from the signed-in inbox
- Calling `getMessageMetadata` on one of those IDs returns a populated, normalized object
- Pagination works: an inbox with >100 Primary emails in 30 days returns more than 100 results

**Watch out for:**
- **Gmail's two-step fetch.** `messages.list` returns IDs only — no sender, subject, or snippet. Each ID needs a separate `messages.get` call. This is expected; it is in the spec watchpoints. Do not assume the list call returns content.
- The token from week 1 is an OAuth *access* token. It can be expired. A 401 here is normal and must be handled (see Task 4), not treated as a bug.
- `format=metadata` returns headers in an array of `{ name, value }` objects — the From/Subject/Date values must be pulled out by name, not by position.

---

### Task 3 — Dashboard page renders the raw list

**Do:**
- Build out `src/dashboard/Dashboard.jsx` (replacing the week 1 placeholder)
- On mount: call `getToken()`. If no token, show a "Not signed in — open the JobTrail popup to sign in" message and stop.
- If token present: call `listMessages` with the week 2 query, then loop the returned IDs **sequentially** calling `getMessageMetadata` for each
- Show a simple loading indicator with progress (e.g. "Loading 47 of 312…") while the sequential fetch runs
- Render results as a plain table or list: columns From / Subject / Date / Snippet — one row per email, most recent first
- Log the total fetched count to the console
- Minimal styling only — this is a stub. No Kanban, no columns, no cards. An unstyled table is acceptable.

**Done when:**
- Opening the dashboard tab triggers the fetch and shows a progress indicator
- The table populates with real Gmail data, newest first
- Console shows the total count, no errors

**Watch out for:**
- Sequential fetch of 300+ emails takes 8–15 seconds. The progress indicator is not optional — a blank page for 15 seconds looks broken.
- Do not fetch full message bodies. `format=metadata` only.

---

### Task 4 — Error handling

**Do:**
- Handle three failure cases in the dashboard:
  - **401 (token rejected/expired):** show "Your session expired. Open the JobTrail popup and sign in again." Do not try to refresh the token in week 2 — that flow stays in the popup.
  - **403 (quota / permission):** show "Gmail access was denied or quota was exceeded. Check the extension's permissions." Log the full error to console.
  - **Network error / other:** show a "Couldn't reach Gmail" message with a "Retry" button that re-runs the fetch.
- Errors must be distinguishable — reuse the typed errors thrown by `gmail.js` from Task 2.

**Done when:**
- Manually clearing `jobtrail.token` then opening the dashboard shows the "session expired" message, not a crash or blank page
- A simulated network failure shows the retry message, and Retry works

**Watch out for:**
- Do not clear the stored token on a 403 or a network error — only a 401 means the token itself is bad, and even then, token cleanup belongs to the popup flow (consistent with the week 1 "401-only cleanup" decision). In week 2 the dashboard just *reports* the 401; it does not clean up storage.

---

### Task 5 — Commit hygiene

**Do:**
- Commit each task after verification, in conventional-commit format (`feat:` / `fix:` / `docs:`), consistent with week 1 Task 6
- Suggested commits: popup launcher; `lib/gmail.js`; dashboard list; error handling
- Do not combine tasks into one blob commit

**Done when:**
- Git log shows four (or so) clean, atomic commits for week 2, each describing one verified milestone

---

## What's NOT in week 2 (push back if it creeps in)

- Classification of any kind — no ATS whitelist, no keyword matching (week 3)
- Gemini / LLM calls (week 4)
- Kanban columns, job cards, the modal, the settings drawer (week 5)
- Full message body fetching (week 3)
- Batch Gmail requests (deferred to week 6 — logged May 16)
- Moving the fetch into the service worker (deferred to week 6 — logged May 16)
- Writing the `jobtrail.jobs` data model to storage (week 3+; week 2 just displays, does not persist)
- Tailwind styling beyond minimal — the stub list can be ugly
- Tests
- On-open re-scan logic (week 6)

---

## Open issues to surface back to me

Stop and ask before assuming on any of these:

1. **Typical fetch volume.** Once the dashboard runs against a real inbox, report the actual count of Primary-tab emails in 30 days. This number informs the week 6 batch-vs-sequential revisit.
2. **Pagination behavior.** If the inbox returns close to or above 500, confirm the 500 cap behaves correctly and note it.
3. **Anything in the spec marked [VERIFY]** that surfaces during the build.

---

## End-of-week checklist

Before declaring week 2 done:

- [ ] Popup shows "Open JobTrail" button when signed in
- [ ] Button opens the dashboard in a new tab
- [ ] `src/lib/gmail.js` exists with `getToken`, `listMessages`, `getMessageMetadata`
- [ ] `listMessages` paginates correctly up to the 500 cap
- [ ] Dashboard fetches and renders sender / subject / date / snippet
- [ ] Progress indicator shows during the sequential fetch
- [ ] Console logs the total count, no errors
- [ ] 401, 403, and network-error states all show clean messages (no crash, no blank page)
- [ ] Retry button works
- [ ] Git history is clean — one atomic commit per task
- [ ] Any decisions made on open issues are logged to `MEMORY.md` with date, choice, reasoning, alternatives rejected
- [ ] Actual Primary-tab email count reported back (for the week 6 batch decision)

---

*End of week 2 kickoff brief.*

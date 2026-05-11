# JobTrail — Project Context

> Single source of truth. Read this first in any new chat.
> Last updated: May 11, 2026 — added Primary tab scan filter, on-open re-scan model, and Buy Me a Coffee monetization decision.

---

## 1. What this project is

A Chrome extension that auto-detects job applications from Gmail and tracks them on a Kanban dashboard. Built as a **learning project**, not a business. Free forever. Optional "Buy Me a Coffee" link in settings for users who want to support. No paywall, no premium tier.

**Name:** JobTrail (previously called InboxTrax — the v2 deck still uses old name pending feedback)
**Domain available:** jobtrail.net (not purchased yet, not a blocker)
**License:** MIT
**Open source:** Yes
**Status:** Pre-build. Mockup complete. Awaiting feedback from HR friends + brother + wife.

---

## 2. Locked product decisions

### Core features
- **Auto-detects job application emails** from Gmail
- **6-stage Kanban dashboard** (the main UI)
- **Click any card** → modal with email content, JD, action buttons
- **Search across all jobs**
- **Manual entry** for jobs that don't send confirmation emails
- **CSV export**
- **Ghosted detection** (30 days no reply, hardcoded in v1)
- **Buy Me a Coffee** link in settings (optional support, no paywall)

### The 6 stages
1. Applied
2. In Conversation
3. Interview Scheduled
4. Awaiting Outcome
5. Offer / Rejected / Withdrawn (terminal — same column visually)
6. Ghosted (side state, auto after 30 days)

### Status flow rules
- Stages can move forward or backward
- Follow-up interview → goes back to Interview Scheduled
- Ghosted is temporary — recruiter resurfacing moves card back to active stage
- Rejected/Offer/Withdrawn are terminal

### What got CUT from v1
- Phase indicators (Early/Mid/Late within In Conversation)
- Status audit history
- Sub-states / activity labels
- Days-active traffic light dots
- Multi-account support
- Cross-thread linking (one Gmail thread = one job, period)
- Configurable ghosted threshold (locked at 30, slider in v2)
- Recruiter cold-outreach detection (skip — user didn't apply)
- "Are you free Tuesday?" interview parsing (calendar invite required)

---

## 3. Architecture (locked)

- **Chrome extension only** — no backend, no servers
- **Local storage** (`chrome.storage.local`) — source of truth is Gmail itself
- **Re-scan rebuilds state** if data is lost — no backup needed in v1
- **BYO API key** — user brings their own Google Gemini key (free tier)
- **API key stored locally** — not synced across devices
- **No costs to developer** — runs purely on user's resources
- **Read-only Gmail access** — never writes, deletes, or modifies

### Detection logic
- **Hybrid classification:** ATS domain whitelist (Greenhouse, Lever, Ashby, Workday, etc.) auto-accepts; non-whitelist domains → LLM checks
- **Gmail Primary tab only** on initial and re-scans. Skip Promotions/Social/Updates/Forums. Disclosed to user in onboarding + settings.
- **What counts as Applied:** ATS confirmation emails only. Skip cold outreach, vague LinkedIn alerts, job digests.
- **What counts as Rejected:** Explicit "moving forward with other candidates" language
- **What counts as Interview Scheduled:** Explicit calendar invite only
- **User's own outbound replies** count as activity (resets ghosted timer)

### Scan behavior
- **Default window:** Last 30 days on first install
- **Cap:** Max 500 emails on initial scan (covers 99% of users)
- **First-run experience:** Pre-filled dashboard (sells the magic)
- **Re-scan trigger:** On-open only. Extension checks Gmail for new emails when user opens the dashboard. No background polling, no scheduled scans.

---

## 4. Brand

- **Color palette:** Coral (`#F96167`) + cream + navy (`#2F3C7E`)
- **Tone:** Friendly and direct
- **Logo:** Inbox icon on coral rounded square (placeholder — not finalized)
- **Tagline:** "Stop tracking job applications. Connect Gmail. Done."

---

## 5. Build plan (8 weeks for Phase 1A, 4 more for Phase 1B)

### Phase 1A (weeks 1–8): Dashboard + drill-in, NO calendar
| Week | Focus |
|---|---|
| 1 | Chrome extension scaffold + Gmail OAuth |
| 2 | Fetch emails, display raw list |
| 3 | Regex-based whitelist classification |
| 4 | Gemini integration, BYO key flow |
| 5 | Dashboard UI (Kanban, 6 columns) |
| 6 | Status detection logic + state machine |
| 7 | Drill-in modal + Gmail link integration |
| 8 | Polish, edge cases, ship to Chrome Web Store |

### Phase 1B (weeks 9–12): Add calendar sync
- Calendar API integration
- Interview Scheduled → Awaiting Outcome auto-transition

### Tools
- **Chrome chat:** discussion, planning, decks, mockups
- **Claude Code:** real Chrome extension build (once feedback validates)
- **Stack:** JavaScript + Chrome Manifest V3 + React + Tailwind (TBD)

---

## 6. User profile

- **Coding background:** Works across SDLC, doesn't read code
- **Time available:** 3 months, slow pace, no rush
- **Network:** HR friends in India (useful for amplification, not customer base)
- **Goal:** Learning project + portfolio piece; potential monetization later (only if traction)
- **Preference:** Hates marketing right now; OK with passive distribution only

---

## 7. What's NOT discussed in non-technical materials

When making decks or content for HR friends / brother / wife:
- Skip API costs, revenue, pricing
- Skip MIT license, open source mechanics
- Skip Chrome extension architecture details
- Use plain language: "AI helper" not "LLM," "long code" not "API key," "Connect" not "OAuth"

---

## 8. Current state

- **Deck v1 (`TrackedIn-Flow.pptx`):** 12 slides, original 4-state flow, 3 UI options shown. Outdated. Don't reference.
- **Deck v2 (`InboxTrax-Flow-v2.pptx`):** 11 slides, 6-stage flow, dashboard locked, BYO key explained. Still says "InboxTrax" — will rebuild as JobTrail after feedback batch.
- **Mockup (`JobTrail-Mockup.html`):** Clickable HTML prototype. Single file. Walks through full onboarding → dashboard → modal → settings. **This is the artifact being shared for feedback right now.**

---

## 9. Open items / waiting on

- Feedback from HR friends, brother, wife on the mockup
- Then: deck rebuild as JobTrail with any changes from feedback
- Then: decision to actually start coding in Claude Code

---

## 10. Watchpoints for feedback

When feedback returns, look for signals on:
1. **Did step 3 (AI helper) feel scary or normal?** Highest-friction step.
2. **Are the 6 stages clear, or confused?** Especially In Conversation vs Interview Scheduled vs Awaiting Outcome.
3. **Is the drill-in modal info useful, excessive, or insufficient?**
4. **Does privacy story land or feel like spin?**
5. **Would they actually install this?** (Vs just "this is nice")
6. **What's missing?** Open-ended catches.

Three+ people flagging same concern = real signal. Single-person opinions = filter, don't blindly follow.

---

## 11. Key principles to maintain

- **Simplicity wherever possible**
- **No marketing pressure** — passive distribution only
- **Friendly and direct voice** — never corporate, never overly cute
- **Privacy story bulletproof** — never compromise this
- **Learning over revenue** — the project exists to learn, not to earn
- **Honest pushback always welcome** — Claude should challenge user, not just agree

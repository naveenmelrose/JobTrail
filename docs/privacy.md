# JobTrail — Privacy Policy

**Last updated: May 17, 2026**

JobTrail is a Chrome extension that helps you track your job applications by
reading job-related emails in your Gmail inbox. This policy explains, in plain
language, exactly what data JobTrail touches, where that data lives, and what
JobTrail does *not* do.

The short version: **your data never leaves your own computer and your own
Google account. JobTrail has no servers, collects nothing, and sends nothing to
its developer.**

---

## Who runs JobTrail

JobTrail is a free, open-source project built and maintained by Naveen George.

- **Contact:** naveenmelrose@gmail.com
- **Source code:** https://github.com/naveenmelrose/JobTrail
- **License:** MIT (open source — anyone can inspect or audit the code)

JobTrail is not a company. There is no business behind it, no investors, and no
revenue model. It is a personal project provided free of charge.

---

## What data JobTrail accesses

JobTrail asks for permission to access two things from your Google account:

1. **Read-only access to your Gmail messages** (`gmail.readonly`). JobTrail
   reads the emails in your inbox to find job-application-related messages —
   application confirmations, recruiter replies, and similar. It reads the
   sender, subject, date, and content of those emails.

2. **Your email address** (`userinfo.email`). JobTrail uses this only to label
   which account is signed in.

JobTrail requests **read-only** access. It cannot send, delete, modify, or
write anything in your Gmail. That is a technical limitation of the permission
itself, not just a promise — the access JobTrail is granted does not include
the ability to change your mailbox in any way.

---

## What JobTrail does NOT do

- **No servers.** JobTrail has no backend, no database, and no cloud
  infrastructure. There is nowhere for your data to be sent, because no such
  place exists.
- **No data sent to the developer.** The developer of JobTrail never receives,
  sees, or stores any of your emails, your job applications, your email
  address, or anything else.
- **No analytics or tracking.** JobTrail contains no telemetry, no usage
  analytics, no crash reporting, and no third-party tracking of any kind.
- **No selling or sharing of data.** JobTrail does not sell, rent, share, or
  transfer your data to anyone. There is no advertising.
- **No account creation.** JobTrail does not create an account for you. You
  sign in with your existing Google account; that is all.

---

## Where your data is stored

Everything JobTrail produces — your tracked job applications, their statuses,
and your settings — is stored **locally on your own computer**, inside your
browser, using Chrome's built-in extension storage (`chrome.storage.local`).

This data:

- Stays on the device where you installed JobTrail
- Is not synced to other devices
- Is not backed up anywhere by JobTrail
- Is removed when you uninstall the extension

If this local data is ever lost, JobTrail can rebuild it by re-reading your
Gmail. Your Gmail inbox is the only real source of truth — JobTrail keeps no
separate copy anywhere else.

---

## The AI classification feature (your own AI key)

JobTrail uses Google's Gemini AI to help identify which emails are job-related.
This works on a **bring-your-own-key** basis:

- You create your own free Google Gemini API key, in your own Google account.
- That key is stored locally on your computer, inside Chrome's extension
  storage, alongside your other JobTrail data.
- When JobTrail needs the AI to classify an email, the email content is sent
  **directly from your browser to Google's Gemini service**, using your own
  key. The request goes from you to Google and back to you.
- The developer of JobTrail is **not** part of this exchange. JobTrail has no
  shared or central AI key. Your AI usage runs entirely on your own Google
  account and your own quota.

When you use the Gemini API, Google's handling of that data is governed by
Google's own terms and privacy policy for the Gemini API, not by JobTrail.
JobTrail simply passes your email content to the Google service you have chosen
to connect, using the key you provided.

---

## What information leaves your browser, and where it goes

To be fully transparent, here is every external destination JobTrail
communicates with:

| Destination | What is sent | Why |
|---|---|---|
| Google (Gmail API) | Your sign-in token | To read your job-related emails, read-only |
| Google (Gemini API) | Email content, using *your* AI key | To classify whether an email is job-related |

JobTrail communicates with **no other destinations**. In particular, it never
communicates with any server controlled by the developer, because no such
server exists.

---

## How to revoke JobTrail's access

You are in control at all times. You can remove JobTrail's access whenever you
want:

- **Revoke Gmail access:** Go to your Google Account → Security → Third-party
  apps with account access, find JobTrail, and remove it. This immediately
  cuts off JobTrail's ability to read your Gmail.
- **Remove the extension:** Uninstall JobTrail from `chrome://extensions`. This
  deletes all of JobTrail's locally stored data from your computer.

Uninstalling the extension and revoking access together leave no trace of
JobTrail's data anywhere.

---

## Children's privacy

JobTrail is intended for adults conducting a job search. It is not directed at
children and does not knowingly collect any information from anyone.

---

## Changes to this policy

If this privacy policy changes, the updated version will be posted at this same
page, with a new "Last updated" date at the top. Because JobTrail is open
source, the full history of any changes is also visible in the project's public
code repository.

---

## Questions

If anything in this policy is unclear, or you have a privacy concern, contact:
**naveenmelrose@gmail.com**

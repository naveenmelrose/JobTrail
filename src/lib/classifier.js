import whitelist from './ats-whitelist.json' with { type: 'json' };

const ENTRIES = whitelist.entries;

export function extractDomain(fromHeader) {
  if (!fromHeader || typeof fromHeader !== 'string') return null;
  const angleMatch = fromHeader.match(/<([^>]+)>/);
  const address = (angleMatch ? angleMatch[1] : fromHeader).trim();
  const atIdx = address.lastIndexOf('@');
  if (atIdx === -1 || atIdx === address.length - 1) return null;
  const tail = address.slice(atIdx + 1).trim().toLowerCase();
  const domain = tail.split(/[\s>,;]/)[0];
  return domain || null;
}

export function extractEmailAddress(fromHeader) {
  if (!fromHeader || typeof fromHeader !== 'string') return null;
  const angleMatch = fromHeader.match(/<([^>]+)>/);
  const candidate = (angleMatch ? angleMatch[1] : fromHeader).trim().toLowerCase();
  return candidate.includes('@') ? candidate : null;
}

function domainMatches(senderDomain, listedDomain) {
  if (senderDomain === listedDomain) return true;
  return senderDomain.endsWith('.' + listedDomain);
}

export function classifyEmail(email) {
  const domain = extractDomain(email?.from);
  if (!domain) return { isJobApplication: false, source: null };
  for (const entry of ENTRIES) {
    for (const listed of entry.domains) {
      if (domainMatches(domain, listed.toLowerCase())) {
        return { isJobApplication: true, source: entry.name };
      }
    }
  }
  return { isJobApplication: false, source: null };
}

function toIso(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function timestamp(dateStr) {
  if (!dateStr) return NaN;
  return new Date(dateStr).getTime();
}

export function buildJobsFromEmails(emails) {
  if (!Array.isArray(emails)) return [];

  const byThread = new Map();

  for (const email of emails) {
    if (!email || !email.threadId) continue;
    const { isJobApplication, source } = classifyEmail(email);
    if (!isJobApplication) continue;
    if (!byThread.has(email.threadId)) {
      byThread.set(email.threadId, { emails: [], source });
    }
    byThread.get(email.threadId).emails.push(email);
  }

  const jobs = [];
  for (const [threadId, { emails: threadEmails, source }] of byThread) {
    const sorted = [...threadEmails].sort((a, b) => {
      const ta = timestamp(a.date);
      const tb = timestamp(b.date);
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    });
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    jobs.push({
      id: crypto.randomUUID(),
      threadId,
      status: 'Applied',
      appliedAt: toIso(earliest.date),
      lastActivityAt: toIso(latest.date),
      latestEmail: {
        messageId: latest.id,
        subject: latest.subject,
        snippet: latest.snippet,
        receivedAt: toIso(latest.date),
      },
      recruiter: {
        name: null,
        email: extractEmailAddress(latest.from),
      },
      source,
      company: null,
      role: null,
      jobDescription: null,
      statusUpdatedAt: null,
      userNotes: '',
      isManual: false,
      isGhosted: false,
      ghostedAt: null,
    });
  }

  return jobs;
}

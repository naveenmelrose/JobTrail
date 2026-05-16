const TOKEN_STORAGE_KEY = 'jobtrail.token';
const GMAIL_MESSAGES_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const PAGE_SIZE = 100;

export class GmailApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = 'GmailApiError';
    this.status = status;
    if (cause) this.cause = cause;
  }
}

export async function getToken() {
  const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
  return result[TOKEN_STORAGE_KEY] ?? null;
}

async function authedFetch(url, token) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new GmailApiError('Network error contacting Gmail.', { cause: err });
  }

  if (!response.ok) {
    throw new GmailApiError(
      `Gmail API ${response.status} ${response.statusText}`,
      { status: response.status },
    );
  }

  try {
    return await response.json();
  } catch (err) {
    throw new GmailApiError('Failed to parse Gmail response as JSON.', { cause: err });
  }
}

export async function listMessages({ query, maxResults }) {
  const token = await getToken();
  if (!token) {
    throw new GmailApiError('No Gmail token in local storage.', { status: 401 });
  }

  const collected = [];
  let pageToken;

  while (collected.length < maxResults) {
    const remaining = maxResults - collected.length;
    const pageSize = Math.min(PAGE_SIZE, remaining);

    const params = new URLSearchParams({
      q: query,
      maxResults: String(pageSize),
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await authedFetch(`${GMAIL_MESSAGES_URL}?${params}`, token);
    const batch = data.messages ?? [];
    for (const m of batch) {
      collected.push({ id: m.id, threadId: m.threadId });
    }

    pageToken = data.nextPageToken;
    if (!pageToken || batch.length === 0) break;
  }

  return collected.slice(0, maxResults);
}

export async function getMessageMetadata(messageId) {
  const token = await getToken();
  if (!token) {
    throw new GmailApiError('No Gmail token in local storage.', { status: 401 });
  }

  const params = new URLSearchParams({ format: 'metadata' });
  params.append('metadataHeaders', 'From');
  params.append('metadataHeaders', 'Subject');
  params.append('metadataHeaders', 'Date');

  const data = await authedFetch(`${GMAIL_MESSAGES_URL}/${messageId}?${params}`, token);

  const headers = data.payload?.headers ?? [];
  const headerByName = (name) => {
    const lower = name.toLowerCase();
    const match = headers.find((h) => h.name?.toLowerCase() === lower);
    return match?.value ?? null;
  };

  return {
    id: data.id,
    threadId: data.threadId,
    from: headerByName('From'),
    subject: headerByName('Subject'),
    date: headerByName('Date'),
    snippet: data.snippet ?? '',
  };
}

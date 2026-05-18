import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import { getToken, listMessages, getMessageMetadata } from '../lib/gmail.js';
import { classifyEmail, buildJobsFromEmails } from '../lib/classifier.js';
import { getJobs, saveJobs } from '../lib/storage.js';

const SCAN_QUERY = 'newer_than:30d -in:chats category:primary';
const SCAN_CAP = 500;
const SCAN_WINDOW_DAYS = 30;

const COLUMNS = [
  'Applied',
  'In Conversation',
  'Interview Scheduled',
  'Awaiting Outcome',
  'Offer / Rejected',
  'Ghosted',
];

const STATUS_TO_COLUMN = {
  Applied: 'Applied',
};

function formatDate(raw) {
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}

function JobCard({ job }) {
  return (
    <div className="border border-gray-200 rounded p-2 mb-2 bg-white text-sm">
      <div className="font-medium text-navy">{job.source}</div>
      <div className="text-gray-800 mt-1" title={job.latestEmail?.subject ?? ''}>
        {job.latestEmail?.subject || '(no subject)'}
      </div>
      <div className="text-xs text-gray-500 mt-1 break-all">
        {job.recruiter?.email ?? ''}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {formatDate(job.lastActivityAt)}
      </div>
    </div>
  );
}

function KanbanColumn({ title, jobs }) {
  return (
    <section className="bg-cream rounded p-2 min-h-[200px] flex flex-col">
      <h2 className="text-sm font-semibold text-navy mb-2">
        {title} <span className="text-gray-500 font-normal">({jobs.length})</span>
      </h2>
      <div className="flex-1">
        {jobs.map((j) => <JobCard key={j.id} job={j} />)}
      </div>
    </section>
  );
}

function Kanban({ jobs }) {
  const byColumn = Object.fromEntries(COLUMNS.map((c) => [c, []]));
  for (const job of jobs) {
    const col = STATUS_TO_COLUMN[job.status];
    if (col) byColumn[col].push(job);
  }
  return (
    <div className="grid grid-cols-6 gap-3 mt-4">
      {COLUMNS.map((title) => (
        <KanbanColumn key={title} title={title} jobs={byColumn[title]} />
      ))}
    </div>
  );
}

function ScanBanner({ scanStatus, progress }) {
  if (scanStatus === 'listing') {
    return <p className="text-sm mt-2 text-gray-600">Finding emails…</p>;
  }
  if (scanStatus === 'fetching') {
    return (
      <p className="text-sm mt-2 text-gray-600">
        Loading {progress.current} of {progress.total}…
      </p>
    );
  }
  return null;
}

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({});
  const [scanStatus, setScanStatus] = useState('init');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    const stored = await getJobs();
    setJobs(stored.jobs);
    setMeta(stored.meta);
    runScan();
  }

  async function runScan() {
    setErrorMessage(null);

    const token = await getToken();
    if (!token) {
      setScanStatus('signed-out');
      return;
    }

    try {
      setScanStatus('listing');
      const ids = await listMessages({ query: SCAN_QUERY, maxResults: SCAN_CAP });

      setScanStatus('fetching');
      setProgress({ current: 0, total: ids.length });

      const fetched = [];
      for (let i = 0; i < ids.length; i++) {
        const emailMeta = await getMessageMetadata(ids[i].id);
        fetched.push(emailMeta);
        setProgress({ current: i + 1, total: ids.length });
      }

      const matchedCount = fetched.filter((e) => classifyEmail(e).isJobApplication).length;
      const newJobs = buildJobsFromEmails(fetched);

      console.log(
        `[JobTrail] Fetched ${fetched.length} emails, ${matchedCount} matched whitelist, ${newJobs.length} jobs created.`,
      );

      const newMeta = {
        ...meta,
        lastScanAt: new Date().toISOString(),
        scanWindowDays: SCAN_WINDOW_DAYS,
        apiKeyPresent: false,
      };

      await saveJobs({ jobs: newJobs, meta: newMeta });
      setJobs(newJobs);
      setMeta(newMeta);
      setScanStatus('ready');
    } catch (err) {
      if (err?.status === 401) {
        console.warn('[JobTrail] Gmail rejected the token (401).', err);
        setScanStatus('error-auth');
      } else if (err?.status === 403) {
        console.error('[JobTrail] Gmail returned 403 (permission/quota).', err);
        setErrorMessage(err.message);
        setScanStatus('error-quota');
      } else {
        console.error('[JobTrail] Network or unknown error during scan.', err);
        setErrorMessage(err?.message ?? 'Unknown error');
        setScanStatus('error-network');
      }
    }
  }

  if (scanStatus === 'init') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">Loading…</p>
      </main>
    );
  }

  if (scanStatus === 'signed-out') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">
          Not signed in — open the JobTrail popup (click the extension icon) to sign in.
        </p>
      </main>
    );
  }

  if (scanStatus === 'error-auth') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">
          Your session expired. Open the JobTrail popup and sign in again.
        </p>
      </main>
    );
  }

  if (scanStatus === 'error-quota') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">
          Gmail access was denied or quota was exceeded. Check the extension's permissions.
        </p>
        {errorMessage && (
          <p className="text-sm mt-2" style={{ color: '#b91c1c' }}>{errorMessage}</p>
        )}
      </main>
    );
  }

  if (scanStatus === 'error-network') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">Couldn't reach Gmail.</p>
        {errorMessage && (
          <p className="text-sm mt-2" style={{ color: '#b91c1c' }}>{errorMessage}</p>
        )}
        <button
          type="button"
          onClick={runScan}
          className="mt-3 px-4 py-2 rounded bg-coral text-white font-medium"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
      <p className="text-sm mt-1 text-gray-600">
        {jobs.length} job{jobs.length === 1 ? '' : 's'} tracked.
      </p>
      <ScanBanner scanStatus={scanStatus} progress={progress} />
      <Kanban jobs={jobs} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Dashboard />);

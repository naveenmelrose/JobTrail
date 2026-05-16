import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import { getToken, listMessages, getMessageMetadata } from '../lib/gmail.js';

const SCAN_QUERY = 'newer_than:30d -in:chats category:primary';
const SCAN_CAP = 500;

function formatDate(raw) {
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}

function Dashboard() {
  const [status, setStatus] = useState('checking');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    runScan();
  }, []);

  async function runScan() {
    setStatus('checking');
    setRows([]);
    setProgress({ current: 0, total: 0 });

    const token = await getToken();
    if (!token) {
      setStatus('signed-out');
      return;
    }

    setStatus('listing');
    const ids = await listMessages({ query: SCAN_QUERY, maxResults: SCAN_CAP });

    setStatus('fetching');
    setProgress({ current: 0, total: ids.length });

    const fetched = [];
    for (let i = 0; i < ids.length; i++) {
      const meta = await getMessageMetadata(ids[i].id);
      fetched.push(meta);
      setProgress({ current: i + 1, total: ids.length });
    }

    console.log(`[JobTrail] Fetched ${fetched.length} messages.`);
    setRows(fetched);
    setStatus('ready');
  }

  if (status === 'checking') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">Loading…</p>
      </main>
    );
  }

  if (status === 'signed-out') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">
          Not signed in — open the JobTrail popup (click the extension icon) to sign in.
        </p>
      </main>
    );
  }

  if (status === 'listing') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">Finding emails…</p>
      </main>
    );
  }

  if (status === 'fetching') {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
        <p className="text-sm mt-2">
          Loading {progress.current} of {progress.total}…
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
      <p className="text-sm mt-2">{rows.length} message{rows.length === 1 ? '' : 's'} fetched.</p>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">From</th>
            <th className="py-2 pr-4">Subject</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2">Snippet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b align-top">
              <td className="py-2 pr-4 break-all">{row.from}</td>
              <td className="py-2 pr-4">{row.subject}</td>
              <td className="py-2 pr-4 whitespace-nowrap">{formatDate(row.date)}</td>
              <td className="py-2 text-gray-600">{row.snippet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Dashboard />);

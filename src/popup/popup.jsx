import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import './popup.css';

const TOKEN_STORAGE_KEY = 'jobtrail.token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const DASHBOARD_PATH = 'src/dashboard/index.html';

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL(DASHBOARD_PATH) });
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!token) {
        reject(new Error('No token returned from chrome.identity.'));
        return;
      }
      resolve(token);
    });
  });
}

async function fetchEmail(token) {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    const err = new Error('Token rejected by Google (401).');
    err.isAuthError = true;
    throw err;
  }
  if (!response.ok) {
    throw new Error(`userinfo request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.email) {
    throw new Error('userinfo response did not include an email.');
  }
  return data.email;
}

async function clearStoredToken(token) {
  if (token) {
    try {
      await chrome.identity.removeCachedAuthToken({ token });
    } catch (err) {
      console.warn('[JobTrail] removeCachedAuthToken failed:', err);
    }
  }
  await chrome.storage.local.remove(TOKEN_STORAGE_KEY);
}

function Popup() {
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    verifyStoredToken();
  }, []);

  async function verifyStoredToken() {
    setStatus('checking');
    setErrorMessage(null);
    let token;
    try {
      const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
      token = result[TOKEN_STORAGE_KEY];
    } catch (err) {
      console.error('[JobTrail] storage read failed:', err);
      setStatus('signed-out');
      return;
    }

    if (!token) {
      setStatus('signed-out');
      return;
    }

    try {
      const userEmail = await fetchEmail(token);
      setEmail(userEmail);
      setStatus('signed-in');
    } catch (err) {
      if (err.isAuthError) {
        console.warn('[JobTrail] stored token rejected, clearing:', err);
        await clearStoredToken(token);
        setEmail(null);
        setErrorMessage('Your previous sign-in expired. Please sign in again.');
        setStatus('signed-out');
      } else {
        console.error('[JobTrail] userinfo verification failed:', err);
        setErrorMessage(err.message);
        setStatus('network-error');
      }
    }
  }

  async function handleSignIn() {
    setStatus('signing-in');
    setErrorMessage(null);

    try {
      const token = await getAuthToken();
      const userEmail = await fetchEmail(token);
      await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
      setEmail(userEmail);
      setStatus('signed-in');
    } catch (err) {
      console.error('[JobTrail] Sign-in failed:', err);
      setErrorMessage(err.message || 'Sign-in failed. See console for details.');
      setStatus('signed-out');
    }
  }

  async function handleSignOut() {
    try {
      const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
      const token = result[TOKEN_STORAGE_KEY];
      await clearStoredToken(token);
    } catch (err) {
      console.error('[JobTrail] Sign-out failed:', err);
    }
    setEmail(null);
    setErrorMessage(null);
    setStatus('signed-out');
  }

  if (status === 'checking') {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold text-navy">JobTrail</h1>
        <p className="text-sm mt-2">Loading…</p>
      </main>
    );
  }

  if (status === 'signed-in') {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold text-navy">JobTrail</h1>
        <p className="text-sm mt-2">Signed in as</p>
        <p className="text-sm font-medium mt-1 break-all">{email}</p>
        <button
          type="button"
          onClick={openDashboard}
          className="mt-4 px-4 py-2 rounded bg-coral text-white font-medium"
        >
          Open JobTrail
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 ml-3 text-sm underline text-navy"
        >
          Sign out
        </button>
      </main>
    );
  }

  if (status === 'network-error') {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold text-navy">JobTrail</h1>
        <p className="text-sm mt-2">Couldn't verify your sign-in.</p>
        <p className="text-sm mt-1" style={{ color: '#b91c1c' }}>{errorMessage}</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={verifyStoredToken}
            className="px-4 py-2 rounded bg-coral text-white font-medium"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm underline text-navy"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold text-navy">JobTrail</h1>
      <p className="text-sm mt-2">Connect your Gmail to start tracking job applications.</p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={status === 'signing-in'}
        className="mt-3 px-4 py-2 rounded bg-coral text-white font-medium disabled:opacity-50"
      >
        {status === 'signing-in' ? 'Signing in…' : 'Sign in with Google'}
      </button>
      {errorMessage && status === 'signed-out' && (
        <p className="text-sm mt-3" style={{ color: '#b91c1c' }}>
          {errorMessage}
        </p>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Popup />);

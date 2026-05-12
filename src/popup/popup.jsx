import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import './popup.css';

function Popup() {
  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold text-navy">JobTrail</h1>
      <p className="text-sm mt-2">Popup placeholder — OAuth wiring lands in week 1 task 4.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Popup />);

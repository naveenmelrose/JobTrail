import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';

function Dashboard() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-navy">JobTrail Dashboard</h1>
      <p className="text-sm mt-2">Placeholder. Real Kanban arrives in week 5.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Dashboard />);

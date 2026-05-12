import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';

function Onboarding() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-navy">Welcome to JobTrail</h1>
      <p className="text-sm mt-2">Placeholder. Real onboarding flow arrives later.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Onboarding />);

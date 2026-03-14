"use client";
import React from 'react';
import Sidebar from '../student/components/Sidebar';
import { auth, logout } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function HistoryPage() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
  }, []);

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <Sidebar user={user} onLogout={logout} onFeatureUnavailable={() => alert('Phase 2 🚧')} />
      <main className="flex-1 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-sage-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sage-400 mb-6">
          <span className="material-symbols-outlined text-4xl">history</span>
        </div>
        <h1 className="text-3xl font-black mb-4">Worship History</h1>
        <p className="text-sage-500 max-w-md">Your spiritual journey logs are being compiled. Detailed historical charts will be available in Phase 2.</p>
        <button onClick={() => window.history.back()} className="mt-8 px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-transform">Go Back</button>
      </main>
    </div>
  );
}

"use client";
import React from 'react';
import Sidebar from '../student/components/Sidebar';
import { auth, logout } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProfilePage() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
  }, []);

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <Sidebar user={user} onLogout={logout} onFeatureUnavailable={() => alert('Phase 2 🚧')} />
      <main className="flex-1 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-sage-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 flex items-center justify-center">
           {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
              <span className="material-symbols-outlined text-4xl text-sage-400">person</span>
           )}
        </div>
        <h1 className="text-3xl font-black mb-2">{user?.displayName || 'Student Profile'}</h1>
        <p className="text-sage-500 mb-8">{user?.email || 'Ramadan VibeTracker User'}</p>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 w-full max-w-md text-left">
           <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-sage-400">Account Settings</h3>
           <p className="text-sm">Profile editing and account customization will be available soon.</p>
        </div>
        <button onClick={() => window.history.back()} className="mt-8 px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-transform">Go Back</button>
      </main>
    </div>
  );
}

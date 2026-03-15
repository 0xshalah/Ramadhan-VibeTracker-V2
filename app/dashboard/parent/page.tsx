"use client";

import React, { useEffect, useState } from 'react';
import { auth, getUserProfile, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return; }
      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'parent') {
        router.push('/dashboard/student');
        return;
      }
      setParentName(profile.displayName || u.displayName || 'Parent');
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Assalamu'alaikum, {parentName.split(' ')[0]}!</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Parent Observer Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-[18px]">home</span>
          </Link>
          <button onClick={logout} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-indigo-400 text-3xl">family_restroom</span>
        </div>
        <h2 className="text-2xl font-black mb-3">Parent Observer Mode</h2>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
          This dashboard will allow parents to monitor their children's spiritual progress in real-time. Connect your account to your child's profile to begin observing.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold">
          <span className="material-symbols-outlined text-[16px]">construction</span>
          Child linking feature coming in Phase 2
        </div>
      </div>
    </div>
  );
}

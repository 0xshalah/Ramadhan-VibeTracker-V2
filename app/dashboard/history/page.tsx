"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';

type HistoryEntry = {
  dateId: string;
  tilawah: number;
  prayersCompleted: number;
  earnedXP: number;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const ref = collection(db, 'users', u.uid, 'daily_progress');
        const q = query(ref, orderBy('dateId', 'desc'), limit(30));
        const snap = await getDocs(q);
        const data: HistoryEntry[] = snap.docs.map(d => {
          const raw = d.data();
          return {
            dateId: raw.dateId || d.id,
            tilawah: raw.tilawah || 0,
            prayersCompleted: raw.prayersCompleted || 0,
            earnedXP: raw.earnedXP || 0,
          };
        });
        setEntries(data);
      } catch (err) {
        // silently fail
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <nav className="flex items-center gap-4 mb-10">
        <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Worship Journal</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Last 30 Days</p>
        </div>
      </nav>

      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
          <p className="text-slate-400 mt-4">Loading your journal...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">history_edu</span>
          <h3 className="text-xl font-bold mb-2">No entries yet</h3>
          <p className="text-slate-400">Complete your first day of worship to begin your journal.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-3">
          {entries.map((entry) => (
            <div key={entry.dateId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-slate-700 transition-all">
              <div>
                <h3 className="font-bold text-white">{entry.dateId}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-emerald-400">mosque</span> {entry.prayersCompleted}/5 Prayers</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-indigo-400">auto_stories</span> {entry.tilawah} pages</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-amber-400">{entry.earnedXP}</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase">XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

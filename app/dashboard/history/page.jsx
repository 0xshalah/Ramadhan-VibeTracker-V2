"use client";
import React, { useEffect, useState } from 'react';
import { getWorshipHistory, auth, logout } from '@/lib/firebase';
import Sidebar from '../student/components/Sidebar';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const data = await getWorshipHistory(u.uid);
        setHistory(data);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Sidebar Sync */}
      <Sidebar user={user} onLogout={logout} totalXP={history.reduce((acc, obj) => acc + (obj.earnedXP || 0), 0)} />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">Jurnal Spiritual</h1>
          <p className="text-sage-500">Rekam jejak ibadah harian Anda yang tidak akan pernah hilang.</p>
        </header>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-sage-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sage-400 mx-auto mb-6">
               <span className="material-symbols-outlined text-4xl">history</span>
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat tercatat</h3>
            <p className="text-sm text-sage-500">Mulai catat ibadah Anda hari ini di Dashboard.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {history.map(day => {
               const prayersDone = day.sholat ? Object.values(day.sholat).filter(v => v).length : 0;
               return (
              <div key={day.dateId} className="bg-white dark:bg-slate-900 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow gap-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span> {day.dateId}
                  </h4>
                  <p className="text-sm text-sage-500 italic">"Alhamdulillah, progres tercatat dan diamankan."</p>
                </div>
                <div className="flex gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-center flex flex-col items-center">
                    <span className="block font-black text-emerald-500 text-xl">{prayersDone}/5</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sholat</span>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <span className="block font-black text-amber-500 text-xl">{day.tilawah || 0}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Hlm Tilawah</span>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <span className="block font-black text-indigo-500 text-xl">+{day.earnedXP || 0}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Vibe Points</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import { getLeaderboardLive } from '@/lib/firebase';
import Link from 'next/link';
import type { UserProfile } from '@/lib/schemas';

type LeaderboardEntry = UserProfile & { uid: string };

export default function LeaderboardPage() {
  const { user, totalXP } = useVibeStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getLeaderboardLive((data) => {
      setEntries(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Determine current user's rank
  const myRank = entries.findIndex(e => e.uid === user?.uid) + 1;
  const myRankText = myRank > 0 ? `#${myRank}` : '#—';

  // Split into podium (top 3) and rest
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Helper to calculate total XP from dailyXP map or totalXP field
  const getXP = (entry: LeaderboardEntry): number => {
    if (typeof entry.totalXP === 'number') return entry.totalXP;
    if (entry.dailyXP && typeof entry.dailyXP === 'object') {
      return Object.values(entry.dailyXP).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
    }
    return 0;
  };

  const formatXP = (xp: number): string => {
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
    return String(xp);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pb-24 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .winner-glow { box-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
        .glass-effect { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      `}} />
      
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Hall of Faith</h1>
            <p className="text-xs text-emerald-500 font-medium tracking-widest uppercase">Ramadhan 1445H</p>
          </div>
        </div>
      </nav>

      <header className="pt-12 pb-8 text-center">
        <div className="inline-block p-4 rounded-full bg-emerald-500/10 mb-6">
           <span className="material-symbols-outlined text-4xl text-yellow-500">emoji_events</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Global Leaderboard</h2>
        <p className="text-slate-400 text-lg">Celebrating the top believers this month</p>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin">progress_activity</span>
            <p className="text-slate-400 mt-4">Loading live rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 glass-effect rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">group_off</span>
            <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
            <p className="text-slate-400">Complete your daily worship to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Podium Top 3 */}
            {podium.length >= 3 && (
              <section className="grid grid-cols-3 gap-4 md:gap-8 mb-16 items-end">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-slate-500 mb-4 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {podium[1]?.photoURL ? <img src={podium[1].photoURL} alt={podium[1].displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-slate-500">person</span>}
                  </div>
                  <span className="-mt-8 mb-2 bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full">2nd</span>
                  <h3 className="text-sm md:text-xl font-bold text-white truncate max-w-[120px]">{podium[1]?.displayName || 'Anonymous'}</h3>
                  <p className="text-emerald-500 text-xs md:text-base font-medium">{formatXP(getXP(podium[1]))} XP</p>
                </div>
                
                {/* 1st Place */}
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <span className="material-symbols-outlined text-yellow-400 text-3xl mb-2 drop-shadow-md">workspace_premium</span>
                  <div className="w-28 h-28 md:w-48 md:h-48 rounded-full border-4 border-yellow-500 mb-4 overflow-hidden bg-slate-800 winner-glow flex items-center justify-center">
                    {podium[0]?.photoURL ? <img src={podium[0].photoURL} alt={podium[0].displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-6xl text-yellow-600">person</span>}
                  </div>
                  <span className="-mt-8 mb-2 bg-yellow-500 text-slate-900 text-sm md:text-lg font-black px-4 py-1 rounded-full ring-4 ring-slate-950">1st</span>
                  <h3 className="text-lg md:text-2xl font-black text-white truncate max-w-[160px]">{podium[0]?.displayName || 'Anonymous'}</h3>
                  <p className="text-emerald-500 text-sm md:text-lg font-bold">{formatXP(getXP(podium[0]))} XP</p>
                </div>
                
                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-amber-700 mb-4 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {podium[2]?.photoURL ? <img src={podium[2].photoURL} alt={podium[2].displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-amber-800/50">person</span>}
                  </div>
                  <span className="-mt-8 mb-2 bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full">3rd</span>
                  <h3 className="text-sm md:text-xl font-bold text-white truncate max-w-[120px]">{podium[2]?.displayName || 'Anonymous'}</h3>
                  <p className="text-emerald-500 text-xs md:text-base font-medium">{formatXP(getXP(podium[2]))} XP</p>
                </div>
              </section>
            )}

            {/* Scrollable Rank List */}
            <section className="space-y-4">
              {rest.map((entry, idx) => {
                const rank = idx + 4;
                const isMe = entry.uid === user?.uid;
                return (
                  <div key={entry.uid} className={`glass-effect rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${isMe ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}`}>
                    <span className="text-xl font-black text-slate-500 w-8 text-center">{rank}</span>
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                      {entry.photoURL ? <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-md font-bold text-white flex items-center gap-1">
                        {entry.displayName || 'Anonymous'}
                        {isMe && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold ml-1">YOU</span>}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Rank {rank}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">{getXP(entry).toLocaleString()}</span>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">VP</p>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>

      {/* Sticky User Rank */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto bg-emerald-600 text-white rounded-3xl p-4 flex items-center gap-4 shadow-[0_-10px_40px_rgba(16,185,129,0.2)] pointer-events-auto border border-emerald-400/30">
          <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center overflow-hidden border-2 border-emerald-400">
            {user?.photoURL ? <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined">person</span>}
          </div>
          <div className="flex-grow">
            <h5 className="text-lg font-bold leading-none">You are Rank {myRankText}</h5>
            <p className="text-xs font-medium text-emerald-100 mt-1">{myRank > 0 ? `Top ${Math.max(1, Math.round((myRank / Math.max(entries.length, 1)) * 100))}%` : 'Not ranked yet'} • Keep pushing!</p>
          </div>
          <div className="bg-emerald-900/40 px-4 py-2 rounded-2xl">
            <span className="text-lg font-black">{totalXP} VP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

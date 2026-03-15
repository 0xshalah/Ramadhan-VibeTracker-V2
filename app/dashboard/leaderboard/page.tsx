"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useVibeStore } from '@/store/useVibeStore';

type LeaderboardEntry = {
  uid: string;
  displayName: string;
  totalXP: number;
  photoURL: string;
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const { userRole } = useVibeStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(50));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({
          uid: doc.id,
          displayName: doc.data().displayName || 'Anonymous',
          totalXP: doc.data().totalXP || 0,
          photoURL: doc.data().photoURL || ''
        }));
        setLeaders(fetched);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const goBackUrl = userRole === 'admin' ? '/dashboard/admin' : userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

  return (
    // FIX: Dynamic Light/Dark Theme Wrapper
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white p-6 md:p-10 transition-colors duration-300 font-sans pb-24">
      <nav className="flex justify-between items-center mb-10 max-w-2xl mx-auto">
        <Link href={goBackUrl} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Global Ranks</h1>
        <div className="w-6"></div>
      </nav>

      {loading ? (
        <div className="text-center mt-20 text-slate-500 animate-pulse">Loading Leaderboard...</div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Top 3 Podium */}
          <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 mt-10">
            {/* Rank 2 */}
            {leaders[1] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
                <div className="relative mb-2">
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs font-black text-slate-700 shadow-md border-2 border-white dark:border-slate-900 z-10">2</div>
                  <img src={leaders[1].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[1].uid}`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 object-cover" alt="Rank 2" />
                </div>
                <div className="h-24 sm:h-32 w-20 sm:w-24 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl border-x border-t border-slate-300 dark:border-slate-600 flex flex-col items-center justify-end pb-4 shadow-lg">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-16 text-center">{leaders[1].displayName.split(' ')[0]}</p>
                  <p className="text-[10px] font-black text-slate-500 mt-1">{leaders[1].totalXP.toLocaleString()} XP</p>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {leaders[0] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-1000 z-10">
                <div className="relative mb-2">
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-sm font-black text-amber-900 shadow-lg border-2 border-white dark:border-slate-900 z-10">1</div>
                  <img src={leaders[0].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[0].uid}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 object-cover shadow-[0_0_30px_rgba(251,191,36,0.3)]" alt="Rank 1" />
                </div>
                <div className="h-32 sm:h-40 w-24 sm:w-28 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-2xl border border-amber-300 flex flex-col items-center justify-end pb-4 shadow-2xl">
                  <p className="text-sm font-black text-white truncate w-20 text-center">{leaders[0].displayName.split(' ')[0]}</p>
                  <p className="text-xs font-black text-amber-100 mt-1">{leaders[0].totalXP.toLocaleString()} XP</p>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {leaders[2] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-6 duration-500">
                <div className="relative mb-2">
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md border-2 border-white dark:border-slate-900 z-10">3</div>
                  <img src={leaders[2].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[2].uid}`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-700/50 object-cover" alt="Rank 3" />
                </div>
                <div className="h-20 sm:h-24 w-20 sm:w-24 bg-gradient-to-t from-amber-900/40 to-amber-700/40 rounded-t-2xl border-x border-t border-amber-700/50 flex flex-col items-center justify-end pb-4 shadow-lg">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-16 text-center">{leaders[2].displayName.split(' ')[0]}</p>
                  <p className="text-[10px] font-black text-slate-500 mt-1">{leaders[2].totalXP.toLocaleString()} XP</p>
                </div>
              </div>
            )}
          </div>

          {/* List Remaining Ranks */}
          <div className="space-y-3">
            {leaders.slice(3).map((leader, index) => (
              <div key={leader.uid} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 transition-colors duration-300 shadow-sm">
                <div className="w-8 font-black text-slate-400 dark:text-slate-500 text-center">#{index + 4}</div>
                <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover" alt={leader.displayName} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white truncate">{leader.displayName}</p>
                </div>
                <div className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                  {leader.totalXP.toLocaleString()} <span className="text-[10px] text-slate-500">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

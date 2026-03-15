"use client";
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useVibeStore } from '@/store/useVibeStore';

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  totalXP: number;
  role: string;
}

export default function LeaderboardWidget() {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useVibeStore((state) => state.user);

  // THE 1-READ MIRACLE: 1000 klien membaca 1 dokumen = 1 Document Read
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'metadata', 'leaderboard_global'), (snapshot) => {
      if (snapshot.exists()) {
        setTopUsers(snapshot.data().top100 || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getMedalEmoji = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 animate-pulse">
        <div className="h-6 bg-sage-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-sage-100 dark:bg-slate-800 rounded-xl mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-amber-500 fill-1">trophy</span>
        <h3 className="text-lg font-black text-slate-800 dark:text-white">Leaderboard</h3>
      </div>
      
      {topUsers.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-sage-300 dark:text-slate-700">emoji_events</span>
          <p className="text-sm text-sage-500 mt-2">Belum ada data leaderboard.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topUsers.slice(0, 10).map((user, index) => {
            const isCurrentUser = currentUser?.uid === user.uid;
            return (
              <div
                key={user.uid}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                  isCurrentUser 
                    ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20' 
                    : 'bg-sage-50 dark:bg-slate-800 hover:bg-sage-100 dark:hover:bg-slate-700'
                } ${index < 3 ? 'shadow-sm' : ''}`}
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                  index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200' :
                  index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                  'bg-sage-100 text-sage-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {getMedalEmoji(index)}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-sage-200 dark:bg-slate-700 overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-sage-400 text-sm">person</span>
                  )}
                </div>
                
                {/* Name & XP */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                    {user.displayName}
                    {isCurrentUser && <span className="text-[10px] ml-1 opacity-60">(Anda)</span>}
                  </p>
                </div>

                {/* XP Score */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-amber-500 text-[14px]">stars</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">{user.totalXP.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../student/components/Sidebar';
import { auth, logout } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useVibeStore } from '@/store/useVibeStore';

export default function BadgesPage() {
  const [user, setUser] = React.useState(null);
  const router = useRouter();
  
  // Ambil data XP dari Global Store
  const totalXP = useVibeStore((state) => state.totalXP);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  // Definisi Lencana & Threshold XP
  const badges = [
    { id: 1, name: "Ramadhan Initiate", threshold: 0, icon: "auto_awesome", color: "text-slate-400", bg: "bg-slate-100" },
    { id: 2, name: "Faithful Tracker", threshold: 25, icon: "verified", color: "text-emerald-500", bg: "bg-emerald-100" },
    { id: 3, name: "Ramadhan Warrior", threshold: 50, icon: "military_tech", color: "text-indigo-500", bg: "bg-indigo-100" },
    { id: 4, name: "Spiritual Master", threshold: 150, icon: "workspace_premium", color: "text-amber-500", bg: "bg-amber-100" },
    { id: 5, name: "Legend of Light", threshold: 300, icon: "diamond", color: "text-purple-500", bg: "bg-purple-100" },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Sidebar dengan pengiriman totalXP agar konsisten */}
      <Sidebar user={user} totalXP={totalXP} onLogout={logout} />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black mb-2">Achievements & Badges</h1>
          <p className="text-sage-500">Collect XP by completing your daily worship to unlock exclusive badges.</p>
        </header>

        {/* Grid Lencana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => {
            const isUnlocked = totalXP >= badge.threshold;
            return (
              <div 
                key={badge.id} 
                className={`relative p-6 rounded-3xl border transition-all duration-500 ${
                  isUnlocked 
                    ? 'bg-white dark:bg-slate-900 border-sage-200 shadow-xl scale-100 opacity-100' 
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-dashed border-slate-300 opacity-50 grayscale scale-95'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded-full uppercase tracking-tighter">
                    {badge.threshold - totalXP} XP More
                  </div>
                )}
                
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${badge.bg} ${badge.color}`}>
                  <span className="material-symbols-outlined text-4xl">{badge.icon}</span>
                </div>
                
                <h3 className={`font-bold text-lg ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-sage-500 mt-1">
                  {isUnlocked ? 'Requirement met!' : `Unlock at ${badge.threshold} XP`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => router.push('/dashboard/student')} 
            className="px-8 py-3 bg-primary text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

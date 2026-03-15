"use client";

import Link from 'next/link';
import { useVibeStore } from '@/store/useVibeStore';
import { useRouter } from 'next/navigation';

export default function BadgesPage() {
  const { totalXP, streak, userRole } = useVibeStore();
  const router = useRouter();

  // Route back based on role
  const goBackUrl = userRole === 'admin' ? '/dashboard/admin' : 
                    userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

  const badges = [
    { icon: 'military_tech', name: 'First Prayer', desc: 'Complete your first daily prayer check-in', unlocked: totalXP >= 50, color: 'from-amber-400 to-amber-600' },
    { icon: 'local_fire_department', name: '7-Day Streak', desc: 'Maintain a 7-day consecutive worship streak', unlocked: streak >= 7, color: 'from-rose-400 to-red-600' },
    { icon: 'volunteer_activism', name: 'Charity Starter', desc: 'Donate through the Charity Hub', unlocked: totalXP > 500, color: 'from-emerald-400 to-green-600' },
    { icon: 'mosque', name: 'Night Owl', desc: 'Complete 5 Sunnah activities', unlocked: totalXP >= 1500, color: 'from-indigo-400 to-blue-600' },
    { icon: 'diamond', name: 'Ramadan Master', desc: 'Reach 5000 XP in total', unlocked: totalXP >= 5000, color: 'from-fuchsia-400 to-purple-600' },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    // FIX: Menggunakan kelas Tailwind dinamis agar mendukung Light & Dark Mode
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white p-6 md:p-10 transition-colors duration-300 font-sans">
      <nav className="flex items-center gap-4 mb-10 max-w-4xl mx-auto">
        <button onClick={() => router.push(goBackUrl)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Badges & Achievements</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            You have unlocked {unlockedCount} of {badges.length} badges.
          </p>
        </div>
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {badges.map((badge, i) => (
          <div key={i} className={`relative p-6 rounded-3xl border transition-all duration-300 ${
            badge.unlocked 
              ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1' 
              : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale'
          }`}>
            <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-inner ${
              badge.unlocked ? `bg-gradient-to-br ${badge.color} text-white` : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">{badge.icon}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{badge.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{badge.desc}</p>
            
            {badge.unlocked && (
              <div className="absolute top-6 right-6 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

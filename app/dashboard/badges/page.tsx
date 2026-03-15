"use client";

import Link from 'next/link';
import { useVibeStore } from '@/store/useVibeStore';

export default function BadgesPage() {
  const { totalXP, streak, verifiedSadaqah } = useVibeStore();

  const badges = [
    { icon: 'military_tech', name: 'First Prayer', desc: 'Complete your first daily prayer check-in', unlocked: totalXP >= 50, color: 'from-amber-500 to-yellow-500' },
    { icon: 'local_fire_department', name: '7-Day Streak', desc: 'Maintain a 7-day consecutive worship streak', unlocked: streak >= 7, color: 'from-orange-500 to-red-500' },
    { icon: 'auto_stories', name: 'Quran Explorer', desc: 'Earn 500+ XP from daily tilawah and prayers', unlocked: totalXP >= 500, color: 'from-emerald-500 to-teal-500' },
    { icon: 'volunteer_activism', name: 'Generous Soul', desc: 'Complete your first verified Sadaqah donation via Mayar', unlocked: verifiedSadaqah || totalXP > 2000 /* Fallback demo condition */, color: 'from-pink-500 to-rose-500' },
    { icon: 'emoji_events', name: 'Vibe Master', desc: 'Reach 1,500 Total XP points', unlocked: totalXP >= 1500, color: 'from-indigo-500 to-purple-500' },
    { icon: 'nights_stay', name: 'Night Owl', desc: 'Maintain a 14-day streak', unlocked: streak >= 14, color: 'from-slate-600 to-slate-800' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <nav className="flex items-center gap-4 mb-10">
        <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Badges & Achievements</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Ramadhan 1445H</p>
        </div>
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {badges.map((badge) => (
          <div key={badge.name} className={`relative rounded-2xl p-6 border transition-all duration-300 ${badge.unlocked ? 'bg-slate-900 border-slate-700 hover:border-amber-500/50' : 'bg-slate-900/50 border-slate-800/50 opacity-50 grayscale'}`}>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 ${badge.unlocked ? 'shadow-lg' : ''}`}>
              <span className="material-symbols-outlined text-white text-2xl">{badge.icon}</span>
            </div>
            <h3 className="text-lg font-bold mb-1">{badge.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{badge.desc}</p>
            {badge.unlocked ? (
              <span className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">Unlocked</span>
            ) : (
              <span className="absolute top-4 right-4 bg-slate-800 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Locked</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

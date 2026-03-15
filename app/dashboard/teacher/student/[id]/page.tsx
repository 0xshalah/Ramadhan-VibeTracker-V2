"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile, getUserWeeklyProgress } from '@/lib/firebase';
import type { UserProfile } from '@/lib/schemas';
import type { DailyProgress } from '@/lib/schemas';

type StudentData = UserProfile & { uid: string };
type WeeklyEntry = DailyProgress & { dateId: string };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentAnalyticsPage() {
  const { id } = useParams();
  const studentId = typeof id === 'string' ? id : '';
  
  const [student, setStudent] = useState<StudentData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState<string>('teacher');
  const router = useRouter();

  useEffect(() => {
    if (!studentId) return;
    
    const fetchData = async () => {
      try {
        const [profile, weekly] = await Promise.all([
          getUserProfile(studentId),
          getUserWeeklyProgress(studentId),
        ]);
        
        if (profile) {
          setStudent({ ...profile, uid: studentId });
        }
        setWeeklyData(weekly);
      } catch (err) {
        // console.error('[STUDENT_ANALYTICS] Fetch error:', err);error
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Determine if the viewer is an Admin so the Back button routes correctly
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const profile = await getUserProfile(u.uid);
        if (profile?.role === 'admin') setViewerRole('admin');
      }
    });

    return () => unsub();
  }, [studentId]);

  // Calculate XP
  const totalXP = student?.totalXP ?? (student?.dailyXP ? Object.values(student.dailyXP).reduce((a, b) => a + (b || 0), 0) : 0);

  // Transform weekly data into recitation chart
  const recitationData = weeklyData.map(entry => {
    const date = new Date(entry.dateId);
    const dayName = DAY_NAMES[date.getDay()] || entry.dateId.slice(-2);
    const pages = entry.tilawah || 0;
    const maxPages = Math.max(...weeklyData.map(e => e.tilawah || 0), 1);
    const heightPct = `${Math.round((pages / maxPages) * 100)}%`;
    return { day: dayName, pages, height: heightPct };
  }).reverse(); // oldest first

  const weeklyAvg = weeklyData.length > 0
    ? (weeklyData.reduce((a, e) => a + (e.tilawah || 0), 0) / (weeklyData.length || 1)).toFixed(1)
    : '0';

  // Calculate prayer consistency from weekly data
  const prayerNames = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;
  const displayNames: Record<string, string> = { subuh: 'Fajr', dzuhur: 'Dhuhr', ashar: 'Asr', maghrib: 'Maghrib', isya: 'Isha' };
  const totalDays = Math.max(weeklyData.length, 1);
  
  const prayerConsistency = prayerNames.map(key => {
    const completed = weeklyData.filter(d => d.sholat?.[key] === true).length;
    const pct = Math.round((completed / totalDays) * 100);
    return { name: displayNames[key], pct: `${pct}%` };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin">progress_activity</span>
          <p className="text-slate-400 mt-4">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        .emerald-gradient { background: linear-gradient(to top, #10b981, #34d399); }
      `}} />
      
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <Link href={viewerRole === 'admin' ? '/dashboard/admin' : '/dashboard/teacher'} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="font-bold text-lg tracking-tight">Student Analytics</h1>
        <button className="p-2 text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
        {/* Profile Card Summary */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-emerald-500 p-1 bg-slate-800 overflow-hidden flex items-center justify-center">
               {student?.photoURL ? (
                 <img src={student.photoURL} alt={student.displayName || 'Student'} className="w-full h-full object-cover rounded-full" />
               ) : (
                 <span className="material-symbols-outlined text-6xl text-slate-500">person</span>
               )}
            </div>
            <span className="absolute bottom-0 right-0 bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-4 ring-slate-900">Active</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">{student?.displayName || 'Student'} <span className="text-slate-500 text-lg font-medium">#{studentId.slice(0, 6)}</span></h2>
          <div className="grid grid-cols-2 gap-8 w-full pt-6 border-t border-slate-800">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-bold">Total XP</p>
              <p className="text-2xl font-black text-emerald-400">{totalXP.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-bold">Streak</p>
              <p className="text-2xl font-black text-white">{student?.streak || 0} Days</p>
            </div>
          </div>
        </section>

        {/* Pure CSS Native Bar Chart */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">Quran Recitation</h3>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">Last 7 Days</span>
          </div>
          
          {recitationData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No recitation data yet.</p>
          ) : (
            <>
              <div className="flex items-end justify-between h-48 w-full px-2 border-b border-slate-800 pb-2">
                {recitationData.map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 group w-full relative">
                    <div className="w-8 emerald-gradient rounded-t-lg relative transition-all hover:brightness-125" style={{ height: stat.height === '0%' ? '4px' : stat.height }}>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-700 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-xl">
                        {stat.pages}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase mt-2">{stat.day}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-slate-400">Weekly Average: <span className="text-emerald-400 font-bold ml-1">{weeklyAvg} pages/day</span></p>
            </>
          )}
        </section>

        {/* Prayer Consistency Telemetry */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 mb-8 shadow-lg">
          <h3 className="font-bold text-xl mb-6">Prayer Consistency</h3>
          <div className="space-y-6">
            {prayerConsistency.map(prayer => (
              <div key={prayer.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-300">{prayer.name}</span>
                  <span className="font-black text-emerald-400">{prayer.pct}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: prayer.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Teacher Action Board */}
        <div className="flex gap-4 pt-4">
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 active:scale-95">
            <span className="material-symbols-outlined text-slate-400">chat</span> Intervene
          </button>
          <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 text-white active:scale-95">
            <span className="material-symbols-outlined">assignment_add</span> Assign Task
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from 'react';
import { getDetailedHistory, auth, logout } from '@/lib/firebase';
import Sidebar from '../student/components/Sidebar';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const data = await getDetailedHistory(u.uid);
        setHistory(data);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Format data for heatmap
  const heatmapData = history.map(day => ({
    date: day.dateId, // Format "2024-03-12"
    count: day.earnedXP || 0
  }));

  const today = new Date();
  const shiftDate = new Date(new Date().setDate(today.getDate() - 30));

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <Sidebar user={user} onLogout={logout} totalXP={history.reduce((acc, obj) => acc + (obj.earnedXP || 0), 0)} />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">Spiritual History</h1>
          <p className="text-sage-500">Visualisasi kalender komitmen ibadah bulanan Anda.</p>
        </header>

        {history.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-10 overflow-x-auto">
             <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Heatmap Konsistensi (30 Hari)</h3>
             <div className="min-w-[500px]">
                <CalendarHeatmap
                  startDate={shiftDate}
                  endDate={today}
                  values={heatmapData}
                  classForValue={(value) => {
                    if (!value || value.count === 0) {
                      return 'color-empty opacity-20 fill-slate-200 dark:fill-slate-800';
                    }
                    if (value.count < 50) return 'fill-indigo-300';
                    if (value.count < 100) return 'fill-indigo-400';
                    if (value.count < 200) return 'fill-indigo-500';
                    return 'fill-indigo-600';
                  }}
                  titleForValue={(value) => {
                     return value && value.count ? `${value.count} XP on ${value.date}` : 'No activity';
                  }}
                  showWeekdayLabels
                />
             </div>
          </div>
        )}

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
            <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Log Aktivitas Harian</h3>
            {history.map(day => {
               const prayersDone = day.sholat ? Object.values(day.sholat).filter(v => v).length : 0;
               return (
              <div key={day.dateId} className="bg-white dark:bg-slate-900 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow gap-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span> {day.dateId}
                  </h4>
                  <p className="text-sm text-sage-500 italic">"Keep istiqomah!"</p>
                </div>
                <div className="flex gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-center flex flex-col items-center">
                    <span className="block font-black text-emerald-500 text-xl">{prayersDone}/5</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sholat</span>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <span className="block font-black text-amber-500 text-xl">{day.tilawah || 0}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pages</span>
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

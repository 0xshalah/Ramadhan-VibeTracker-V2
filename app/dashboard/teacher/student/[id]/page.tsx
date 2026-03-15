"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StudentAnalyticsPage() {
  const { id } = useParams();

  // Mock data telemetri ibadah murni menggunakan array
  const recitationData = [
    { day: 'Mon', pages: 4, height: '40%' },
    { day: 'Tue', pages: 6, height: '60%' },
    { day: 'Wed', pages: 5, height: '50%' },
    { day: 'Thu', pages: 8, height: '80%' },
    { day: 'Fri', pages: 3, height: '30%' },
    { day: 'Sat', pages: 10, height: '100%' },
    { day: 'Sun', pages: 7, height: '70%' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        .emerald-gradient { background: linear-gradient(to top, #10b981, #34d399); }
      `}} />
      
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard/teacher" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
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
               <span className="material-symbols-outlined text-6xl text-slate-500">person</span>
            </div>
            <span className="absolute bottom-0 right-0 bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-4 ring-slate-900">Active</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Ahmad <span className="text-slate-500 text-lg font-medium">#{id}</span></h2>
          <div className="grid grid-cols-2 gap-8 w-full pt-6 border-t border-slate-800">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-bold">Total XP</p>
              <p className="text-2xl font-black text-emerald-400">4,500</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-bold">Rank</p>
              <p className="text-2xl font-black text-white">#4</p>
            </div>
          </div>
        </section>

        {/* Pure CSS Native Bar Chart */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">Quran Recitation</h3>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">Last 7 Days</span>
          </div>
          
          <div className="flex items-end justify-between h-48 w-full px-2 border-b border-slate-800 pb-2">
            {recitationData.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 group w-full relative">
                <div className="w-8 emerald-gradient rounded-t-lg relative transition-all hover:brightness-125" style={{ height: stat.height }}>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-700 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-xl">
                    {stat.pages}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-bold uppercase mt-2">{stat.day}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-400">Weekly Average: <span className="text-emerald-400 font-bold ml-1">6.1 pages/day</span></p>
        </section>

        {/* Prayer Consistency Telemetry */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 mb-8 shadow-lg">
          <h3 className="font-bold text-xl mb-6">Prayer Consistency</h3>
          <div className="space-y-6">
            {[
              { name: 'Fajr', pct: '80%' },
              { name: 'Dhuhr', pct: '95%' },
              { name: 'Asr', pct: '100%' },
              { name: 'Maghrib', pct: '90%' },
              { name: 'Isha', pct: '85%' },
            ].map(prayer => (
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

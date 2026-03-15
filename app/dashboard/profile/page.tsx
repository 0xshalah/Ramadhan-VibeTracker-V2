"use client";

import React, { useState } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, totalXP, streak } = useVibeStore();
  const [quranTarget, setQuranTarget] = useState(12);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="text-xl font-bold">Profile &amp; Settings</h1>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-8 mt-4">
        {/* Identity Header */}
        <section className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-700 flex items-center justify-center overflow-hidden shadow-xl">
              {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover"/> : <span className="material-symbols-outlined text-6xl text-slate-500">person</span>}
            </div>
            <button className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full text-white hover:bg-emerald-600 shadow-lg transition-transform active:scale-95">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <h2 className="text-2xl font-bold mt-4">{user?.displayName || 'Student'}</h2>
          <p className="text-slate-400 text-sm">{user?.email || 'email@notfound.com'}</p>
        </section>

        {/* Lifetime Stats */}
        <section className="bg-slate-800 rounded-3xl p-6 border border-slate-700 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center text-center">
            <div className="bg-emerald-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-emerald-400">military_tech</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total XP</span>
            <span className="text-xl font-bold mt-1">{totalXP}</span>
          </div>
          <div className="flex flex-col items-center text-center border-x border-slate-700">
            <div className="bg-orange-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-orange-400">local_fire_department</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Streak</span>
            <span className="text-xl font-bold mt-1">{streak} <small className="text-xs font-normal">Days</small></span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-blue-400">done_all</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Prayers</span>
            <span className="text-xl font-bold mt-1">128</span>
          </div>
        </section>

        {/* Dynamic Preferences */}
        <section className="space-y-6">
          {/* Target Slider */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">menu_book</span>
                <h3 className="font-bold text-white text-lg">Daily Quran Target</h3>
              </div>
              <span className="bg-slate-700 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-500/20">{quranTarget} Pages</span>
            </div>
            <input 
              type="range" min="1" max="30" 
              value={quranTarget} onChange={(e) => setQuranTarget(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
            <div className="flex justify-between mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>1 Page</span>
                <span>Juz&apos; 1</span>
                <span>30 Pages</span>
            </div>
          </div>

          {/* System Toggles */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-emerald-500">notifications_active</span>
              <h3 className="font-bold text-white text-lg">Notifications</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Prayer Reminders</p>
                <p className="text-xs text-slate-400 mt-1">Get notified for each prayer time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <hr className="border-slate-700/50" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Subuh Wake-up Call</p>
                <p className="text-xs text-slate-400 mt-1">Enable alarm 15 mins before Subuh</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <footer className="pt-8 pb-4 text-center">
          <button className="flex items-center justify-center gap-2 w-full py-4 text-rose-500 font-medium bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 border border-rose-500/10 transition-colors">
            <span className="material-symbols-outlined">delete_forever</span> Delete Account
          </button>
          <p className="mt-6 text-xs text-slate-500 tracking-widest uppercase font-bold">VibeTracker V2.4.0</p>
        </footer>
      </main>
    </div>
  );
}

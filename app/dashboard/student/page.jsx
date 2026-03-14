"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Component: Sidebar
function Sidebar() {
  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-sage-200 dark:border-slate-800 flex-col hidden lg:flex">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">auto_stories</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">RamadanLog</h1>
          <p className="text-xs text-sage-500 font-medium">Student Portal</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-primary font-semibold">
          <span className="material-symbols-outlined fill-1">home</span>
          <span>Home</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">history</span>
          <span>History</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">military_tech</span>
          <span>Badges</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </Link>
      </nav>
      <div className="p-6 border-t border-sage-100 dark:border-slate-800">
        <div className="bg-sage-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sage-200 dark:bg-slate-700 overflow-hidden">
            <img className="w-full h-full object-cover" alt="Student profile avatar placeholder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhEw5MiBrGI3zJwe9gkH_6518EriKAaivgyZYAnu1MxJQ6yZjMHJypXx8j6tHB3IFot-kXRgAFcQnzeQzO5JF9wnF0vAOHE0lfYt7GA4fEdYqnXcFN2SWof4lm2zmKkEtu6Adn6DD-LvX1vysjW_zydYR8TYMvaHGYsWBt5yy4jFZnsvRms4uXZB_WpH_p76oXoL9ATuymvwlfBsqrvzGsuqE4qnBLf56OFqV14XLMXaSbjIZeRRpOjcX8xfyVpygq4KjxmhXUH_I" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Ahmad Fauzi</p>
            <p className="text-xs text-sage-500 truncate">Grade 11 Student</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Component: Header
function Header({ progressPercent, progressMessage }) {
  const circumference = 175.9;
  const strokeDashoffset = circumference - ((progressPercent / 100) * circumference);

  return (
    <header className="p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Assalamu'alaikum, Ahmad!</h2>
        <div className="flex items-center gap-2 text-sage-600 dark:text-sage-400">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <p className="text-sm font-medium">Tuesday, 12 March 2024 | <span className="text-primary font-bold">1 Ramadan 1445 AH</span></p>
        </div>
      </div>
      <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-sage-100 dark:border-slate-800 w-full lg:w-auto">
        <div className="relative flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle className="text-sage-100 dark:text-slate-800" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
            <circle 
              className="text-primary transition-all duration-500 ease-in-out" 
              cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
              strokeDasharray="175.9" 
              strokeDashoffset={strokeDashoffset} 
              strokeWidth="6">
            </circle>
          </svg>
          <span className="absolute text-sm font-bold">{progressPercent}%</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-sage-500 uppercase tracking-wider">Today's Worship</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{progressMessage}</p>
        </div>
        <button className="bg-sage-50 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
}

// Component: PrayerCard
function PrayerCard({ time, isDone, name, onToggle }) {
   return (
      <div 
        onClick={onToggle}
        className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-sage-50 dark:bg-slate-800/50 border border-transparent hover:border-primary/30 transition-all cursor-pointer group active:scale-95">
        <p className="text-xs font-bold text-sage-500 uppercase">{name}</p>
        <div className={`prayer-icon w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-700 text-slate-300 border-slate-200 dark:border-slate-600'}`}>
            {isDone && <span className="material-symbols-outlined">check</span>}
        </div>
        <p className="text-[10px] font-medium text-sage-400">{time}</p>
      </div>
   );
}

// Component: Main App Page
export default function StudentDashboard() {
  const [tilawah, setTilawah] = useState(12);
  const targetTilawah = 20;
  
  const [scaleAnim, setScaleAnim] = useState(false);

  const [sholat, setSholat] = useState({
    subuh: true,
    dzuhur: true,
    ashar: false,
    maghrib: false,
    isya: false
  });

  const [sunnah, setSunnah] = useState({
    tarawih: false,
    sahur: true,
    sadaqah: true
  });

  const prayers = [
    { name: 'subuh', time: '04:45 AM', label: 'Subuh' },
    { name: 'dzuhur', time: '12:05 PM', label: 'Dzuhur' },
    { name: 'ashar', time: '03:15 PM', label: 'Ashar' },
    { name: 'maghrib', time: '06:12 PM', label: 'Maghrib' },
    { name: 'isya', time: '07:22 PM', label: 'Isya' }
  ];

  // Derived state calculations based on PRD
  const tilawahPct = Math.min(Math.round((tilawah / targetTilawah) * 100), 100);
  const prayersDone = Object.values(sholat).filter(v => v).length;
  const totalPct = Math.round(((prayersDone / 5) * 50) + (tilawahPct / 2));
  
  let progressMessage = "Let's start strong!";
  if (totalPct >= 100) progressMessage = 'Masya Allah! Perfect! 🌟';
  else if (totalPct >= 80) progressMessage = 'Almost there!';
  else if (totalPct >= 50) progressMessage = 'Keep going! 💪';

  const handlePrayerToggle = (prayerName) => {
    setSholat(prev => ({
      ...prev,
      [prayerName]: !prev[prayerName]
    }));
  };

  const handleSunnahToggle = (sunnahName) => {
    setSunnah(prev => ({
      ...prev,
      [sunnahName]: !prev[sunnahName]
    }));
  };

  const handleTilawahPlus = () => {
    setTilawah(prev => prev + 1);
    setScaleAnim('plus');
    setTimeout(() => setScaleAnim(false), 150);
  };

  const handleTilawahMinus = () => {
    if (tilawah > 0) {
      setTilawah(prev => prev - 1);
      setScaleAnim('minus');
      setTimeout(() => setScaleAnim(false), 150);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <Header progressPercent={totalPct} progressMessage={progressMessage} />
          
          <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* Sholat Fardhu Section */}
              <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">mosque</span>
                    Sholat Fardhu
                  </h3>
                  <span className="text-xs font-bold bg-sage-50 dark:bg-slate-800 text-sage-600 dark:text-slate-300 px-3 py-1 rounded-full uppercase">5 Daily Prayers</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {prayers.map(p => (
                    <PrayerCard key={p.name} time={p.time} name={p.label} isDone={sholat[p.name]} onToggle={() => handlePrayerToggle(p.name)} />
                  ))}
                </div>
              </section>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Ibadah Sunnah */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">stars</span>
                    Sunnah Activities
                  </h3>
                  <div className="space-y-4">
                    {[
                      { id: 'tarawih', name: 'Shalat Tarawih', icon: 'nightlight_round', active: sunnah.tarawih },
                      { id: 'sahur', name: 'Sahur Healthy Meal', icon: 'set_meal', active: sunnah.sahur },
                      { id: 'sadaqah', name: 'Daily Sadaqah', icon: 'volunteer_activism', active: sunnah.sadaqah }
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-sage-400">{item.icon}</span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <button 
                          onClick={() => handleSunnahToggle(item.id)}
                          className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer active:scale-95 ${item.active ? 'bg-primary' : 'bg-sage-200 dark:bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out ${item.active ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tilawah Tracker */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">menu_book</span>
                    Target Tilawah
                  </h3>
                  <div className="text-center py-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl mb-4">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Current Progress</p>
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        onClick={handleTilawahMinus}
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span 
                        className={`text-4xl font-black text-slate-800 dark:text-slate-100 transition-transform duration-150 inline-block ${scaleAnim === 'plus' ? 'scale-[1.3]' : scaleAnim === 'minus' ? 'scale-[0.8]' : 'scale-100'}`}>
                        {tilawah}
                      </span>
                      <button 
                        onClick={handleTilawahPlus}
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">Halaman yang dibaca hari ini</p>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <p className="text-xs font-bold text-sage-500">Target: {targetTilawah} Pages</p>
                    <p className="text-xs font-bold text-primary">{tilawahPct}% Done</p>
                  </div>
                </section>
              </div>
            </div>

            {/* Right Column: Widgets */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* 7-Day Streak */}
              <section className="bg-primary/10 dark:bg-primary/5 p-6 rounded-3xl border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">7-Day Streak</h3>
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined fill-1">local_fire_department</span>
                    <span className="font-black text-xl">4</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  {['M', 'T', 'W', 'T'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">{day}</div>
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                    </div>
                  ))}
                  {['F', 'S', 'S'].map((day, i) => (
                    <div key={i + 4} className="flex flex-col items-center gap-2 opacity-30">
                      <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">{day}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Dua of the Day */}
              <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sage-50 dark:bg-slate-800 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                <h3 className="text-sm font-bold text-sage-500 uppercase tracking-widest mb-4">Dua of the Day</h3>
                <p className="text-2xl font-display font-medium leading-relaxed mb-4 text-slate-800 dark:text-slate-100 italic">
                  &quot;Allahumma laka sumtu wa bika aamantu wa &apos;ala rizqika aftartu.&quot;
                </p>
                <p className="text-sm text-sage-600 dark:text-sage-400 relative z-10">
                  O Allah, for Thee I have fasted, in Thee I believe, and with Thy provision I break my fast.
                </p>
              </section>

              {/* Upcoming Schedule */}
              <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  Next Event
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-primary">18</span>
                      <span className="text-[10px] uppercase font-medium">Min</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Maghrib Prayer</p>
                      <p className="text-xs text-slate-400 italic">Time to break the fast</p>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-primary text-slate-900 font-bold rounded-xl text-sm transition-transform active:scale-95 hover:brightness-95">
                    Open Full Schedule
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

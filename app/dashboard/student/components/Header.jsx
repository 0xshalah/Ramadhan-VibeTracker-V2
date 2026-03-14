import React, { useState, useEffect } from 'react';

export default function Header({ totalPct, user }) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(new Date()));
  }, []);

  const circumference = 175.9;
  const strokeDashoffset = Math.max(0, circumference - ((totalPct / 100) * circumference));

  let progressMessage = "Let's start strong!";
  if (totalPct >= 100) progressMessage = 'Masya Allah! Perfect! 🌟';
  else if (totalPct >= 80) progressMessage = 'Almost there!';
  else if (totalPct >= 50) progressMessage = 'Keep going! 💪';

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Student';

  return (
    <header className="p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Assalamu'alaikum, {firstName}!</h2>
        <div className="flex items-center gap-2 text-sage-600 dark:text-sage-400">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <p className="text-sm font-medium">{currentDate || 'Loading date...'} | <span className="text-primary font-bold">Ramadan 1445 AH</span></p>
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
          <span className="absolute text-sm font-bold">{totalPct}%</span>
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

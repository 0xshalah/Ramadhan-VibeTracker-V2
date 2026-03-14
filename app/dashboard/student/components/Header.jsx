import React, { useState, useEffect } from 'react';

export default function Header({ corePct, sunnahBonusXP, hijriDate, user, showToast }) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(new Date()));
  }, []);

  const circumference = 175.9;
  const strokeDashoffset = Math.max(0, circumference - ((corePct / 100) * circumference));

  let progressMessage = "Let's start strong!";
  if (corePct >= 100) progressMessage = 'Masya Allah! Perfect! 🌟';
  else if (corePct >= 80) progressMessage = 'Almost there!';
  else if (corePct >= 50) progressMessage = 'Keep going! 💪';

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Student';

  return (
    <header className="p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Assalamu'alaikum, {firstName}!</h2>
        <div className="flex items-center gap-2 text-sage-600 dark:text-sage-400">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <p className="text-sm font-medium">{currentDate || 'Loading date...'} | <span className="text-primary font-bold">{hijriDate}</span></p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
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
          <span className="absolute text-sm font-bold">{corePct}%</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-sage-500 uppercase tracking-wider">Today's Worship</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{progressMessage}</p>
        </div>
        <button onClick={() => showToast && showToast('Notifications are coming in Phase 2! 🔔')} className="bg-sage-50 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
      {sunnahBonusXP > 0 && (
         <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg text-center flex items-center justify-center gap-1 border border-amber-200 dark:border-amber-800 animate-zoom-in w-full lg:w-auto mt-2">
           <span className="material-symbols-outlined text-[16px]">stars</span>
           +{sunnahBonusXP} Vibe Points (Sunnah Bonus)
         </div>
      )}
      </div>
    </header>
  );
}

import React from 'react';

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

export default function PrayerGrid({ sholat, onToggle, dynamicTimes }) {
  const prayers = [
    { name: 'subuh', time: dynamicTimes?.Fajr || '04:45 AM', label: 'Subuh' },
    { name: 'dzuhur', time: dynamicTimes?.Dhuhr || '12:05 PM', label: 'Dzuhur' },
    { name: 'ashar', time: dynamicTimes?.Asr || '03:15 PM', label: 'Ashar' },
    { name: 'maghrib', time: dynamicTimes?.Maghrib || '06:12 PM', label: 'Maghrib' },
    { name: 'isya', time: dynamicTimes?.Isha || '07:22 PM', label: 'Isya' }
  ];

  return (
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
          <PrayerCard key={p.name} time={p.time} name={p.label} isDone={sholat[p.name]} onToggle={() => onToggle(p.name)} />
        ))}
      </div>
    </section>
  );
}

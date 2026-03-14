import React, { useMemo } from 'react';

export default function StreakWidget({ streakCount }) {
  // Generate 7 days ending today
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // M, T, W, T, F, S, S
        isPastOrToday: true, // Untuk demo, asumsikan semua di array ini past/today karena kita ambil 7 hari ke belakang
        achieved: i >= 7 - streakCount // Simple logic to simulate streak from right to left
      });
    }
    return days;
  }, [streakCount]);

  return (
    <section className="bg-primary/10 dark:bg-primary/5 p-6 rounded-3xl border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">7-Day Streak</h3>
        <div className="flex items-center gap-1 text-primary">
          <span className="material-symbols-outlined fill-1">local_fire_department</span>
          <span className="font-black text-xl">{streakCount}</span>
        </div>
      </div>
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <div key={i} className={`flex flex-col items-center gap-2 ${!day.achieved ? 'opacity-30' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              day.achieved 
                ? 'bg-primary text-white' 
                : 'border border-slate-300 text-slate-500'
            }`}>
              {day.label}
            </div>
            {day.achieved && <div className="w-1 h-1 bg-primary rounded-full"></div>}
          </div>
        ))}
      </div>
    </section>
  );
}

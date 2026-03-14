import React, { useMemo, useEffect, useRef } from 'react';
import anime from 'animejs';

export default function StreakWidget({ history }) {
  // Calculate current consecutive streak from history
  const streakCount = useMemo(() => {
    let count = 0;
    const reversedHistory = [...history].reverse();
    // [FIX] Local timezone todayId (Anti-UTC Sabotage)
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const todayId = new Date(date - offset).toISOString().split('T')[0];

    for (const day of reversedHistory) {
      if (!day) break;
      const hasActivity = (day.tilawah > 0) || (day.sholat && Object.values(day.sholat).some(v => v));
      
      if (hasActivity) {
        count++;
      } else {
        // [FIX] Zero-Day Trap: If it's today and empty, don't break the streak yet
        if (day.dateId === todayId) continue;
        break;
      }
    }
    return count;
  }, [history]);

  const weekDays = useMemo(() => {
    return history.map((day, i) => {
       // [FIX] Midnight Offset Override: Paksa ke jam 12 siang agar tidak bergeser hari
       const dateObj = day?.dateId ? new Date(`${day.dateId}T12:00:00`) : new Date();
       const hasActivity = day && (day.tilawah > 0 || (day.sholat && Object.values(day.sholat).some(v => v)));
       return {
         label: dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }),
         achieved: !!hasActivity,
         dateId: day?.dateId
       };
    });
  }, [history]);

  // [ANIME.JS] Fire pulse animation for streak > 3
  const fireRef = useRef(null);
  useEffect(() => {
    if (streakCount >= 3 && fireRef.current) {
      anime({
        targets: fireRef.current,
        scale: [1, 1.3, 1],
        opacity: [0.7, 1, 0.7],
        duration: 1500,
        easing: 'easeInOutSine',
        loop: true
      });
    }
  }, [streakCount]);

  return (
    <section className="bg-primary/10 dark:bg-primary/5 p-6 rounded-3xl border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">7-Day Streak</h3>
        <div className="flex items-center gap-1 text-primary">
          <span ref={fireRef} className="material-symbols-outlined fill-1">local_fire_department</span>
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

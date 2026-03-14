import React, { useState, useEffect } from 'react';

export default function NextEvent({ prayerTimes }) {
  const [timeRemaining, setTimeRemaining] = useState({ value: '--', unit: 'Min' });
  const [nextEventName, setNextEventName] = useState('Loading...');

  useEffect(() => {
    if (!prayerTimes) return;

    const calculateNext = () => {
      const now = new Date();
      // Konversi "HH:mm" dari Aladhan API ke Date object hari ini
      const timeNodes = [
        { name: 'Fajr Prayer', time: prayerTimes.Fajr },
        { name: 'Dhuhr Prayer', time: prayerTimes.Dhuhr },
        { name: 'Asr Prayer', time: prayerTimes.Asr },
        { name: 'Maghrib Prayer (Iftar)', time: prayerTimes.Maghrib },
        { name: 'Isha Prayer', time: prayerTimes.Isha }
      ].map(p => {
        const [hours, minutes] = p.time.split(':');
        const d = new Date();
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return { ...p, dateObj: d };
      });

      // Cari event berikutnya yang waktunya lebih besar dari `now`
      let next = timeNodes.find(p => p.dateObj > now);
      
      // Jika semua lewat, berarti nunggu Subuh besok
      if (!next) {
        next = timeNodes[0];
        next.dateObj.setDate(next.dateObj.getDate() + 1);
      }

      setNextEventName(next.name);

      const diffMs = next.dateObj - now;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins >= 60) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeRemaining({ value: `${hrs}h ${mins}m`, unit: 'Left' });
      } else {
        setTimeRemaining({ value: diffMins, unit: 'Min' });
      }
    };

    calculateNext();
    const interval = setInterval(calculateNext, 60000); // Update setiap 1 menit

    return () => clearInterval(interval);
  }, [prayerTimes]);

  return (
    <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">schedule</span>
        Next Event
      </h3>
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="px-3 py-2 min-w-[3rem] h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary leading-none whitespace-nowrap">{timeRemaining.value}</span>
            <span className="text-[10px] uppercase font-medium mt-1">{timeRemaining.unit}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{nextEventName}</p>
            <p className="text-xs text-slate-400 italic">Prepare yourself</p>
          </div>
        </div>
        <button className="w-full py-3 bg-primary text-slate-900 font-bold rounded-xl text-sm transition-transform active:scale-95 hover:brightness-95">
          Open Full Schedule
        </button>
      </div>
    </section>
  );
}

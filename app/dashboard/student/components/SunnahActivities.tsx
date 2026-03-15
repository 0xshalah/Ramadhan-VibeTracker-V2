import React from 'react';
import type { DailyProgress } from '@/lib/schemas';

interface SunnahActivitiesProps {
  sunnah: DailyProgress['sunnah'];
  onToggle: (key: keyof DailyProgress['sunnah']) => void;
}

const sunnahItems: Array<{ key: keyof DailyProgress['sunnah']; label: string; icon: string }> = [
  { key: "tarawih", label: "Night Prayer (Tahajud)", icon: "nightlight_round" },
  { key: "sahur", label: "Pre-dawn Meal (Sahur)", icon: "set_meal" },
  { key: "sadaqah", label: "Charity (Sadaqah)", icon: "volunteer_activism" },
];

export default function SunnahActivities({ sunnah, onToggle }: SunnahActivitiesProps) {
  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500">stars</span>
        Sunnah Activities
      </h3>

      <div className="space-y-4">
        {sunnahItems.map((item) => {
          const isActive = sunnah[item.key];
          return (
            <div
              key={String(item.key)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sage-400">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              <button
                disabled={item.key === 'sadaqah'}
                onClick={() => item.key !== 'sadaqah' && onToggle(item.key)}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer active:scale-95 ${
                  isActive ? "bg-primary" : "bg-sage-200 dark:bg-slate-700"
                } ${item.key === 'sadaqah' ? 'cursor-not-allowed' : ''}`}
              >
                <div
                  className={`sunnah-knob absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out ${
                    isActive ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
              {item.key === 'sadaqah' && (
                <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {isActive ? 'Verified' : 'Required'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

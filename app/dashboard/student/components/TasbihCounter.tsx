"use client";
import React from 'react';

interface TasbihProps {
  tasbih: number;
  onIncrement: () => void;
  onReset: () => void;
}

export default function TasbihCounter({ tasbih, onIncrement, onReset }: TasbihProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-sage-100 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">touch_app</span>
            Tasbih Digital
          </h3>
          <p className="text-xs text-sage-500 font-medium">Berdzikir mengingat Allah</p>
        </div>
        <button onClick={onReset} className="text-rose-400 bg-rose-500/10 p-2 rounded-xl hover:bg-rose-500/20 transition cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        <button 
          onClick={onIncrement}
          className="w-32 h-32 rounded-full border-8 border-sage-100 dark:border-slate-800 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] cursor-pointer"
        >
          <span className="text-5xl font-black text-white">{tasbih}</span>
        </button>
        <p className="text-[10px] text-sage-400 mt-6 uppercase tracking-widest font-bold text-center">
          Tap the circle to count
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function TilawahCounter({
  tilawah,
  tilawahPct,
  onIncrement,
  onDecrement,
}) {
  const [scale, setScale] = useState("scale-100");

  const handleAdd = () => {
    setScale("scale-125");
    setTimeout(() => setScale("scale-100"), 150);
    onIncrement();
  };

  const handleRemove = () => {
    if (tilawah > 0) {
      setScale("scale-75");
      setTimeout(() => setScale("scale-100"), 150);
      onDecrement();
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-500">
          menu_book
        </span>
        Target Tilawah
      </h3>

      <div className="text-center py-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl mb-4">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
          Current Progress
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRemove}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>

          <span
            className={`text-4xl font-black text-slate-800 dark:text-slate-100 transition-transform duration-150 ${scale}`}
          >
            {tilawah}
          </span>

          <button
            onClick={handleAdd}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Halaman yang dibaca hari ini
        </p>
      </div>

      <div className="flex justify-between items-center px-2">
        <p className="text-xs font-bold text-sage-500">Target: 20 Pages</p>
        <p className="text-xs font-bold text-primary">{tilawahPct}% Done</p>
      </div>
    </section>
  );
}

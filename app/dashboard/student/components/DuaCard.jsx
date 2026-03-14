import React from 'react';

export default function DuaCard() {
  return (
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
  );
}

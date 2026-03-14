export default function NextEvent() {
  return (
    <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">schedule</span>
        Next Event
      </h3>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-primary">18</span>
            <span className="text-[10px] uppercase font-medium">Min</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Maghrib Prayer</p>
            <p className="text-xs text-slate-400 italic">
              Time to break the fast
            </p>
          </div>
        </div>

        <button className="w-full py-3 bg-primary text-slate-900 font-bold rounded-xl text-sm transition-transform active:scale-95 cursor-pointer">
          Open Full Schedule
        </button>
      </div>
    </section>
  );
}

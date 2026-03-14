const prayers = [
  { key: "subuh", label: "Subuh", time: "04:45 AM" },
  { key: "dzuhur", label: "Dzuhur", time: "12:05 PM" },
  { key: "ashar", label: "Ashar", time: "03:15 PM" },
  { key: "maghrib", label: "Maghrib", time: "06:12 PM" },
  { key: "isya", label: "Isya", time: "07:22 PM" },
];

export default function PrayerGrid({ sholat, onToggle }) {
  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">mosque</span>
          Sholat Fardhu
        </h3>
        <span className="text-xs font-bold bg-sage-50 text-sage-600 px-3 py-1 rounded-full uppercase">
          5 Daily Prayers
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {prayers.map((prayer) => {
          const isDone = sholat[prayer.key];
          return (
            <div
              key={prayer.key}
              onClick={() => onToggle(prayer.key)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-sage-50 dark:bg-slate-800/50 border border-transparent hover:border-primary/30 transition-all cursor-pointer active:scale-95"
            >
              <p className="text-xs font-bold text-sage-500 uppercase">
                {prayer.label}
              </p>
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                    : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-300"
                }`}
              >
                {isDone && (
                  <span className="material-symbols-outlined">check</span>
                )}
              </div>
              <p className="text-[10px] font-medium text-sage-400">
                {prayer.time}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

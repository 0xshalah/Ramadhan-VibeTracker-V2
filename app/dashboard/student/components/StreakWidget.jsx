export default function StreakWidget() {
  const days = [
    { letter: "M", active: true },
    { letter: "T", active: true },
    { letter: "W", active: true },
    { letter: "T", active: true },
    { letter: "F", active: false },
    { letter: "S", active: false },
    { letter: "S", active: false },
  ];

  const streakCount = days.filter((d) => d.active).length;

  return (
    <section className="bg-primary/10 dark:bg-primary/5 p-6 rounded-3xl border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">
          7-Day Streak
        </h3>
        <div className="flex items-center gap-1 text-primary">
          <span className="material-symbols-outlined fill-1">
            local_fire_department
          </span>
          <span className="font-black text-xl">{streakCount}</span>
        </div>
      </div>

      <div className="flex justify-between">
        {days.map((day, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-2 ${!day.active ? "opacity-30" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                day.active
                  ? "bg-primary text-white"
                  : "border border-slate-300 text-slate-500"
              }`}
            >
              {day.letter}
            </div>
            {day.active && (
              <div className="w-1 h-1 bg-primary rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

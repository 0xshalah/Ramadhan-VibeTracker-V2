export default function Header({ totalPct }) {
  const circumference = 175.9; // 2 * π * r(28)
  const offset = circumference - (totalPct / 100) * circumference;

  // Dynamic motivational message
  let message = "Let's start strong!";
  if (totalPct >= 100) message = "Masya Allah! Perfect! 🌟";
  else if (totalPct >= 80) message = "Almost there!";
  else if (totalPct >= 50) message = "Keep going! 💪";

  return (
    <header className="p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      {/* Greeting */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
          Assalamu&apos;alaikum, Ahmad!
        </h2>
        <div className="flex items-center gap-2 text-sage-600 dark:text-sage-400">
          <span className="material-symbols-outlined text-sm">
            calendar_today
          </span>
          <p className="text-sm font-medium">
            Tuesday, 12 March 2024 |{" "}
            <span className="text-primary font-bold">1 Ramadan 1445 AH</span>
          </p>
        </div>
      </div>

      {/* Progress Widget */}
      <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-sage-100 dark:border-slate-800">
        <div className="relative flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              className="text-sage-100 dark:text-slate-800"
              cx="32"
              cy="32"
              fill="transparent"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle
              className="text-primary"
              cx="32"
              cy="32"
              fill="transparent"
              r="28"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeWidth="6"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <span className="absolute text-sm font-bold">{totalPct}%</span>
        </div>
        <div>
          <p className="text-xs font-bold text-sage-500 uppercase tracking-wider">
            Today&apos;s Worship
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {message}
          </p>
        </div>
        <button className="bg-sage-50 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
}

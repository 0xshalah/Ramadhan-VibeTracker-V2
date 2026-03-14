const sunnahItems = [
  { key: "tarawih", label: "Shalat Tarawih", icon: "nightlight_round" },
  { key: "sahur", label: "Sahur Healthy Meal", icon: "set_meal" },
  { key: "sadaqah", label: "Daily Sadaqah", icon: "volunteer_activism" },
];

export default function SunnahActivities({ sunnah, onToggle }) {
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
              key={item.key}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sage-400">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              <button
                onClick={() => onToggle(item.key)}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-primary"
                    : "bg-sage-200 dark:bg-slate-700"
                }`}
              >
                <div
                  className="sunnah-knob absolute top-0.5 w-4 h-4 bg-white rounded-full"
                  style={{
                    transform: isActive
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

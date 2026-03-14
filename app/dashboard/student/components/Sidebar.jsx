export default function Sidebar() {
  const navItems = [
    { icon: "home", label: "Home", active: true, filled: true },
    { icon: "history", label: "History", active: false },
    { icon: "military_tech", label: "Badges", active: false },
    { icon: "person", label: "Profile", active: false },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-sage-200 dark:border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">auto_stories</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">RamadanLog</h1>
          <p className="text-xs text-sage-500 font-medium">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              item.active
                ? "bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-primary font-semibold"
                : "text-slate-500 hover:bg-sage-50 dark:hover:bg-slate-800"
            }`}
          >
            <span
              className={`material-symbols-outlined ${item.filled ? "fill-1" : ""}`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Profile Card */}
      <div className="p-6 border-t border-sage-100 dark:border-slate-800">
        <div className="bg-sage-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sage-200 dark:bg-slate-700 overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhEw5MiBrGI3zJwe9gkH_6518EriKAaivgyZYAnu1MxJQ6yZjMHJypXx8j6tHB3IFot-kXRgAFcQnzeQzO5JF9wnF0vAOHE0lfYt7GA4fEdYqnXcFN2SWof4lm2zmKkEtu6Adn6DD-LvX1vysjW_zydYR8TYMvaHGYsWBt5yy4jFZnsvRms4uXZB_WpH_p76oXoL9ATuymvwlfBsqrvzGsuqE4qnBLf56OFqV14XLMXaSbjIZeRRpOjcX8xfyVpygq4KjxmhXUH_I"
              alt="Student profile avatar"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Ahmad Fauzi</p>
            <p className="text-xs text-sage-500 truncate">Grade 11 Student</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

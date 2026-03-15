import React, { useMemo } from 'react';

// Define the shape of prayerTimes from Aladhan API
interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface DuaCardProps {
  prayerTimes: PrayerTimes | null;
}

const DUA_COLLECTION = [
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
    latin: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
    meaning: "O Allah, I ask You for beneficial knowledge, goodly provision and acceptable deeds."
  },
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbana atina fid-dunya hasanatan wa fil 'akhirati hasanatan waqina 'adhaban-nar.",
    meaning: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire."
  },
  {
    arabic: "اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ",
    latin: "Allahumma laka sumtu wa bika aamantu wa 'ala rizqika aftartu.",
    meaning: "O Allah, for Thee I have fasted, in Thee I believe, and with Thy provision I break my fast."
  },
  {
    arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    latin: "Ya Muqallibal-qulub, thabbit qalbi 'ala dinik.",
    meaning: "O Turner of the hearts, keep my heart firm upon Your religion."
  }
];

import { toast } from 'sonner';

interface DuaCardProps {
  prayerTimes: PrayerTimes | null;
  recited: boolean;
  onMarkRecited: () => void;
}

export default function DuaCard({ prayerTimes, recited, onMarkRecited }: DuaCardProps) {
  const duaOfDay = useMemo(() => {
    if (!prayerTimes) return DUA_COLLECTION[1];

    const now = new Date();
    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      return d;
    };

    const fajr = parseTime(prayerTimes.Fajr);
    const dhuhr = parseTime(prayerTimes.Dhuhr);
    const maghrib = parseTime(prayerTimes.Maghrib);
    const isha = parseTime(prayerTimes.Isha);

    if (now >= fajr && now < dhuhr) return DUA_COLLECTION[0];
    if (now >= dhuhr && now < maghrib) return DUA_COLLECTION[1];
    if (now >= maghrib && now < isha) return DUA_COLLECTION[2];
    return DUA_COLLECTION[3];
  }, [prayerTimes]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${duaOfDay.arabic}\n\n${duaOfDay.latin}\n\nArtinya: ${duaOfDay.meaning}`);
    toast.success("Dua disalin ke clipboard!");
  };

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sage-50 dark:bg-slate-800 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-bold text-sage-500 uppercase tracking-widest">Dua of the Day</h3>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
          </button>
          <button 
            onClick={onMarkRecited}
            disabled={recited}
            className={`p-2 rounded-xl transition-all ${recited ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{recited ? 'check_circle' : 'task_alt'}</span>
          </button>
        </div>
      </div>

      <p className="text-[1.35rem] font-display font-medium leading-relaxed mb-4 text-slate-800 dark:text-slate-100 italic relative z-10">
        &quot;{duaOfDay.latin}&quot;
      </p>
      <p className="text-sm text-sage-600 dark:text-sage-400 relative z-10">
        {duaOfDay.meaning}
      </p>
    </section>
  );
}


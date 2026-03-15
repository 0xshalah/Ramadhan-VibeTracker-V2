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

export default function DuaCard({ prayerTimes }: DuaCardProps) {
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

    if (now >= fajr && now < dhuhr) {
      return DUA_COLLECTION[0]; // Pagi: Ilmu, Rezeki, Amal
    } else if (now >= dhuhr && now < maghrib) {
      return DUA_COLLECTION[1]; // Siang/Sore: Rabbana Atina
    } else if (now >= maghrib && now < isha) {
      return DUA_COLLECTION[2]; // Iftar: Buka Puasa
    } else {
      return DUA_COLLECTION[3]; // Malam (Isha ke Fajr): Penetap Hati
    }
  }, [prayerTimes]);

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sage-50 dark:bg-slate-800 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
      <h3 className="text-sm font-bold text-sage-500 uppercase tracking-widest mb-4">Dua of the Day</h3>
      <p className="text-[1.35rem] font-display font-medium leading-relaxed mb-4 text-slate-800 dark:text-slate-100 italic">
        &quot;{duaOfDay.latin}&quot;
      </p>
      <p className="text-sm text-sage-600 dark:text-sage-400 relative z-10">
        {duaOfDay.meaning}
      </p>
    </section>
  );
}

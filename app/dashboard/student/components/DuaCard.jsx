import React, { useMemo } from 'react';

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

export default function DuaCard() {
  const duaOfDay = useMemo(() => {
    // Rotasi sederhana berdasarkan Day of Year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return DUA_COLLECTION[dayOfYear % DUA_COLLECTION.length];
  }, []);

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

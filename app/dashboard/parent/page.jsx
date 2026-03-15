"use client";
import React, { useEffect, useState } from 'react';
import { auth, logout, getUserProfile, getMyChildren, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return; }
      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'parent') {
        toast.error("Akses Ditolak: Anda bukan orang tua. ⚠️");
        router.push('/dashboard/student');
      } else {
        setUser({ ...u, email: profile.email || u.email });
        loadChildData(profile.email || u.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadChildData = async (email) => {
    const childList = await getMyChildren(email);
    const todayId = new Intl.DateTimeFormat('en-CA').format(new Date());
    
    // Fetch progress harian untuk setiap anak
    const enrichedChildren = await Promise.all(childList.map(async (c) => {
      const progRef = doc(db, 'users', c.uid, 'daily_progress', todayId);
      const progSnap = await getDoc(progRef);
      // Aggregate Total XP
      let userTotalXP = 0;
      if (c.dailyXP) {
        userTotalXP = Object.values(c.dailyXP).reduce((a, b) => a + b, 0);
      }
      return { ...c, progress: progSnap.exists() ? progSnap.data() : null, totalXP: userTotalXP };
    }));
    
    setChildren(enrichedChildren);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Parent Observer</h1>
          <p className="text-slate-500 text-sm">Monitoring Real-time Ibadah Anak</p>
        </div>
        <button onClick={logout} className="p-2 sm:px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors">
            Sign Out
        </button>
      </header>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map(student => {
             const sholatCount = student.progress?.sholat ? Object.values(student.progress.sholat).filter(v => v).length : 0;
             const tilawahCount = student.progress?.tilawah || 0;
             const sunnahDone = student.progress?.sunnah ? Object.values(student.progress.sunnah).filter(v => v).length : 0;
             
             return (
            <div key={student.uid} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-indigo-500 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                  {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white leading-none truncate">{student.displayName}</h3>
                  <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{student.totalXP} Vibe Points</span>
                </div>
              </div>
              
              {/* Progress Mini Grid */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold items-center">
                  <span className="text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mosque</span> Sholat Fardhu</span>
                  <div className="flex items-center gap-2">
                     <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(sholatCount / 5) * 100}%` }}></div>
                     </div>
                     <span className={sholatCount === 5 ? "text-emerald-500" : "text-slate-600 dark:text-slate-300"}>{sholatCount}/5</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold items-center">
                  <span className="text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">menu_book</span> Tilawah</span>
                  <span className="text-amber-500">{tilawahCount} <span className="text-slate-400 font-normal">Hlm</span></span>
                </div>
              </div>
            </div>
             );
          })}
          {children.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">family_restroom</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Belum Ada Anak Terdaftar</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">Pastikan anak Anda mengisi email Anda ({user?.email}) di pengaturan profil agar terhubung ke dasbor ini.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

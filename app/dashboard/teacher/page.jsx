"use client";
import React, { useEffect, useState } from 'react';
import { auth, logout, getUserProfile, getAllStudents, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return; }
      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'teacher') {
        toast.error("Akses Ditolak: Anda bukan pengajar. ⚠️");
        router.push('/dashboard/student');
      } else {
        setUser(u);
        loadStudentData();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadStudentData = async () => {
    const studentList = await getAllStudents();
    const todayId = new Intl.DateTimeFormat('en-CA').format(new Date());
    
    // Fetch progress harian untuk setiap siswa
    const enrichedStudents = await Promise.all(studentList.map(async (s) => {
      const progRef = doc(db, 'users', s.uid, 'daily_progress', todayId);
      const progSnap = await getDoc(progRef);
      // Aggregate Total XP
      let userTotalXP = 0;
      if (s.dailyXP) {
        userTotalXP = Object.values(s.dailyXP).reduce((a, b) => a + b, 0);
      }
      return { ...s, progress: progSnap.exists() ? progSnap.data() : null, totalXP: userTotalXP };
    }));
    
    setStudents(enrichedStudents);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Ustadz Dashboard</h1>
          <p className="text-slate-500 text-sm">Monitoring Real-time Progres Santri</p>
        </div>
        <div className="flex gap-4 items-center">
            {/* Navigasi Sadaqah Ledger */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span> Sadaqah Ledger
            </button>
            <button onClick={logout} className="p-2 sm:px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors">
                Sign Out
            </button>
        </div>
      </header>

      {/* Broadcast Push Notifications Actions */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
             <h3 className="font-bold text-slate-800 dark:text-white mb-1">Broadcast Notification</h3>
             <p className="text-xs text-slate-500">Kirim pengingat atau semangat ke seluruh santri (FCM).</p>
          </div>
          <div className="flex flex-1 w-full gap-2">
             <input type="text" placeholder="Tulis pesan penyemangat..." className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
             <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
               <span className="material-symbols-outlined text-[18px]">send</span> <span className="hidden sm:inline">Broadcast</span>
             </button>
          </div>
      </section>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => {
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
                  <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{student.totalXP} XP</span>
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
                <div className="flex justify-between text-xs font-bold items-center">
                  <span className="text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> Sunnah</span>
                  <span className="text-purple-500">{sunnahDone} <span className="text-slate-400 font-normal">Aksi</span></span>
                </div>
              </div>
              
              <button className="w-full mt-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition-colors border border-slate-100 dark:border-slate-800 hover:border-transparent">
                Detail Santri
              </button>
            </div>
             );
          })}
          {students.length === 0 && (
              <div className="col-span-full py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Belum Ada Santri</h3>
                  <p className="text-sm text-slate-500">Siswa dengan role 'student' akan muncul di sini.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

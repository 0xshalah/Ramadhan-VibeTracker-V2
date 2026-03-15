"use client";
import React, { useEffect, useState } from 'react';
import { getMyStudentsLive, auth, getUserProfile, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export default function TeacherPortal() {
  const [students, setStudents] = useState([]);
  const [classCode, setClassCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    let unsubscribeStudents = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/');
        return;
      }
      
      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'teacher') {
        router.push('/dashboard/student');
        return;
      }

      const assignedClass = profile?.managedClass || "BTM-01"; // Fallback to BTM-01 if teacher hasn't set one
      setClassCode(assignedClass);
      
      // Listen to students in that class Real-time
      if (assignedClass) {
        unsubscribeStudents = getMyStudentsLive(assignedClass, (data) => {
          setStudents(data);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeStudents) unsubscribeStudents();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">Class Monitoring: {classCode}</h1>
          <p className="text-slate-500 font-bold">Live Progress Tracking Santri</p>
        </div>
        <button onClick={logout} className="p-3 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-all text-sm">Sign Out</button>
      </header>
      
      {students.length === 0 ? (
         <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
               <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Belum Ada Santri</h3>
            <p className="text-sm text-slate-500">Santri dengan Class Code '{classCode}' akan termonitor secara otomatis.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(s => (
            <div key={s.uid} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100">
                    {s.photoURL ? <img src={s.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{s.displayName}</h3>
                     <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest inline-block mt-1">
                       {s.dailyXP ? Object.values(s.dailyXP).reduce((a, b) => a + b, 0) : 0} Vibe Points
                     </span>
                  </div>
               </div>
               <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs font-bold items-center">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">menu_book</span> Target Tilawah</span>
                    <span className="text-indigo-500">{s.targetTilawah || 20} Hlm</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                     {/* Simulasi progress tilawah - dalam implementasi nyata, tarik dari object tilawah daily_progress */}
                     <div className="h-full bg-indigo-500" style={{ width: '45%' }}></div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

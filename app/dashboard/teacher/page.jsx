"use client";
import React, { useEffect, useState } from 'react';
import { getStudentsLive, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function TeacherPortal() {
  const [students, setStudents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Koneksi Real-time ke Seluruh Santri
    const unsubscribe = getStudentsLive((data) => {
      setStudents(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">Portal Ustadz</h1>
          <p className="text-slate-500">Monitoring Real-time Kedisiplinan Santri</p>
        </div>
        <button onClick={logout} className="p-3 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-all">Sign Out</button>
      </header>

      {students.length === 0 && (
         <div className="text-center py-20 text-slate-500 font-bold">Memuat data real-time santri...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(student => (
          <div key={student.uid} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100">
                {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{student.displayName}</h3>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                  {student.dailyXP ? Object.values(student.dailyXP).reduce((a, b) => a + b, 0) : 0} Vibe Points
                </span>
              </div>
            </div>
            {/* Live Indicator Progres Hari Ini (Simulasi ringkasan data profil) */}
            <div className="space-y-2">
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">menu_book</span> Target Tilawah</span>
                 <span className="text-indigo-500">{student.targetTilawah || 20} Hlm</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: '65%' }}></div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

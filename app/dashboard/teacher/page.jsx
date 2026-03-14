"use client";
import React, { useEffect, useState } from 'react';
import { auth, logout, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/');
        return;
      }
      
      // [SECURITY FIX] Role-Based Access Control Enforcer
      const profile = await getUserProfile(u.uid);
      
      if (profile?.role !== 'teacher') { 
        console.warn("Unauthorized access attempt. Redirecting...");
        router.push('/dashboard/student'); 
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <main className="flex-1 p-12 flex flex-col items-center justify-center text-center relative">
        {/* Tombol Logout Penyelamat */}
        <div className="absolute top-8 right-8">
           <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm">
             <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
           </button>
        </div>

        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 mb-6 animate-pulse">
          <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
        </div>
        <h1 className="text-3xl font-black mb-4 text-slate-800 dark:text-white">Teacher Portal</h1>
        <p className="text-sage-500 max-w-md mb-8">
          Welcome, Ustadz/Ustadzah {user?.displayName?.split(' ')[0] || ''}. The verification dashboard to monitor your students' Tilawah and Sunnah progress is currently rolling out in Phase 2.
        </p>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 max-w-sm w-full text-left shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Upcoming Features:</h3>
           <ul className="text-sm text-sage-600 space-y-2">
             <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> Bulk Sadaqah Verification</li>
             <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> Student Progress Grid</li>
             <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> Broadcast Push Notifications</li>
           </ul>
        </div>
      </main>
    </div>
  );
}

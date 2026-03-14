"use client";
import React, { useEffect, useState } from 'react';
import { auth, logout, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ParentDashboard() {
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
      
      if (profile?.role !== 'parent') { 
        toast.error("Akses Ditolak: Anda bukan orang tua. ⚠️");
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
        <div className="absolute top-8 right-8">
           <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm">
             <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
           </button>
        </div>

        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mb-6">
          <span className="material-symbols-outlined text-4xl">supervisor_account</span>
        </div>
        <h1 className="text-3xl font-black mb-4 text-slate-800 dark:text-white">Parent Observer</h1>
        <p className="text-sage-500 max-w-md">
          Assalamu'alaikum. The parent monitoring dashboard to observe your child's spiritual consistency is under development (Phase 2). 
        </p>
      </main>
    </div>
  );
}

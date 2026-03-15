"use client";
import React, { useEffect, useState } from 'react';
import { getMyStudentsLive, auth, getUserProfile, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { UserProfile } from '@/lib/schemas';
import Link from 'next/link';

// Define strict typing for students with UID
type EnrichedStudent = UserProfile & { 
  uid: string;
  dailyXP?: Record<string, number>;
  streak?: number;
  classCode?: string;
};

function TeacherDashboardContent() {
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [classCode, setClassCode] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    let unsubscribeStudents: (() => void) | null = null;
    
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

      const assignedClass = profile?.managedClass || "BTM-01"; // Fallback to BTM-01
      setClassCode(assignedClass);
      
      // Listen to students in that class Real-time (Already uses onSnapshot internally)
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
          <p className="text-slate-500 font-bold">Live Student Progress Tracking</p>
        </div>
        <button onClick={logout} className="p-3 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-all text-sm cursor-pointer">Sign Out</button>
      </header>
      
      {students.length === 0 ? (
         <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
               <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">No Students Found</h3>
            <p className="text-sm text-slate-500">Students with Class Code &apos;{classCode}&apos; will be monitored automatically.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(s => {
             const xpKeys = s.dailyXP ? Object.keys(s.dailyXP) : [];
             const totalPoints = xpKeys.reduce((a, b) => a + (s.dailyXP![b] || 0), 0);
             
             return (
              <Link key={s.uid} href={`/dashboard/teacher/student/${s.uid}`} className="block bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl group cursor-pointer">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      {s.photoURL ? <img src={s.photoURL} alt={s.displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.displayName}</h3>
                       <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest inline-block mt-1">
                         {totalPoints} Vibe Points
                       </span>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">arrow_forward_ios</span>
                 </div>
                 <div className="space-y-3 mt-4">
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">local_fire_department</span> Streak</span>
                      <span className="text-orange-500">{s.streak || 0} Days</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500" style={{ width: `${Math.min(((s.streak || 0) / 30) * 100, 100)}%` }}></div>
                    </div>
                 </div>
              </Link>
             );
          })}
        </div>
      )}
    </div>
  );
}

function FallbackTeacherError({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl border border-red-200 dark:border-red-800">
      <h3 className="font-bold mb-2">An error occurred in the Teacher Dashboard</h3>
      <p className="text-sm opacity-80 mb-4">{error.message}</p>
      <button onClick={resetErrorBoundary} className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm font-bold">
        Retry
      </button>
    </div>
  );
}

export default function TeacherPortal() {
  return (
    <ErrorBoundary FallbackComponent={FallbackTeacherError}>
      <TeacherDashboardContent />
    </ErrorBoundary>
  );
}

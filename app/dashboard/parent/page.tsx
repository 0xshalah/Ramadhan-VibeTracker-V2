"use client";

import React, { useEffect, useState } from 'react';
import { auth, getUserProfile, getUserWeeklyProgress, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [childData, setChildData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return; }
      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'parent' && profile?.role !== 'admin') {
        router.push('/dashboard/student');
        return;
      }
      setParentName(profile.displayName || u.displayName || 'Parent');
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSearchChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    
    setIsSearching(true);
    setChildData(null);
    try {
      const targetId = studentIdInput.trim();
      const [profile, weekly] = await Promise.all([
        getUserProfile(targetId),
        getUserWeeklyProgress(targetId)
      ]);
      
      if (!profile || profile.role !== 'student') {
        toast.error("Student not found or invalid ID.");
        return;
      }
      
      // Calculate XP
      const totalXP = profile.totalXP ?? (profile.dailyXP ? Object.values(profile.dailyXP).reduce((a, b) => a + (b as number || 0), 0) : 0);
      
      setChildData({
        ...profile,
        uid: targetId,
        computedXP: totalXP,
        weekly
      });
      toast.success("Child data linked successfully! (Session only)");
    } catch (error) {
       toast.error("Failed to fetch child data.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Assalamu'alaikum, {parentName.split(' ')[0]}!</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Parent Observer Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-[18px]">home</span>
          </Link>
          <button onClick={logout} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      {!childData ? (
        <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-indigo-400 text-3xl">family_restroom</span>
          </div>
          <h2 className="text-2xl font-black mb-3">Link Your Child</h2>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
            Enter your child's unique Student ID to monitor their spiritual progress in real-time during Ramadhan.
          </p>
          
          <form onSubmit={handleSearchChild} className="flex gap-3 max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="Enter Student ID (e.g., L3kX...)" 
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Connect'}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-300">Observing: <span className="text-white">{childData.displayName}</span></h2>
            <button onClick={() => setChildData(null)} className="text-sm text-slate-500 hover:text-white underline">Unlink</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center shadow-lg">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-emerald-400">military_tech</span>
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total XP</h3>
                <p className="text-3xl font-black text-white">{childData.computedXP.toLocaleString()}</p>
             </div>
             
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center shadow-lg">
                <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-orange-400">local_fire_department</span>
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Streak</h3>
                <p className="text-3xl font-black text-white">{childData.streak || 0} Days</p>
             </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">auto_stories</span>
                Recent Quran Recitation
             </h3>
             {childData.weekly?.length > 0 ? (
               <div className="space-y-3">
                 {childData.weekly.slice(0, 5).map((w: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                     <span className="text-slate-300 font-medium">{new Date(w.dateId).toLocaleDateString()}</span>
                     <span className="font-bold text-indigo-400">{w.tilawah || 0} Pages</span>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-slate-500 text-center py-4 bg-slate-800/30 rounded-xl">No weekly data available yet.</p>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

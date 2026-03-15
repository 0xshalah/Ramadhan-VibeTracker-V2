"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../student/components/Sidebar';
import { auth, logout, getUserProfile, updateUserSettings } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [target, setTarget] = useState(20);
  const [parentEmail, setParentEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const data = await getUserProfile(u.uid);
        if (data) {
          setProfile(data);
          if (data.targetTilawah) setTarget(data.targetTilawah);
          if (data.parentEmail) setParentEmail(data.parentEmail);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
       await updateUserSettings(user.uid, { 
         targetTilawah: parseInt(target) || 20, 
         parentEmail: parentEmail.trim() 
       });
       toast.success("Pengaturan profil berhasil diperbarui! 🌙");
    } catch(e) {
       toast.error("Gagal memperbarui profil.");
    } finally {
       setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto w-full">
         <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-sage-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl">
               {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  <span className="material-symbols-outlined text-4xl text-sage-400">person</span>
               )}
            </div>
            <h1 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">{user?.displayName || 'Student Profile'}</h1>
            <p className="text-sage-500 mb-8">{user?.email || 'Ramadan VibeTracker User'}</p>
            
            <div className="space-y-6">
              {/* Spiritual Settings */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
                 <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <span className="material-symbols-outlined text-primary">local_fire_department</span> Spiritual Goals
                 </h3>
                 
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Target Tilawah Harian (Halaman)</label>
                      <input 
                         type="number" 
                         value={target} 
                         onChange={(e) => setTarget(e.target.value)} 
                         min="1" max="604"
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                 </div>
              </div>

              {/* Observer Settings */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
                 <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <span className="material-symbols-outlined text-amber-500">family_restroom</span> Parent Observer Linking
                 </h3>
                 
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Email Orang Tua/Wali</label>
                      <input 
                         type="email" 
                         value={parentEmail} 
                         onChange={(e) => setParentEmail(e.target.value)} 
                         placeholder="contoh: ayah@gmail.com"
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-800 dark:text-white"
                      />
                      <p className="text-xs text-sage-500 mt-2">Dengan memasukkan email ini, orang tua Anda dapat memantau progres ibadah Anda melalui Parent Observer Dashboard.</p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                 <button onClick={() => router.push('/dashboard/student')} className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold">Batal / Kembali</button>
                 <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-primary text-white font-bold rounded-2xl active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20">
                   {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'} <span className="material-symbols-outlined text-[18px]">save</span>
                 </button>
              </div>
            </div>
         </div>
      </main>
    </div>
  );
}

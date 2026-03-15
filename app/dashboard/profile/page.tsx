"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateUserAvatar, deleteUserAccount, logout } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, totalXP, streak, setUser } = useVibeStore();
  const [quranTarget, setQuranTarget] = useState(12);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [prefs, setPrefs] = useState({ prayerReminders: true, subuhWakeup: false });
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Initialize from store
  useEffect(() => {
    if (user) {
      setAvatar(user.photoURL || null);
    }
    if (user && (user as any).targetTilawah) {
      setQuranTarget((user as any).targetTilawah);
    }
    if (user && (user as any).preferences) {
      setPrefs((user as any).preferences);
    }
  }, [user]);

  // Debounced Auto-Save removed in favor of manual Save button as requested for V2
  // But let's keep the initialization logic
  
  const handleSaveTarget = async () => {
    if (!user) return;
    setIsSavingTarget(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { targetTilawah: quranTarget });
      setUser({ ...user, targetTilawah: quranTarget } as any);
      toast.success("Tilawah Target updated! 🎯");
    } catch (e) {
      toast.error("Failed to save target.");
    } finally {
      setIsSavingTarget(false);
    }
  };
  
  const handleTogglePref = async (key: 'prayerReminders' | 'subuhWakeup') => {
    if (!user) return;
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setIsSavingPrefs(true);
    try {
      const { updateUserPreferences } = await import('@/lib/firebase');
      const success = await updateUserPreferences(user.uid, newPrefs);
      if (success) {
        setUser({ ...user, preferences: newPrefs } as any);
        toast.success("Settings updated! ✨");
      }
    } catch (e) {
      toast.error("Failed to update settings.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!user) return;
    setIsProcessingAvatar(true);
    try {
      // Generate a random seed for DiceBear 9.x
      const seed = Math.random().toString(36).substring(7);
      const randomAvatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
      
      const success = await updateUserAvatar(user.uid, randomAvatarUrl);
      if (success) {
        // Optimistically update store
        setUser({ ...user, photoURL: randomAvatarUrl } as any);
        toast.success("Magic Avatar generated! 🎲✨");
      } else {
        toast.error("Failed to update avatar.");
      }
    } catch (error) {
       toast.error("An error occurred while generating avatar.");
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Batasi ukuran gambar (max 500KB) agar Firestore tidak penuh
    if (file.size > 512 * 1024) {
      toast.error("File is too large! Maximum 500KB allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatar(base64String); 
      
      try {
        const success = await updateUserAvatar(user.uid, base64String);
        if (success) {
          toast.success("Profile photo updated! 📸");
          setUser({ ...user, photoURL: base64String } as any);
        } else {
          toast.error("Failed to save photo.");
        }
      } catch (e) {
        toast.error("Error uploading photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Danger Zone! Are you absolutely sure?")) return;
    setIsDeleting(true);
    try {
      const success = await deleteUserAccount(user);
      if (success) {
        toast.success("Account deleted. Goodbye! 🌅");
        setUser(null);
        await logout();
        router.push('/');
      } else {
        toast.error("Failed to delete account.");
      }
    } catch (error: any) {
      // HANDLE RE-AUTH ERRORS HERE
      if (error?.message?.includes('requires-recent-login')) {
        toast.error("System Security: Please Logout and Login again before deleting your account.");
      } else {
        toast.error("System error during deletion.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="text-xl font-bold">Profile &amp; Settings</h1>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-8 mt-4">
        {/* Identity Header */}
        <section className="flex flex-col items-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 group">
            <img 
              src={avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isProcessingAvatar}
              className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
            />
          </div>
          <h2 className="text-2xl font-bold mt-4">{user?.displayName || 'Student'}</h2>
          <div className="flex flex-col items-center gap-2 mt-2">
            <button 
              onClick={handleGenerateAvatar}
              disabled={isProcessingAvatar}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">casino</span>
              Generate Random Avatar
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-3">{user?.email || 'email@notfound.com'}</p>
        </section>

        {/* Lifetime Stats */}
        <section className="bg-slate-800 rounded-3xl p-6 border border-slate-700 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center text-center">
            <div className="bg-emerald-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-emerald-400">military_tech</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total XP</span>
            <span className="text-xl font-bold mt-1">{totalXP}</span>
          </div>
          <div className="flex flex-col items-center text-center border-x border-slate-700">
            <div className="bg-orange-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-orange-400">local_fire_department</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Streak</span>
            <span className="text-xl font-bold mt-1">{streak} <small className="text-xs font-normal">Days</small></span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-500/20 p-3 rounded-xl mb-3"><span className="material-symbols-outlined text-blue-400">done_all</span></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Prayers</span>
            <span className="text-xl font-bold mt-1">128</span>
          </div>
        </section>

        {/* Dynamic Preferences */}
        <section className="space-y-6">
          {/* Target Slider */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">menu_book</span>
                <h3 className="font-bold text-white text-lg">Daily Quran Target</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-500/20">{quranTarget} Pages</span>
                <button 
                  onClick={handleSaveTarget} 
                  disabled={isSavingTarget} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingTarget ? '...' : 'Save'}
                </button>
              </div>
            </div>
            <input 
              type="range" min="1" max="30" 
              value={quranTarget} onChange={(e) => setQuranTarget(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
            <div className="flex justify-between mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>1 Page</span>
                <span>Juz&apos; 1</span>
                <span>30 Pages</span>
            </div>
          </div>

          {/* System Toggles */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-emerald-500">notifications_active</span>
              <h3 className="font-bold text-white text-lg">Notifications</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Prayer Reminders</p>
                <p className="text-xs text-slate-400 mt-1">Get notified for each prayer time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={prefs.prayerReminders} 
                  onChange={() => handleTogglePref('prayerReminders')}
                  disabled={isSavingPrefs}
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <hr className="border-slate-700/50" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Subuh Wake-up Call</p>
                <p className="text-xs text-slate-400 mt-1">Enable alarm 15 mins before Subuh</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={prefs.subuhWakeup}
                  onChange={() => handleTogglePref('subuhWakeup')}
                  disabled={isSavingPrefs}
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <footer className="pt-8 pb-4 text-center">
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 w-full py-4 text-rose-500 font-medium bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 border border-rose-500/10 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                Deleting Account...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">delete_forever</span>
                Delete Account
              </>
            )}
          </button>
          <p className="mt-6 text-xs text-slate-500 tracking-widest uppercase font-bold">VibeTracker V2.4.0</p>
        </footer>
      </main>
    </div>
  );
}

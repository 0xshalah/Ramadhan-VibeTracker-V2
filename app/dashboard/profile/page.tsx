"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateUserAvatar, deleteUserAccount, logout, auth } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { userRole, setUser, setUserRole } = useVibeStore();
  const [user, setLocalUser] = useState<any>(null);
  const [quranTarget, setQuranTarget] = useState(12);
  const [avatar, setAvatar] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setLocalUser(u);
        setAvatar(u.photoURL || "");
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024) {
      toast.error("File is too large! Maximum 1MB allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatar(base64String); // Optimistic UI update
      
      toast.promise(updateUserAvatar(user.uid, base64String), {
        loading: 'Saving profile photo...',
        success: (success) => {
          if (!success) throw new Error('Database update failed');
          return "Profile photo updated successfully! 📸";
        },
        error: "Failed to save photo."
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm("Danger Zone! Are you absolutely sure?")) return;
    setIsDeleting(true);
    try {
      const success = await deleteUserAccount(user);
      if (success) {
        toast.success("Account deleted. Goodbye! 🌅");
        setUser(null);
        setUserRole('student');
        await logout();
        router.push('/');
      }
    } catch (error: any) {
      if (error.message?.includes('requires-recent-login')) {
        toast.error("Security Guard: Please logout and login again before deleting your account.");
      } else {
        toast.error("System error during deletion.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white">Loading...</div>;

  return (
    // FIX: Dynamic Light/Dark Theme Wrapper
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white p-6 md:p-10 transition-colors duration-300 font-sans pb-24">
      <nav className="flex justify-between items-center mb-10 max-w-2xl mx-auto">
        <Link href={`/dashboard/${userRole === 'admin' ? 'admin' : userRole === 'teacher' ? 'teacher' : 'student'}`} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Profile & Settings</h1>
        <div className="w-6"></div>
      </nav>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-sm transition-colors duration-300">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 group">
            <img 
              src={avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-xl"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-400 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.displayName}</h2>
          <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
          <div className="mt-4 inline-block px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
            {userRole} Account
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500">menu_book</span>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daily Quran Target</h3>
            </div>
            <span className="bg-slate-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-200 dark:border-slate-700">
              {quranTarget} Pages
            </span>
          </div>
          <input 
            type="range" 
            min="1" max="50" 
            value={quranTarget} 
            onChange={(e) => setQuranTarget(parseInt(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
            <span>1 Page</span>
            <span>50 Pages</span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50 dark:bg-rose-500/5 rounded-3xl p-6 border border-rose-200 dark:border-rose-500/10 transition-colors duration-300">
          <h3 className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span> Danger Zone
          </h3>
          <p className="text-sm text-rose-700/70 dark:text-rose-400/70 mb-4">
            Once you delete your account, there is no going back. All your worship data will be permanently erased.
          </p>
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20 border-none"
          >
            {isDeleting ? 'Deleting Protocol Initiated...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

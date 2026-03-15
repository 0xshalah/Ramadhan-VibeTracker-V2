"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle } from '@/lib/firebase';
import { toast, Toaster } from 'sonner';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'student' | 'staff'>('student');
  const router = useRouter();

  const handleLogin = async (mode: 'student' | 'staff') => {
    setIsLoading(true);
    setLoginMode(mode);
    try {
      const loggedUser = await loginWithGoogle();

      // [RBAC] Smart Redirect with Role Escalation Guard
      if (mode === 'staff') {
        // Staff Gateway: Only teachers/admins/parents may enter
        if (loggedUser.role === 'teacher') {
          router.push("/dashboard/teacher");
        } else if (loggedUser.role === 'parent') {
          router.push("/dashboard/parent");
        } else {
          // Role Escalation Blocked: Student clicked Staff Login
          toast.error('Access Denied', {
            description: 'Your account is registered as a Student. Contact your institution administrator for staff access.',
            duration: 5000,
          });
          router.push("/dashboard/student");
        }
      } else {
        // Student Gateway: Route based on actual role
        if (loggedUser.role === 'teacher') {
          router.push("/dashboard/teacher");
        } else if (loggedUser.role === 'parent') {
          router.push("/dashboard/parent");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (error) {
      // console.error("Login failed", error);error
      toast.error('Login Failed', {
        description: 'Could not connect to Google. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-background-light text-slate-900 flex flex-col scroll-smooth">
      <Toaster position="top-center" richColors />

      {/* Navbar */}
      <header className="px-8 py-6 flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-sm">auto_stories</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight">VibeTracker</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-sage-500">
            <a href="#features" className="hover:text-primary transition-colors cursor-pointer">Features</a>
            <a href="#about" className="hover:text-primary transition-colors cursor-pointer">About</a>
          </div>
          {/* Staff Login in Navbar — Elegant secondary entry */}
          <button
            onClick={() => handleLogin('staff')}
            disabled={isLoading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">shield_person</span>
            {isLoading && loginMode === 'staff' ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : (
              'Staff Login'
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-12 md:mt-0">
        {/* TestSprite Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          AI-Tested with TestSprite
        </div>

        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-tight max-w-4xl mb-6">
          Elevate Your <span className="text-primary">Ramadan</span> Journey.
        </h2>

        <p className="text-lg md:text-xl text-sage-500 max-w-2xl mb-12 leading-relaxed">
          The all-in-one spiritual companion. Track your prayers, monitor your
          daily tilawah, and build consistency throughout Ramadan.
        </p>

        {/* Dual Gateway Login */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm mb-8">
          {/* Primary CTA: Student Login */}
          <button
            onClick={() => handleLogin('student')}
            disabled={isLoading}
            className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:border-primary/50 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading && loginMode === 'student' ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>
          <p className="text-xs text-sage-500">
            Secure authentication powered by Firebase.
          </p>
        </div>

        {/* Visual separation */}
        <div className="flex items-center gap-4 w-full max-w-sm mb-8">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Secondary CTA: Staff / Teacher Login */}
        <div className="flex flex-col items-center gap-2 w-full max-w-sm mb-16">
          <button
            onClick={() => handleLogin('staff')}
            disabled={isLoading}
            className="cursor-pointer w-full flex items-center justify-center gap-3 bg-slate-50 border border-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading && loginMode === 'staff' ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">school</span>
                Sign in as Teacher / Staff
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400">
            For staff accounts pre-registered by your institution administrator.
          </p>
        </div>

        {/* Features Content */}
        <section id="features" className="w-full max-w-4xl py-12 border-t border-slate-200">
          <h3 className="text-2xl font-bold mb-6">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-primary mb-2 text-3xl">mosque</span>
              <h4 className="font-bold mb-2">Geolocation Prayer Times</h4>
              <p className="text-sm text-sage-600">Accurate prayer tracking utilizing local timezones synced directly with the Kemenag API.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-indigo-500 mb-2 text-3xl">import_contacts</span>
              <h4 className="font-bold mb-2">Tilawah &amp; Sunnah Manager</h4>
              <p className="text-sm text-sage-600">Track Quranic reading targets and daily sunnahs to enhance your spiritual streak points.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-amber-500 mb-2 text-3xl">cloud_sync</span>
              <h4 className="font-bold mb-2">Firebase Deep Sync</h4>
              <p className="text-sm text-sage-600">Secure daily data binding. Never lose your religious progression throughout Ramadhan.</p>
            </div>
          </div>
        </section>

        {/* About Content */}
        <section id="about" className="w-full max-w-4xl py-12 border-t border-slate-200 text-center">
            <h3 className="text-2xl font-bold mb-4">About VibeTracker V2</h3>
            <p className="text-sage-600 w-full sm:w-2/3 mx-auto">
              Ramadhan VibeTracker V2 is engineered entirely by <strong>Antigravity (Agentic AI)</strong> under the supervision of the Chief Architect. A testament to rapid zero-to-production workflows featuring Google Firebase, Next.js, and strict API logic.
            </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-sage-500 border-t border-slate-200/50 mt-12 bg-white">
        <p>
          © 2026 Ramadhan VibeTracker. Built for Season 01: One Week to Ship.
        </p>
      </footer>
    </div>
  );
}

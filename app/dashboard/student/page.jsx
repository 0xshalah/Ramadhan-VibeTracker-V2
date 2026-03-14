"use client";

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PrayerGrid from './components/PrayerGrid';
import TilawahCounter from './components/TilawahCounter';
import SunnahActivities from './components/SunnahActivities';
import NextEvent from './components/NextEvent'; 
import DuaCard from './components/DuaCard';
import StreakWidget from './components/StreakWidget';
import Modal from './components/Modal';
import { auth, db, loginWithGoogle, getUserProgress, getUserProfile, updateUserProgress, getUserWeeklyProgress, getLocalTodayId, logout, messaging, saveNotificationToken } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, limit, onSnapshot, where } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';

export default function StudentDashboard() {
  // DB & AUTH STATE
  const [user, setUser] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // LOGIC STATE
  const [tilawah, setTilawah] = useState(0);
  const [targetTilawah, setTargetTilawah] = useState(20);
  
  const [sholat, setSholat] = useState({
    subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false
  });

  const [sunnah, setSunnah] = useState({
    tarawih: false, sahur: false, sadaqah: false
  });

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState('Loading...');
  const [toastMessage, setToastMessage] = useState('');
  
  const [streakHistory, setStreakHistory] = useState([]);
  const [verifiedSadaqah, setVerifiedSadaqah] = useState(false);
  const [syncStatus, setSyncStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // REFS FOR AVOIDING UNNECESSARY DB WRITES ON LOAD
  const isInitialLoad = useRef(true);

  // AUTH OBSERVER & DB FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const todayId = getLocalTodayId();
        const cloudData = await getUserProgress(currentUser.uid, todayId);
        if (cloudData) {
          if (cloudData.tilawah !== undefined) setTilawah(cloudData.tilawah);
          if (cloudData.targetTilawah !== undefined) setTargetTilawah(cloudData.targetTilawah);
          if (cloudData.sholat) setSholat(cloudData.sholat);
          if (cloudData.sunnah) setSunnah(cloudData.sunnah);
        }
        
        // [DECREE 2] Fetch Target from Profile (Persistence)
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.targetTilawah) {
          setTargetTilawah(profile.targetTilawah);
        }
        
        // Fetch streak history
        const weeklyData = await getUserWeeklyProgress(currentUser.uid);
        if (weeklyData) {
          setStreakHistory(weeklyData); // Keep original order, StreakWidget will handle reversed check
        }
        
        // Resolve initial load only after all await calls finish
        isInitialLoad.current = false;
      }
      setLoadingContext(false);
    });
    return () => unsubscribe();
  }, []);

  // DB SYNC ENGINE (TWO-WAY BINDING)
  useEffect(() => {
    if (user && !isInitialLoad.current && !loadingContext) {
      setSyncStatus('saving');
      const todayId = getLocalTodayId();
      
      // Materialize Vibe Points to Payload
      const sunnahDoneCount = (sunnah.tarawih ? 1 : 0) + (sunnah.sahur ? 1 : 0) + (verifiedSadaqah ? 1 : 0);
      const sunnahBonusXP = sunnahDoneCount * 5;
      
      const payload = { tilawah, targetTilawah, sholat, sunnah, earnedXP: sunnahBonusXP };
      
      // Debounce saving
      const timer = setTimeout(async () => {
        try {
          await updateUserProgress(user.uid, todayId, payload);
          setSyncStatus('saved');
        } catch(e) {
          setSyncStatus('error');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, tilawah, targetTilawah, sholat, sunnah, loadingContext]);

  // PREVENT ACCIDENTAL CLOSE WHEN SAVING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (syncStatus === 'saving') {
        const payload = { tilawah, targetTilawah, sholat, sunnah };
        const todayId = getLocalTodayId();
        updateUserProgress(user?.uid, todayId, payload); // Force fire
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus, tilawah, targetTilawah, sholat, sunnah, user]);

  // REAL-TIME SADAQAH VERIFIER (TIME-BOUND)
  useEffect(() => {
    if (user) {
      const todayId = getLocalTodayId();
      const sadaqahRef = collection(db, 'users', user.uid, 'sadaqah');
      const q = query(sadaqahRef, where('dateId', '==', todayId), limit(1)); 
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setVerifiedSadaqah(!snapshot.empty);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // [DECREE 10] WEB PUSH & FCM INITIALIZATION
  useEffect(() => {
    if (user && typeof window !== 'undefined' && messaging) {
      const initMessaging = async () => {
        try {
          // [DECREE 10] Explicit Service Worker Registration
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[FCM] SW registered:', registration.scope);
          }

          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getToken(messaging, { 
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
            });
            if (token) {
              await saveNotificationToken(user.uid, token);
            }
          }
        } catch (error) {
          console.error("[FCM] Notification setup failed:", error);
        }
      };
      initMessaging();

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground message received:', payload);
        showToast(`📢 ${payload.notification.title}: ${payload.notification.body}`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // [SECURITY FIX] LOCAL PRAYER REMINDERS (Memory Leak Patched)
  useEffect(() => {
    if (!prayerTimes || !user) return;

    const timeouts = [];
    const now = new Date();

    Object.entries(prayerTimes).forEach(([name, time]) => {
      if (['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(name)) {
        const [hours, minutes] = time.split(':');
        const prayerDate = new Date();
        prayerDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const timeToPrayer = prayerDate.getTime() - now.getTime();
        if (timeToPrayer > 0) {
          const tId = setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification(`Waktunya Sholat ${name}`, {
                body: `Mari tunaikan ibadah sholat ${name} tepat waktu. ✨`,
                icon: '/favicon.ico'
              });
            }
          }, timeToPrayer);
          timeouts.push(tId);
        }
      }
    });

    return () => timeouts.forEach(clearTimeout); // [FIX] Prevent Memory Leak
  }, [prayerTimes, user]);

  // [DECREE 3] THE MIDNIGHT GHOST KILLER
  useEffect(() => {
    if (!user) return;
    const initialDateId = getLocalTodayId();
    const interval = setInterval(() => {
      const currentDateId = getLocalTodayId();
      if (currentDateId !== initialDateId) {
        window.location.reload(); 
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [user]);

  // [DECREE 5] Modal Body Scroll Lock
  useEffect(() => {
    if (isScheduleOpen || isNotifOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isScheduleOpen, isNotifOpen]);

  // ALADHAN API INTEGRATION (METHOD=20 [KEMENAG RI] & DYNAMIC GEOLOCATION)
  useEffect(() => {
    async function fetchPrayerTimes() {
      // Fungsi untuk menghubungi API setelah mendapat koordinat atau fall-back
      const getFromAPI = async (lat = 1.0456, lng = 104.0305, isFallback = true) => { // Fallback Batam
        try {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=20`);
          const data = await res.json();
          if (data && data.data) {
            const timings = data.data.timings;
            setPrayerTimes(timings);
            
            if (data.data.date && data.data.date.hijri) {
               const hijri = data.data.date.hijri;
               
               // [DECREE 4] Hijriah Pasca-Maghrib Fix
               const now = new Date();
               const [maghribH, maghribM] = timings.Maghrib.split(':');
               const maghribTime = new Date();
               maghribTime.setHours(parseInt(maghribH, 10), parseInt(maghribM, 10), 0, 0);
               
               if (now >= maghribTime) {
                   const tomorrowHijriDay = parseInt(hijri.day, 10) + 1;
                   setHijriDate(`${tomorrowHijriDay} ${hijri.month.en} ${hijri.year} AH (Post-Maghrib)`);
               } else {
                   setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
               }
            }
          }
          if (isFallback) {
             setToastMessage("Menggunakan zona waktu Batam (Default). Aktifkan GPS untuk akurasi lokasi.");
             setTimeout(() => setToastMessage(''), 6000);
          }
        } catch (error) {
          console.error("Failed fetching Aladhan API", error);
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            getFromAPI(position.coords.latitude, position.coords.longitude, false);
          },
          (error) => {
            console.warn("Geolocation denied or failed. Fallback to default (Batam).", error);
            getFromAPI(); // Panggil dengan fallback
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser. Fallback to default.");
        getFromAPI();
      }
    }
    fetchPrayerTimes();
  }, []);

  // THE LOGIC ENGINE: Pemisahan Core & Bonus Sunnah
  const safeTarget = Math.max(1, targetTilawah); // [DECREE 1] Anti-Zero Division
  const tilawahPct = Math.min(Math.round((tilawah / safeTarget) * 100), 100);
  
  const prayersDone = Object.values(sholat).filter(v => v).length;
  const sholatPct = (prayersDone / 5) * 100;
  
  // Core Progress (Max 100%)
  const corePct = Math.min(Math.round((sholatPct * 0.5) + (tilawahPct * 0.5)), 100);
  
  // Hitung jumlah sunnah yang dikerjakan (0 s/d 3)
  const sunnahDoneCount = (sunnah.tarawih ? 1 : 0) + (sunnah.sahur ? 1 : 0) + (verifiedSadaqah ? 1 : 0);
  // Berikan 5% bonus XP per ibadah sunnah yang dijalankan
  const sunnahBonusXP = sunnahDoneCount * 5;

  // HANDLERS
  const handlePrayerToggle = (key) => setSholat(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSunnahToggle = (key) => setSunnah(prev => ({ ...prev, [key]: !prev[key] }));
  const handleTilawahInc = () => setTilawah(prev => prev + 1);
  const handleTilawahDec = () => setTilawah(prev => Math.max(0, prev - 1));
  const handleUpdateTarget = (val) => setTargetTilawah(val);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // LOGIN SCREEN (AUTH GUARD)
  if (loadingContext) return <div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500 font-bold">Loading spiritual journey...</div>;

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark font-display">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-sage-100 dark:border-slate-800">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">auto_stories</span>
           </div>
           <h1 className="text-2xl font-black mb-2 text-slate-800 dark:text-slate-100">Ramadhan VibeTracker</h1>
           <p className="text-sm text-sage-500 mb-8">Sign in to track your spiritual journey and synchronize your progress securely.</p>
           <button onClick={loginWithGoogle} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-95 border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined">login</span>
              Continue with Google
           </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <Sidebar user={user} onLogout={logout} />
        
        <main className="flex-1 overflow-y-auto scroll-smooth relative">
          {/* TOASTS & INDICATORS */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-bounce">
              {toastMessage}
            </div>
          )}
          
          <div className="absolute top-4 right-8 z-50 flex items-center gap-2">
             {syncStatus === 'saving' && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase animate-fade-in-down">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Saving...
                </div>
             )}
             {syncStatus === 'saved' && !isInitialLoad.current && (
                <div className="flex items-center gap-1.5 bg-sage-100/80 dark:bg-slate-800/80 backdrop-blur-md text-sage-600 dark:text-sage-300 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-opacity duration-1000 opacity-50 hover:opacity-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Saved
                </div>
             )}
          </div>

          <Header corePct={corePct} sunnahBonusXP={sunnahBonusXP} hijriDate={hijriDate} user={user} showToast={showToast} onOpenNotif={() => setIsNotifOpen(true)} />
          
          <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <PrayerGrid sholat={sholat} onToggle={handlePrayerToggle} dynamicTimes={prayerTimes} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SunnahActivities sunnah={{...sunnah, sadaqah: verifiedSadaqah}} onToggle={handleSunnahToggle} />
                <TilawahCounter 
                  tilawah={tilawah} 
                  targetTilawah={targetTilawah}
                  tilawahPct={tilawahPct} 
                  onIncrement={handleTilawahInc} 
                  onDecrement={handleTilawahDec} 
                  onUpdateTarget={handleUpdateTarget}
                />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
              <StreakWidget history={streakHistory} />
              <DuaCard prayerTimes={prayerTimes} />
              <NextEvent prayerTimes={prayerTimes} showToast={showToast} onOpenSchedule={() => setIsScheduleOpen(true)} />
            </div>
          </div>
        </main>
      </div>

      {/* ACTUAL MODALS */}
      <Modal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        title="Full Prayer Schedule"
      >
        <div className="space-y-4">
           {prayerTimes ? Object.entries(prayerTimes).filter(([k]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(k)).map(([name, time]) => (
              <div key={name} className="flex justify-between items-center p-4 bg-sage-50 dark:bg-slate-800 rounded-2xl hover:scale-[1.02] transition-transform">
                 <span className="font-bold text-slate-700 dark:text-slate-300">{name}</span>
                 <span className="text-primary font-black text-lg">{time}</span>
              </div>
           )) : <p className="text-center text-sage-500">Loading schedule...</p>}
        </div>
      </Modal>

      <Modal 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
        title="Notifications"
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
           <div className="w-16 h-16 bg-sage-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sage-400 mb-4">
              <span className="material-symbols-outlined text-3xl">notifications_off</span>
           </div>
           <p className="font-bold text-slate-800 dark:text-white">No new notifications</p>
           <p className="text-sm text-sage-500">We'll alert you when there's an update to your spiritual journey.</p>
        </div>
      </Modal>
    </>
  );
}

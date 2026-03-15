"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PrayerGrid from './components/PrayerGrid';
import TilawahCounter from './components/TilawahCounter';
import SunnahActivities from './components/SunnahActivities';
import NextEvent from './components/NextEvent'; 
import DuaCard from './components/DuaCard';
import StreakWidget from './components/StreakWidget';
import XPBurst from './components/XPBurst';
import Modal from './components/Modal';
import JourneyCanvas from './components/JourneyCanvas';
import AIChatPanel from './components/AIChatPanel';
import TasbihCounter from './components/TasbihCounter';
import { useVibeStore } from '@/store/useVibeStore';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useVibeSync } from './hooks/useVibeSync';
import { auth, db, loginWithGoogle, getUserProgress, getUserProfile, getUserWeeklyProgress, getLocalTodayId, logout, messaging, saveNotificationToken, saveNotification, getUserNotifications } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import type { DailyProgress } from '@/lib/schemas';

// --- ErrorBoundary Fallback Component ---
function WidgetFallback() {
  return (
    <div className="p-4 bg-red-50/10 border border-red-500/50 rounded-2xl text-center w-full h-full min-h-[120px] flex flex-col justify-center items-center">
      <span className="material-symbols-outlined text-red-500">warning</span>
      <p className="text-xs text-slate-500 mt-2">Widget failed to load.</p>
    </div>
  );
}

export default function StudentDashboard() {
  // DB, AUTH & ZUSTAND STORE
  const user = useVibeStore((state) => state.user);
  const setUser = useVibeStore((state) => state.setUser);
  const verifiedSadaqah = useVibeStore((state) => state.verifiedSadaqah);
  const setSadaqah = useVibeStore((state) => state.setSadaqah);
  const setTotalXP = useVibeStore((state) => state.setTotalXP);
  const setUserRole = useVibeStore((state) => state.setUserRole);
  
  const [loadingContext, setLoadingContext] = useState(true);

  // LOGIC STATE
  const [tilawah, setTilawah] = useState(0);
  const [tasbih, setTasbih] = useState(0);
  const [duaRecited, setDuaRecited] = useState(false);
  const [targetTilawah, setTargetTilawah] = useState(20);
  
  const [sholat, setSholat] = useState<DailyProgress['sholat']>({
    subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false
  });

  const [sunnah, setSunnah] = useState<DailyProgress['sunnah']>({
    tarawih: false, sahur: false, sadaqah: false
  });

  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLng, setProfileLng] = useState<number | null>(null);

  const { prayerTimes, hijriDate, hijriDayInt } = usePrayerTimes(profileLat, profileLng);
  
  const [streakHistory, setStreakHistory] = useState<Array<DailyProgress & { dateId: string }>>([]);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');
  
  const [notifications, setNotifications] = useState<Array<{id: string|number, title: string, body: string, time: string}>>([]);
  const [customTasks, setCustomTasks] = useState<Array<any>>([]);
  const [isNotifDismissed, setIsNotifDismissed] = useState(false);
  const [selectedDayStats, setSelectedDayStats] = useState<any>(null);
  const [pendingRoleRequest, setPendingRoleRequest] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  // REFS FOR AVOIDING UNNECESSARY DB WRITES ON LOAD
  const isInitialLoad = useRef(true);

  const { syncStatus, xpBurstTrigger } = useVibeSync({
    user, tilawah, targetTilawah, sholat, sunnah, tasbih, duaRecited, verifiedSadaqah, loadingContext, isInitialLoad
  });

  // AUTH OBSERVER & DB FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Need to cast standard Firebase user to our extended store user type if needed
      setUser(currentUser as any);
      if (currentUser) {
        const todayId = getLocalTodayId();
        const cloudData = await getUserProgress(currentUser.uid, todayId);
        if (cloudData) {
          if (cloudData.tilawah !== undefined) setTilawah(cloudData.tilawah);
          if (cloudData.tasbih !== undefined) setTasbih(cloudData.tasbih);
          if (cloudData.duaRecited !== undefined) setDuaRecited(cloudData.duaRecited);
          if (cloudData.sholat) setSholat(cloudData.sholat);
          if (cloudData.sunnah) setSunnah(cloudData.sunnah);
        }
        
        // [DECREE 2] Fetch Target from Profile (Persistence)
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          if (profile.targetTilawah) setTargetTilawah(profile.targetTilawah);
          if (profile.latitude) setProfileLat(profile.latitude);
          if (profile.longitude) setProfileLng(profile.longitude);
          
          if (profile.dailyXP) {
            const totalAccumulated = Object.values(profile.dailyXP).reduce((a, b) => (a as number) + (b as number), 0);
            setTotalXP(totalAccumulated as number);
          }
          // [PHASE 19] Sync role to Zustand Store for Sidebar Conditional Navigation
          if (profile.role) {
            setUserRole(profile.role);
          }
          if (profile.dismissedNotif) {
            setIsNotifDismissed(true);
          }
        }
        
        // Fetch streak history
        const weeklyData = await getUserWeeklyProgress(currentUser.uid);
        if (weeklyData) {
          setStreakHistory(weeklyData); 
        }
        
        // Fetch Eternal Notifications
        const history = await getUserNotifications(currentUser.uid);
        setNotifications(history as any); // Type cast until Notifications have strict interfaces on fetch
        
        isInitialLoad.current = false;

        // [STATUS INDICATOR LOGIC] C Check if user has a pending role request
        const checkPendingRequest = async () => {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const reqDoc = await getDoc(doc(db, 'role_requests', currentUser.email?.toLowerCase() || ''));
            if (reqDoc.exists() && reqDoc.data()?.status === 'pending') {
              setPendingRoleRequest(reqDoc.data()?.requestedRole);
            } else {
              setPendingRoleRequest(null);
            }
          } catch (e) { /* ignore silent */ }
        };
        checkPendingRequest();
      }
      setLoadingContext(false);
    });
    return () => unsubscribe();
  }, [setUser, setTotalXP]);

  // REAL-TIME SADAQAH VERIFIER
  useEffect(() => {
    if (user) {
      const sadaqahRef = collection(db, 'users', user.uid, 'sadaqah');
      const q = query(sadaqahRef, limit(5)); 
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setSadaqah(false);
          return;
        }

        const now = new Date().getTime();
        const hasRecentDonation = snapshot.docs.some(doc => {
          const data = doc.data();
          if (data.status !== 'SUCCESS') return false;
          
          // Handle both 'claimedAt' (from Auth Sync) and 'timestamp' (from Webhook)
          let donationTime = 0;
          if (data.claimedAt && typeof data.claimedAt.toDate === 'function') {
            donationTime = data.claimedAt.toDate().getTime();
          } else if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            donationTime = data.timestamp.toDate().getTime();
          } else if (data.claimedAt || data.timestamp) {
            // Fallback if they are stored as strings somehow
            donationTime = new Date(data.claimedAt || data.timestamp).getTime();
          }
                              
          return (now - donationTime) <= 86400000; 
        });

        setSadaqah(hasRecentDonation);
      });
      return () => unsubscribe();
    }
  }, [user, setSadaqah]);

  // REAL-TIME CUSTOM TASKS LISTENER
  useEffect(() => {
    if (user) {
      const tasksRef = collection(db, 'users', user.uid, 'custom_tasks');
      const q = query(tasksRef, limit(10));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomTasks(tasks);
        
        // Show toast for new tasks
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" && !isInitialLoad.current) {
            toast.info(`📋 New Task: ${change.doc.data().task}`);
          }
        });
      });
      return () => unsubscribe();
    }
  }, [user]);

  // WEB PUSH & FCM INITIALIZATION
  useEffect(() => {
    if (user && typeof window !== 'undefined' && messaging) {
      const initMessaging = async () => {
        try {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            // console.log('[FCM] SW registered:', registration.scope);log
          }
        } catch (error) {
          // console.error("[FCM] Notification setup failed:", error);error
        }
      };
      initMessaging();

      const unsubscribe = onMessage(messaging, async (payload) => {
        // console.log('[FCM] Foreground message received:', payload);log
        const newNotif = {
          id: Date.now().toString(),
          title: payload.notification?.title || 'System Update',
          body: payload.notification?.body || '',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        };
        
        if (user) await saveNotification(user.uid, newNotif as any);
        
        setNotifications(prev => [newNotif, ...prev]);
        toast(`📢 ${newNotif.title}`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // LOCAL PRAYER REMINDERS
  useEffect(() => {
    if (!prayerTimes || !user) return;

    const timeouts: NodeJS.Timeout[] = [];
    const now = new Date();

    Object.entries(prayerTimes).forEach(([name, time]) => {
      if (['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(name) && typeof time === 'string') {
        const [hours, minutes] = time.split(':');
        const prayerDate = new Date();
        prayerDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const timeToPrayer = prayerDate.getTime() - now.getTime();
        if (timeToPrayer > 0) {
          const tId = setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification(`Prayer Time: ${name}`, {
                body: `It's time for ${name} prayer. Level up your consistency! ✨`,
                icon: '/favicon.ico'
              });
            }
          }, timeToPrayer);
          timeouts.push(tId);
        }
      }
    });

    return () => timeouts.forEach(clearTimeout);
  }, [prayerTimes, user]);

  // THE MIDNIGHT GHOST KILLER
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

  // Modal Body Scroll Lock
  useEffect(() => {
    if (isScheduleOpen || isNotifOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isScheduleOpen, isNotifOpen]);


  // THE LOGIC ENGINE
  const safeTarget = Math.max(1, targetTilawah); 
  const tilawahPct = Math.min(Math.round((tilawah / safeTarget) * 100), 100);
  
  const prayersDone = Object.values(sholat).filter(v => v).length;
  const sholatPct = (prayersDone / 5) * 100;
  
  const corePct = Math.min(Math.round((sholatPct * 0.5) + (tilawahPct * 0.5)), 100);
  
  const sunnahDoneCount = (sunnah.tarawih ? 1 : 0) + (sunnah.sahur ? 1 : 0) + (verifiedSadaqah ? 1 : 0) + (duaRecited ? 1 : 0);
  const sunnahBonusXP = sunnahDoneCount * 5;

  const handlePrayerToggle = (key: keyof DailyProgress['sholat']) => setSholat(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSunnahToggle = (key: keyof DailyProgress['sunnah']) => setSunnah(prev => ({ ...prev, [key]: !prev[key] }));
  const handleTilawahInc = () => setTilawah(prev => prev + 1);
  const handleTilawahDec = () => setTilawah(prev => Math.max(0, prev - 1));
  const handleUpdateTarget = (val: number) => setTargetTilawah(val);

  const enableNotifications = async () => {
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted' && messaging) {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token && user) await saveNotificationToken(user.uid, token);
        toast("Prayer reminders enabled! ✨");
      }
    } catch (err) {
      // console.error(err);error
    }
  };

  const dismissNotificationBanner = async () => {
    setIsNotifDismissed(true);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { dismissedNotif: true });
      } catch (e) {
        // Silent fail
      }
    }
  };

  // Premium Sadaqah Feedback
  useEffect(() => {
    if (verifiedSadaqah && !isInitialLoad.current) {
      toast.success('Sadaqah Verified!', {
        description: 'May Allah accept your good deeds today.',
        icon: <Sparkles className="text-amber-400" />,
        duration: 5000,
      });
    }
  }, [verifiedSadaqah]);

  // LOGIN SCREEN
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
           <button onClick={loginWithGoogle} className="cursor-pointer w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-95 border border-slate-200 dark:border-slate-700">
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
        <ErrorBoundary FallbackComponent={WidgetFallback}>
          <Sidebar onLogout={logout} />
        </ErrorBoundary>
        
        <main className="flex-1 overflow-y-auto scroll-smooth relative">
            <div className="bg-indigo-600 text-white text-xs px-6 py-3 flex justify-between items-center shadow-md">
              <span>Enable local prayer reminders?</span>
              <div className="flex gap-2">
                <button onClick={enableNotifications} className="cursor-pointer bg-white text-indigo-600 px-4 py-1.5 rounded-full font-bold hover:bg-slate-100 transition-colors">
                  Enable
                </button>
                <button onClick={dismissNotificationBanner} className="text-white/70 hover:text-white px-2 py-1.5 font-medium transition-colors">
                  Dismiss
                </button>
              </div>
            </div>

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

          <ErrorBoundary FallbackComponent={WidgetFallback}>
            {pendingRoleRequest && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-8 py-3 flex items-center justify-between animate-fade-in-down">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-500 animate-pulse">hourglass_empty</span>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    Your request to become a <span className="uppercase text-amber-700 dark:text-amber-300">{pendingRoleRequest}</span> is pending admin approval.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest hidden sm:block">Awaiting Escalation</span>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                </div>
              </div>
            )}
            <Header corePct={corePct} sunnahBonusXP={sunnahBonusXP} hijriDate={hijriDate || ''} onOpenNotif={() => setIsNotifOpen(true)} />
          </ErrorBoundary>
          
          <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              <ErrorBoundary FallbackComponent={WidgetFallback}>
                <JourneyCanvas 
                  currentDay={hijriDayInt || 1} 
                  totalDays={30} 
                  history={streakHistory}
                  onNodeClick={(day, data) => {
                    toast.info(`Opening Worship Details: Day ${day}`);
                    setSelectedDayStats({ day, ...data });
                  }}
                />
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={WidgetFallback}>
                <PrayerGrid sholat={sholat} onToggle={handlePrayerToggle} dynamicTimes={prayerTimes} />
              </ErrorBoundary>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ErrorBoundary FallbackComponent={WidgetFallback}>
                  <SunnahActivities sunnah={{...sunnah, sadaqah: verifiedSadaqah}} onToggle={handleSunnahToggle} />
                </ErrorBoundary>
                <ErrorBoundary FallbackComponent={WidgetFallback}>
                  <TilawahCounter 
                    tilawah={tilawah} 
                    targetTilawah={targetTilawah}
                    tilawahPct={tilawahPct} 
                    onIncrement={handleTilawahInc} 
                    onDecrement={handleTilawahDec} 
                    onUpdateTarget={handleUpdateTarget}
                  />
                </ErrorBoundary>
                <ErrorBoundary FallbackComponent={WidgetFallback}>
                  <TasbihCounter 
                    tasbih={tasbih} 
                    onIncrement={() => setTasbih(p => p + 1)} 
                    onReset={() => setTasbih(0)} 
                  />
                </ErrorBoundary>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
              <ErrorBoundary FallbackComponent={WidgetFallback}>
                <StreakWidget history={streakHistory} />
              </ErrorBoundary>
              
              {sunnahBonusXP > 0 && <XPBurst points={sunnahBonusXP} trigger={xpBurstTrigger} />}

              <ErrorBoundary FallbackComponent={WidgetFallback}>
                <DuaCard 
                  prayerTimes={prayerTimes} 
                  recited={duaRecited}
                  onMarkRecited={() => {
                    setDuaRecited(true);
                    toast.success("Masha Allah! Vibe points added! ✨");
                  }}
                />
              </ErrorBoundary>
              
              {/* Custom Tasks Widget */}
              {customTasks.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6">
                  <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm">assignment_late</span>
                    Teacher Assigned Tasks
                  </h3>
                  <div className="space-y-3">
                    {customTasks.filter(t => t.status === 'pending').map(t => (
                      <div key={t.id} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-amber-500/20">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.task}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">By: {t.assignedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ErrorBoundary FallbackComponent={WidgetFallback}>
                <NextEvent prayerTimes={prayerTimes} showToast={toast as any} onOpenSchedule={() => setIsScheduleOpen(true)} />
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>

      <ErrorBoundary FallbackComponent={WidgetFallback}>
        <AIChatPanel progressData={{ 
          tilawah, targetTilawah, 
          sholatPct: Math.round((prayersDone / 5) * 100), 
          sunnahCount: sunnahDoneCount,
          streak: streakHistory.length || 0 // Proxy streak for Insight Payload logic
        }} />
      </ErrorBoundary>

      <Modal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        title="Full Prayer Schedule"
      >
        <div className="space-y-4">
           {prayerTimes ? Object.entries(prayerTimes).filter(([k]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(k)).map(([name, time]) => (
              <div key={name} className="flex justify-between items-center p-4 bg-sage-50 dark:bg-slate-800 rounded-2xl hover:scale-[1.02] transition-transform">
                 <span className="font-bold text-slate-700 dark:text-slate-300">{name}</span>
                 <span className="text-primary font-black text-lg">{time as string}</span>
              </div>
           )) : <p className="text-center text-sage-500">Loading schedule...</p>}
        </div>
      </Modal>

      <Modal 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
        title="Notifications"
      >
        {notifications.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-4 bg-sage-50 dark:bg-slate-800 rounded-2xl">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">notifications_active</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white">{n.title}</p>
                  <p className="text-xs text-sage-500 mt-0.5">{n.body}</p>
                </div>
                <span className="text-[10px] text-sage-400 shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
             <div className="w-16 h-16 bg-sage-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sage-400 mb-4">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
             </div>
             <p className="font-bold text-slate-800 dark:text-white">No new notifications</p>
             <p className="text-sm text-sage-500">Prayer reminders and updates will appear here.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedDayStats}
        onClose={() => setSelectedDayStats(null)}
        title={`Summary Day ${selectedDayStats?.day}`}
      >
        {selectedDayStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-500/10 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-500/70 mb-1">Prayer</p>
                <p className="text-xl font-black text-blue-500">{selectedDayStats.prayers}/5</p>
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-500/70 mb-1">Tilawah</p>
                <p className="text-xl font-black text-emerald-500">{selectedDayStats.tilawah}</p>
              </div>
              <div className="bg-purple-500/10 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-purple-500/70 mb-1">Sunnah</p>
                <p className="text-xl font-black text-purple-500">{selectedDayStats.sunnah}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
               <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                 <span className="material-symbols-outlined text-orange-400">workspace_premium</span>
                 Achievement Bonus
               </h4>
               <p className="text-sm text-slate-500 dark:text-slate-400">
                 {selectedDayStats.completed 
                   ? `Masha Allah! Kamu berhasil mempertahankan streak dan mendapatkan bonus +${selectedDayStats.streak * 10} XP di hari ini.`
                   : "Data hari ini belum lengkap atau masih terkunci. Tetap semangat istiqomah!"}
               </p>
            </div>
            
            <button 
              onClick={() => setSelectedDayStats(null)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
            >
              Close Details
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

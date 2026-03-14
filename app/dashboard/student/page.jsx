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
import { auth, loginWithGoogle, getUserProgress, updateUserProgress, logout } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

  // REFS FOR AVOIDING UNNECESSARY DB WRITES ON LOAD
  const isInitialLoad = useRef(true);

  // AUTH OBSERVER & DB FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const todayId = new Date().toISOString().split('T')[0];
        const cloudData = await getUserProgress(currentUser.uid, todayId);
        if (cloudData) {
          if (cloudData.tilawah !== undefined) setTilawah(cloudData.tilawah);
          if (cloudData.targetTilawah !== undefined) setTargetTilawah(cloudData.targetTilawah);
          if (cloudData.sholat) setSholat(cloudData.sholat);
          if (cloudData.sunnah) setSunnah(cloudData.sunnah);
        }
      }
      setLoadingContext(false);
      
      // Allow syncing to DB on next render cycle
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    });
    return () => unsubscribe();
  }, []);

  // DB SYNC ENGINE (TWO-WAY BINDING)
  useEffect(() => {
    if (user && !isInitialLoad.current && !loadingContext) {
      const todayId = new Date().toISOString().split('T')[0];
      const payload = { tilawah, targetTilawah, sholat, sunnah };
      // Debounce saving
      const timer = setTimeout(() => {
        updateUserProgress(user.uid, todayId, payload);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, tilawah, targetTilawah, sholat, sunnah, loadingContext]);

  // ALADHAN API INTEGRATION (METHOD=20 [KEMENAG RI] & DYNAMIC GEOLOCATION)
  useEffect(() => {
    async function fetchPrayerTimes() {
      // Fungsi untuk menghubungi API setelah mendapat koordinat atau fall-back
      const getFromAPI = async (lat = -6.2088, lng = 106.8456) => { // Fallback Jakarta
        try {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=20`);
          const data = await res.json();
          if (data && data.data) {
            setPrayerTimes(data.data.timings);
          }
        } catch (error) {
          console.error("Failed fetching Aladhan API", error);
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            getFromAPI(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn("Geolocation denied or failed. Fallback to default (Jakarta).", error);
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

  // THE LOGIC ENGINE: Pembobotan ketat 50% Salah + 50% Tilawah (Sunnah sebagai Bonus Point)
  const tilawahPct = Math.min(Math.round((tilawah / targetTilawah) * 100), 100);
  const prayersDone = Object.values(sholat).filter(v => v).length;
  const sholatPct = (prayersDone / 5) * 100;
  
  // Hitung jumlah sunnah yang dikerjakan (0 s/d 3)
  const sunnahDoneCount = Object.values(sunnah).filter(v => v).length;
  // Berikan 5% bonus XP per ibadah sunnah yang dijalankan
  const sunnahBonusPct = sunnahDoneCount * 5;

  // Rumus Akhir: (50% Fardhu) + (50% Tilawah) + (XP Sunnah), dibatasi maksimal 100% untuk UI
  const totalPct = Math.min(Math.round((sholatPct * 0.5) + (tilawahPct * 0.5) + sunnahBonusPct), 100);

  // HANDLERS
  const handlePrayerToggle = (key) => setSholat(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSunnahToggle = (key) => setSunnah(prev => ({ ...prev, [key]: !prev[key] }));
  const handleTilawahInc = () => setTilawah(prev => prev + 1);
  const handleTilawahDec = () => setTilawah(prev => Math.max(0, prev - 1));

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
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <Header totalPct={totalPct} user={user} />
          
          <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <PrayerGrid sholat={sholat} onToggle={handlePrayerToggle} dynamicTimes={prayerTimes} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SunnahActivities sunnah={sunnah} onToggle={handleSunnahToggle} />
                <TilawahCounter 
                  tilawah={tilawah} 
                  targetTilawah={targetTilawah}
                  tilawahPct={tilawahPct} 
                  onIncrement={handleTilawahInc} 
                  onDecrement={handleTilawahDec} 
                />
              </div>
            </div>

            {/* WIDGETS COLUMN */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <StreakWidget streakCount={4} />
              <DuaCard />
              <NextEvent prayerTimes={prayerTimes} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PrayerGrid from './components/PrayerGrid';
import TilawahCounter from './components/TilawahCounter';
import SunnahActivities from './components/SunnahActivities';
import NextEvent from './components/NextEvent'; 
import DuaCard from './components/DuaCard';
import StreakWidget from './components/StreakWidget';
// import { db, auth } from '@/lib/firebase'; // Uncomment to activate DB persistance

export default function StudentDashboard() {
  // STATE MANAGEMENT
  const [tilawah, setTilawah] = useState(0);
  const targetTilawah = 20;
  
  const [sholat, setSholat] = useState({
    subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false
  });

  const [sunnah, setSunnah] = useState({
    tarawih: false, sahur: false, sadaqah: false
  });

  const [prayerTimes, setPrayerTimes] = useState(null);

  // ALADHAN API INTEGRATION (Dynamic Data Fetching)
  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        // Contoh default fetch (Batam) - di production bisa gunakan navigator.geolocation
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Batam&country=Indonesia&method=11');
        const data = await res.json();
        if (data && data.data) {
          setPrayerTimes(data.data.timings);
        }
      } catch (error) {
        console.error("Failed fetching Aladhan API", error);
      }
    }
    fetchPrayerTimes();
    
    // TODO: Fetch user progress from Firestore based on auth.currentUser.uid here
  }, []);

  // THE LOGIC ENGINE: Total Progress = (Salah x 50%) + (Tilawah x 50%)
  const tilawahPct = Math.min(Math.round((tilawah / targetTilawah) * 100), 100);
  const prayersDone = Object.values(sholat).filter(v => v).length;
  const sholatPct = (prayersDone / 5) * 100;
  
  // Pembobotan ketat 50-50 (Sunnah tidak masuk hitungan utama)
  const totalPct = Math.round((sholatPct * 0.5) + (tilawahPct * 0.5));

  // HANDLERS
  const handlePrayerToggle = (key) => setSholat(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSunnahToggle = (key) => setSunnah(prev => ({ ...prev, [key]: !prev[key] }));
  const handleTilawahInc = () => setTilawah(prev => prev + 1);
  const handleTilawahDec = () => setTilawah(prev => Math.max(0, prev - 1));

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <Header totalPct={totalPct} />
          
          <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <PrayerGrid sholat={sholat} onToggle={handlePrayerToggle} dynamicTimes={prayerTimes} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SunnahActivities sunnah={sunnah} onToggle={handleSunnahToggle} />
                <TilawahCounter 
                  tilawah={tilawah} 
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

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const usePrayerTimes = (fallbackLat = null, fallbackLng = null) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState('Loading...');
  const [hijriDayInt, setHijriDayInt] = useState(1);

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
               
               // [FIX] Anti-Heresy Hijriah: Semantic "Malam" rollover
               const now = new Date();
               const [maghribH, maghribM] = timings.Maghrib.split(':');
               const maghribTime = new Date();
               maghribTime.setHours(parseInt(maghribH, 10), parseInt(maghribM, 10), 0, 0);
               
               let currentDayNum = parseInt(hijri.day, 10);
               
               if (now >= maghribTime) {
                   currentDayNum += 1; // Pasca maghrib masuk malam hari berikutnya
                   setHijriDate(`Malam ${currentDayNum} ${hijri.month.en} ${hijri.year} AH`);
               } else {
                   setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
               }
               setHijriDayInt(currentDayNum); // Simpan angka murninya untuk Canvas
            }
          }
          if (isFallback) {
             toast("Menggunakan zona waktu Batam (Default). Aktifkan GPS untuk akurasi lokasi.");
          }
        } catch (error) {
          // console.error("Failed fetching Aladhan API", error);error
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            getFromAPI(position.coords.latitude, position.coords.longitude, false);
          },
          (error) => {
            // [FIX] Coba tebak dari Timezone OS/Browser
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let tzLat = fallbackLat;
            let tzLng = fallbackLng;

            if (tzLat === null && tzLng === null) {
              if (tz === 'Asia/Jakarta') { tzLat = -6.2088; tzLng = 106.8456; }
              else if (tz === 'Asia/Makassar') { tzLat = -5.1477; tzLng = 119.4327; } // WITA
              else if (tz === 'Asia/Jayapura') { tzLat = -2.5337; tzLng = 140.7181; } // WIT
              else if (tz === 'Asia/Singapore') { tzLat = 1.3521; tzLng = 103.8198; }
              else { tzLat = 1.0456; tzLng = 104.0305; } // Default Batam
            }

            const isBatamFallback = tzLat === 1.0456;
            getFromAPI(tzLat, tzLng, isBatamFallback); // Fallback Profile/Timezone/Batam
            toast(`⚠️ GPS Ditolak. Menggunakan zona waktu ${fallbackLat !== null ? 'Profil' : (isBatamFallback ? 'Batam (Default)' : tz)}. Mohon izinkan lokasi.`);
          }
        );
      } else {
        // console.warn("Geolocation is not supported by this browser. Fallback to default.");warn
        const finalLat = fallbackLat !== null ? fallbackLat : 1.0456;
        const finalLng = fallbackLng !== null ? fallbackLng : 104.0305;
        getFromAPI(finalLat, finalLng, true);
      }
    }
    fetchPrayerTimes();
  }, [fallbackLat, fallbackLng]);

  return { prayerTimes, hijriDate, hijriDayInt };
};

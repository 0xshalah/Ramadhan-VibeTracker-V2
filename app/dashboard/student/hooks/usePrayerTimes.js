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
            // [FIX] Jangan diam saja, beritahu UI
            // console.warn("GPS Denied.", error);warn
            const finalLat = fallbackLat !== null ? fallbackLat : 1.0456;
            const finalLng = fallbackLng !== null ? fallbackLng : 104.0305;
            getFromAPI(finalLat, finalLng, true); // Fallback Profile/Batam
            toast(`⚠️ GPS Ditolak. Menggunakan zona waktu ${fallbackLat !== null ? 'Profil' : 'Batam (Default)'}. Mohon izinkan lokasi.`);
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

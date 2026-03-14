# 🎯 PRD: Ramadhan VibeTracker - Interactive AI Ecosystem

**Version:** 1.2 (Hackathon Final Polish)
**Status:** Ready to Ship 🚀

---

## 1. Executive Summary

**Ramadhan VibeTracker** adalah aplikasi pelacakan spiritual terpadu yang dirancang untuk membangun konsistensi ibadah selama bulan suci. Dibangun menggunakan prinsip **Vibe Coding**, aplikasi ini bermigrasi dari *rapid-prototype* HTML ke ekosistem **Next.js** yang tangguh, dengan validasi pengujian otomatis menggunakan **TestSprite AI**.

## 2. Updated Tech Stack

* **Frontend:** Next.js 14 (App Router), Tailwind CSS (Custom Palette).
* **Logic Engine:** VibeTracker Interactive Engine (JavaScript/React State).
* **Backend & Auth:** Firebase (Authentication & Firestore).
* **Validation:** TestSprite MCP (Automated QA & Security Assertions).

## 3. Core Features (The Interactive Engine)

Bagian ini adalah "nyawa" dari VibeTracker yang sudah diverifikasi:

### A. Dynamic Progress Weighting

Sistem menggunakan formula kalkulasi progres gabungan untuk akurasi data:


$$Total Progress = (Salah Progress \times 50\%) + (Tilawah Progress \times 50\%)$$

* **Sholat Fardhu:** Klik-to-toggle dengan umpan balik visual instan.
* **Tilawah Counter:** Kontrol $+/-$ dengan animasi *pop-scale* dan validasi target harian.

### B. Micro-interactions & UX

* **Motivational Messages:** Status header yang berubah secara dinamis berdasarkan persentase (e.g., *“Masya Allah! Perfect!”* pada 100%).
* **Fluid Sunnah Toggles:** Animasi *elastic slide* pada fitur pendukung seperti Tarawih dan Sedekah.
* **Press Feedback:** Implementasi `active:scale-95` pada seluruh elemen interaktif untuk sensasi taktil premium.

## 4. Accessibility & Security (Cybersec Focus)

Mengingat latar belakang pengembang, aplikasi ini menerapkan:

* **Standard WCAG 2.1:** Kontrast teks *Inactive Navigation* ditingkatkan ke *Charcoal Gray* untuk keterbacaan maksimal.
* **Auth Security:** Integrasi Google Sign-In via Firebase untuk meminimalkan risiko pencurian kredensial.
* **Logic Integrity:** Seluruh fungsi kalkulasi persentase telah melalui *stress-test* menggunakan **TestSprite** untuk mencegah *logic flaw*.

## 5. TestSprite Integration

Proyek ini menggunakan folder `testsprite_tests/` sebagai *Source of Truth* untuk kualitas kode:

* **Scenario:** Validasi integrasi *webhook* pembayaran Mayar.
* **Scenario:** Uji coba sinkronisasi antara *State* Tilawah dan *UI Circle Progress*.

---

## 6. Next Steps (Future Roadmap)

* **PBL VAPT Integration:** Melakukan *penetration testing* mandiri pada API endpoint.
* **Ramadhan Tracker Mobile:** Migrasi komponen UI yang sudah ada ke **Flutter** untuk versi *offline-first*.
* **Leaderboard:** Fitur kompetisi sehat antar siswa di SMA Medina.
# 🌙 Ramadhan VibeTracker V2

> Elevate your Ramadhan journey with deep analytics, gamification, and absolute data integrity.
> Built for the **"Build with AI. Test with TestSprite"** Hackathon.

![Next.js](https://img.shields.io/badge/Architecture-Next.js%2014-black?style=for-the-badge&logo=next.js) ![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) ![TestSprite](https://img.shields.io/badge/Tested_With-TestSprite_AI-7C3AED?style=for-the-badge)

## 🚀 Elevator Pitch

Ramadhan isn't just about fasting; it's about building spiritual consistency. **VibeTracker V2** is an AI-tested, architecturally rigorous web application that tracks your daily prayers (Fardhu & Sunnah), automates Quranic reading (Tilawah) targets, and seamlessly verifies your charitable acts (Sadaqah) through real-time payment webhooks. No mock data. No fake streaks. **Absolute truthful gamification.**

## 🤖 Why "Test with TestSprite"?

Building a spiritual tracker requires flawless timezone handling, secure database syncs, and zero-day trap prevention in gamification streaks. **TestSprite AI** handled the heavy lifting of our testing lifecycle:

- **Webhook Integrity:** TestSprite generated tests to simulate Mayar Payment payloads, ensuring our Firebase Admin SDK correctly mapped orphaned donations to verified user documents via server-side logic.
- **Race Condition Prevention:** AI testing helped us identify and eradicate front-end `setTimeout` hydration flaws, preventing data overwrites during Firebase two-way binding.
- **Time-Bound Verification:** TestSprite verified that our `todayId` calculation logic strictly enforces real-time Sadaqah tracking without UTC timezone sabotage.

## 💎 Core Architecture Highlights

1. **The "Zero-Division" Logic Engine:** Implemented strict state boundary limitations so users cannot manipulate their completion percentages via DOM inspection.
2. **Deep Firebase Sync:** Utilizes `onSnapshot` for real-time verified Sadaqah status and `onAuthStateChanged` bound with debounce functionality to prevent network exhaustion.
3. **Aladhan API × Geolocation:** Precision prayer times dynamically fetched based on browser coordinates with fallback mechanics, utilizing Kemenag RI (Method 20) standards.
4. **FCM Push Notifications:** Local memory-leak-patched service workers for background notifications and Iftar reminders.
5. **Anti-UTC Sabotage:** Server-side webhook forces UTC+7 (WIB) for accurate `dateId` in serverless environments. Client-side uses `getTimezoneOffset()` to prevent streak corruption.
6. **Idempotent XP System:** Daily XP stored as absolute values under `dailyXP.{dateId}` map — immune to `increment()` farming exploits.

## 🛡️ Security Hardening

| Vulnerability | Status | Resolution |
|---|---|---|
| Firebase Admin Private Key Leak | ✅ Resolved | Key revoked, removed from git history, `.gitignore` hardened |
| Infinite XP Glitch (`increment()`) | ✅ Resolved | Replaced with idempotent absolute daily XP values |
| Notification Memory Leak | ✅ Resolved | `clearTimeout` cleanup on component unmount |
| Webhook Auth (Serverless) | ✅ Resolved | `credential.cert()` with env variables |
| VAPID Key Hardcoded | ✅ Resolved | Extracted to `NEXT_PUBLIC_FIREBASE_VAPID_KEY` |
| UTC Timezone Sabotage | ✅ Resolved | Forced UTC+7 on server, local offset on client |
| Hijri "31 Ramadhan" Heresy | ✅ Resolved | Semantic "Malam" rollover without date manipulation |

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React (Hooks), Tailwind CSS (Glassmorphism & Custom Palette)
- **Backend:** Firebase (Auth, Firestore, Cloud Messaging), Google Cloud Service Accounts
- **Integrations:** Mayar Payment Gateway (HMAC-SHA256 Webhook Verification), Aladhan Prayer Time API
- **QA & Testing:** TestSprite AI

## 📦 Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/0xshalah/Ramadhan-VibeTracker-V2.git

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Fill in your Firebase config, FIREBASE_ADMIN_PRIVATE_KEY, and MAYAR_WEBHOOK_SECRET

# 4. Run the development server
npm run dev
```

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID Public Key |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK Project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Admin SDK Service Account Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Admin SDK Private Key (from GCP Console) |
| `MAYAR_WEBHOOK_SECRET` | Mayar HMAC-SHA256 Webhook Secret |

## 🚧 Phase 2 Roadmap

- **Role-Based Access Control (RBAC):** Dedicated portals for Teachers and Parents to monitor student activities.
- **Guilds & Leaderboards:** Connect the Total XP progression system to school-wide leaderboards.
- **Historical Charts:** Dynamic data visualization for monthly worship trends.
- **Badge Achievement System:** Unlock visual badges for streak milestones and consistent ibadah.

---

*Build for the Soul, Code for Eternity. Designed by 0xshalah.*

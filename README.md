# 🌙 Ramadhan VibeTracker V2: Enterprise Edition

> Architecting Absolute Spiritual Integrity.
> Built for the **"Build with AI. Test with TestSprite"** Hackathon.

![Next.js](https://img.shields.io/badge/Architecture-Next.js%2014-black?style=for-the-badge&logo=next.js) ![Firebase](https://img.shields.io/badge/Database-Firebase_Deep_Sync-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) ![TestSprite](https://img.shields.io/badge/Tested_With-TestSprite_AI_Agent-7C3AED?style=for-the-badge)

## 🚀 The Vision: Beyond a Simple Tracker

Ramadhan trackers are historically plagued by a fatal flaw: **Mock Gamification**. Users can tap buttons to gain points without accountability. **VibeTracker V2** obliterates this flaw. Engineered as a Multi-Role ecosystem (Student, Teacher, Parent), it features server-side webhook verifications for Sadaqah (Charity), immutable Zero-Day streak algorithms, and anti-UTC logic to enforce pure, truthful gamification.

## 🤖 Why "Test with TestSprite"?

Building a synchronous multi-role system requires flawless timezone handling and data hydration. **TestSprite AI** handled our critical Quality Assurance logic:

1. **Webhook Penetration Testing:** TestSprite generated payloads simulating Mayar Payment Gateways, ensuring our Firebase Admin SDK strictly mapped orphaned donations to verified user documents via server-side timezone locking (UTC+7 Forced).
2. **Race Condition Eradication:** TestSprite identified React hydration flaws, allowing us to patch `setTimeout` memory leaks and prevent data overwriting during real-time Firebase two-way binding.
3. **The "Zero-Division" Exploit Prevention:** AI testing verified our state boundary limitations, ensuring users cannot manipulate Tilawah targets (e.g., dividing by 0) to bypass progression logic.

## 💎 Architectural Supremacy

| Feature | Description |
|---|---|
| **The Unclaimed Resolver** | Post-login background worker that sweeps the database for donations made *before* registration, retroactively granting gamification XP |
| **Semantic Hijri Rollover** | Custom Aladhan API integration that shifts Islamic dates after Maghrib, overriding the standard Midnight reset |
| **RBAC Foundation** | Role-based login flow ("The Sorting Hat") — users are routed to Student, Teacher, or Parent dashboards based on Firestore `role` field |
| **Anti-UTC Sabotage** | Server-side webhook forces UTC+7 (WIB); client-side uses `getTimezoneOffset()` to prevent streak corruption |
| **Idempotent XP System** | Daily XP stored as absolute values under `dailyXP.{dateId}` map — immune to `increment()` farming exploits |
| **FCM Push Engine** | Memory-leak-patched service workers for background notifications and Iftar reminders |

## 🛡️ Security Hardening (VAPT Results)

| Vulnerability | Severity | Status | Resolution |
|---|---|---|---|
| Firebase Admin Private Key Leak | ☢️ Critical | ✅ Resolved | Key revoked, purged from git history, `.gitignore` hardened |
| Infinite XP Glitch (`increment()`) | 🔴 High | ✅ Resolved | Replaced with idempotent absolute daily XP values |
| Notification Memory Leak | 🟡 Medium | ✅ Resolved | `clearTimeout` cleanup array on component unmount |
| Webhook Auth (Serverless) | 🔴 High | ✅ Resolved | `credential.cert()` with environment variables |
| VAPID Key Hardcoded | 🟡 Medium | ✅ Resolved | Extracted to `NEXT_PUBLIC_FIREBASE_VAPID_KEY` |
| UTC Timezone Sabotage | 🔴 High | ✅ Resolved | Forced UTC+7 on server, local offset on client |
| Hijri "31 Ramadhan" Heresy | 🟡 Medium | ✅ Resolved | Semantic "Malam" rollover without date manipulation |

## 🛠 Tech Stack

- **Core:** Next.js 14 (App Router), React Hooks, Tailwind CSS (Glassmorphism & Custom Palette)
- **Backend:** Firebase Authentication, Firestore, Cloud Messaging (FCM)
- **Integrations:** Mayar Payment Gateway (HMAC-SHA256 Signed), Aladhan Geolocation API
- **QA & Testing:** TestSprite AI Agent

## 📦 Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/0xshalah/Ramadhan-VibeTracker-V2.git

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Fill in your Firebase config, FIREBASE_ADMIN_PRIVATE_KEY, and MAYAR_WEBHOOK_SECRET

# 4. Launch the engine
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

- **Teacher Dashboard (The Verifier):** Dedicated portal for teachers to monitor student progress grids and manually verify tilawah completion.
- **Parent Dashboard (The Observer):** Read-only access to children's spiritual statistics.
- **Guilds & Leaderboards:** Connect the Total XP progression system to school-wide leaderboards.
- **Historical Charts:** Dynamic data visualization for monthly worship trends.
- **Badge Achievement System:** Unlock visual badges for streak milestones and consistent ibadah.

---

*"Build for the Soul, Code for Eternity."* — **0xshalah**

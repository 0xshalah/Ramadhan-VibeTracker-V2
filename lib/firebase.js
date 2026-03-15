import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch, increment, addDoc, serverTimestamp, orderBy, limit, onSnapshot, updateDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// [FIX] Peningkatan Kualitas Timestamp (Anti-UTC)
const getTimestamp = () => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging (Only in client side)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Utility for Local Timezone Date ID (Anti-UTC Sabotage)
export const getLocalTodayId = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
    // Membiarkan browser mendeteksi zona waktu lokal klien secara dinamis (Asia/Jakarta, Asia/Jayapura, dll)
  });
  return formatter.format(now); // Output: "2024-03-12"
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, { lastLogin: getTimestamp() }, { merge: true });
  
  const userSnap = await getDoc(userRef);
  let userRole = userSnap.exists() ? (userSnap.data().role || 'student') : 'student';

  return { ...user, role: userRole };
};

export const logout = () => signOut(auth);

// [NEW] Database Functions
export const getUserProgress = async (uid, dateId) => {
  try {
    const docRef = doc(db, 'users', uid, 'daily_progress', dateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null; // Return null if not exists to initialize defaults
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return null;
  }
};

export const getUserWeeklyProgress = async (uid) => {
  try {
    const today = new Date();
    const past7Days = Array.from({length: 7}, (_, i) => {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       return d.toISOString().split('T')[0];
    });
    const promises = past7Days.map(dateId => getDoc(doc(db, 'users', uid, 'daily_progress', dateId)));
    const snapshots = await Promise.all(promises);
    return snapshots.map((snap, index) => 
      snap.exists() ? { dateId: past7Days[index], ...snap.data() } : { dateId: past7Days[index] }
    );
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return [];
  }
};

// [NEW] Total Realization & Linking: Live Ecosystem & History
export const getMyStudentsLive = (classCode, callback) => {
  const q = query(
    collection(db, 'users'), 
    where('role', '==', 'student'),
    where('classCode', '==', classCode) // Enterprise Relational Check
  );
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    callback(students);
  });
};

export const getWorshipHistory = async (uid) => {
  try {
    const historyRef = collection(db, 'users', uid, 'daily_progress');
    const q = query(historyRef, orderBy('__name__', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ dateId: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching worship history:", err);
    return [];
  }
};

export const updateUserSettings = async (uid, settings) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
  }
};


// [NEW] Eternal Notification Engine
export const saveNotification = async (uid, notification) => {
  try {
    const notifRef = collection(db, 'users', uid, 'notifications');
    await addDoc(notifRef, {
      ...notification,
      timestamp: serverTimestamp(),
      createdAt: getTimestamp(), // Readable backup
      isRead: false
    });
    
    // [BONUS] Auto-Delete (Database Hygiene)
    const currentNotifsSnap = await getDocs(query(notifRef, orderBy('timestamp', 'asc')));
    if (currentNotifsSnap.size > 50) {
      const oldestDoc = currentNotifsSnap.docs[0];
      await deleteDoc(oldestDoc.ref);
    }
  } catch (error) {
    console.error("[ARCHIVER] Failed to seal notification:", error);
  }
};

export const getUserNotifications = async (uid) => {
  try {
    const notifRef = collection(db, 'users', uid, 'notifications');
    // Ambil 20 notifikasi terbaru
    const q = query(notifRef, orderBy('timestamp', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[ARCHIVER] Error fetching history:", error);
    return [];
  }
};

export const updateUserProgress = async (uid, dateId, data) => {
  try {
    const docRef = doc(db, 'users', uid, 'daily_progress', dateId);
    const userRef = doc(db, 'users', uid);
    
    // [SECURITY FIX] Separate Payload: targetTilawah to profile, activity to daily
    const { targetTilawah, earnedXP, ...dailyData } = data;
    
    // Save daily progress (includes earnedXP as absolute value for today)
    await setDoc(docRef, { ...dailyData, earnedXP: earnedXP || 0 }, { merge: true });
    
    // Aggregate Profile (Target Tilawah & Absolute Daily XP — NO increment())
    const profilePayload = { 
        lastActivity: new Date().toISOString()
    };
    if (targetTilawah !== undefined) profilePayload.targetTilawah = targetTilawah;
    // [SECURITY FIX] Store today's XP as absolute value under dailyXP map
    // This prevents the Infinite XP Glitch caused by increment() being called repeatedly
    if (earnedXP !== undefined) {
      profilePayload[`dailyXP.${dateId}`] = earnedXP;
    }
    
    await setDoc(userRef, profilePayload, { merge: true });
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const saveNotificationToken = async (uid, fcmToken) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { 
      fcmToken: fcmToken,
      notificationsEnabled: true,
      lastTokenUpdate: new Date().toISOString()
    }, { merge: true });
    console.log("[FCM] Token synced to Firestore for user:", uid);
  } catch (error) {
    console.error("[FCM] Error saving token:", error);
  }
};

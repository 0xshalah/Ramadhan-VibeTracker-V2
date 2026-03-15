import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch, addDoc, serverTimestamp, orderBy, limit, onSnapshot, updateDoc, Unsubscribe, DocumentData } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";
import { DailyProgressSchema, UserProfileSchema, type DailyProgress, type UserProfile, type AppNotification } from "./schemas";

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════
const getTimestamp = (): string => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

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

// Messaging (Client-side only)
export const messaging: Messaging | null = typeof window !== 'undefined' ? getMessaging(app) : null;

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════
export const getLocalTodayId = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
};

// ═══════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════
export const loginWithGoogle = async (): Promise<User & { role: string }> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  let userRole = 'student'; // Default aman

  if (userSnap.exists()) {
    // PENGGUNA LAMA: Lakukan update (diizinkan oleh rules)
    await updateDoc(userRef, { lastLogin: getTimestamp() });
    userRole = userSnap.data().role || 'student';
  } else {
    // PENGGUNA BARU: JANGAN lakukan setDoc!
    // Klien tidak punya izin 'create'. Cloud Functions yang akan membuatnya di background.
    console.log("[AUTH] Pengguna baru terdeteksi. Menunggu Cloud Functions melakukan inisialisasi...");
  }

  return Object.assign(user, { role: userRole });
};


export const logout = (): Promise<void> => signOut(auth);

// ═══════════════════════════════════════════════════════
// DATA FETCHERS (with Zod Runtime Validation)
// ═══════════════════════════════════════════════════════
export const getUserProgress = async (uid: string, dateId: string): Promise<DailyProgress | null> => {
  try {
    const docRef = doc(db, 'users', uid, 'daily_progress', dateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // [SECURITY GATE] Runtime validation — corrupted data is rejected
      const safeData = DailyProgressSchema.parse(docSnap.data());
      return safeData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      // [SECURITY GATE] Validate profile shape
      const safeProfile = UserProfileSchema.parse(docSnap.data());
      return safeProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const getUserWeeklyProgress = async (uid: string): Promise<(DailyProgress & { dateId: string })[]> => {
  try {
    const today = new Date();
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const promises = past7Days.map(dateId => getDoc(doc(db, 'users', uid, 'daily_progress', dateId)));
    const snapshots = await Promise.all(promises);
    return snapshots.map((snap, index) =>
      snap.exists()
        ? { dateId: past7Days[index], ...DailyProgressSchema.parse(snap.data()) }
        : { dateId: past7Days[index], ...DailyProgressSchema.parse({}) }
    );
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return [];
  }
};

// ═══════════════════════════════════════════════════════
// REAL-TIME LISTENERS
// ═══════════════════════════════════════════════════════
export const getMyStudentsLive = (classCode: string, callback: (students: (UserProfile & { uid: string })[]) => void): Unsubscribe => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    where('classCode', '==', classCode)
  );
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(d => {
      const raw = d.data();
      return { uid: d.id, ...raw } as UserProfile & { uid: string };
    });
    callback(students);
  });
};

// Alias for backwards compatibility
export const getMyChildren = async (parentEmail: string): Promise<(UserProfile & { uid: string })[]> => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('parentEmail', '==', parentEmail));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile & { uid: string }));
  } catch (error) {
    console.error("Error fetching children:", error);
    return [];
  }
};

export const getDetailedHistory = async (uid: string) => getWorshipHistory(uid);

export const getWorshipHistory = async (uid: string): Promise<(DocumentData & { dateId: string })[]> => {
  try {
    const historyRef = collection(db, 'users', uid, 'daily_progress');
    const q = query(historyRef, orderBy('__name__', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ dateId: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching worship history:", err);
    return [];
  }
};

// ═══════════════════════════════════════════════════════
// DATA WRITERS
// ═══════════════════════════════════════════════════════
export const updateUserProgress = async (uid: string, dateId: string, data: Record<string, unknown>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid, 'daily_progress', dateId);
    const userRef = doc(db, 'users', uid);

    const { targetTilawah, earnedXP, ...dailyData } = data as { targetTilawah?: number; earnedXP?: number; [key: string]: unknown };

    await setDoc(docRef, { ...dailyData, earnedXP: earnedXP || 0 }, { merge: true });

    const profilePayload: Record<string, unknown> = {
      lastActivity: new Date().toISOString()
    };
    if (targetTilawah !== undefined) profilePayload.targetTilawah = targetTilawah;
    if (earnedXP !== undefined) {
      profilePayload[`dailyXP.${dateId}`] = earnedXP;
    }

    await setDoc(userRef, profilePayload, { merge: true });
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};

export const updateUserSettings = async (uid: string, settings: Record<string, unknown>): Promise<void> => {
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

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════
export const saveNotification = async (uid: string, notification: AppNotification): Promise<void> => {
  try {
    const notifRef = collection(db, 'users', uid, 'notifications');
    await addDoc(notifRef, {
      ...notification,
      timestamp: serverTimestamp(),
      createdAt: getTimestamp(),
      isRead: false
    });

    const currentNotifsSnap = await getDocs(query(notifRef, orderBy('timestamp', 'asc')));
    if (currentNotifsSnap.size > 50) {
      const oldestDoc = currentNotifsSnap.docs[0];
      await deleteDoc(oldestDoc.ref);
    }
  } catch (error) {
    console.error("[ARCHIVER] Failed to seal notification:", error);
  }
};

export const getUserNotifications = async (uid: string): Promise<(DocumentData & { id: string })[]> => {
  try {
    const notifRef = collection(db, 'users', uid, 'notifications');
    const q = query(notifRef, orderBy('timestamp', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("[ARCHIVER] Error fetching history:", error);
    return [];
  }
};

export const saveNotificationToken = async (uid: string, fcmToken: string): Promise<void> => {
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

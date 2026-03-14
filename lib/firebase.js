import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch, increment } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().split('T')[0];
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Sync user profile to Firestore for webhook mapping
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: new Date().toISOString()
  }, { merge: true });

  // [DECREE 4] Unclaimed Donation Resolver
  try {
    const unclaimedRef = collection(db, 'unclaimed_donations');
    const q = query(unclaimedRef, where('email', '==', user.email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      for (const unclaimedDoc of snapshot.docs) {
        const data = unclaimedDoc.data();
        // Move to users/{uid}/sadaqah/{donationId}
        const targetRef = doc(db, 'users', user.uid, 'sadaqah', unclaimedDoc.id);
        batch.set(targetRef, {
          ...data,
          claimedAt: new Date().toISOString()
        });
        // Delete from unclaimed
        batch.delete(unclaimedDoc.ref);
      }
      await batch.commit();
      console.log(`[RESOLVER] Successfully claimed ${snapshot.size} orphaned donations for ${user.email}`);
    }
  } catch (err) {
    console.error("Error resolving unclaimed donations:", err);
  }
  
  return user;
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

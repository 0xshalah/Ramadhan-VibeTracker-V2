import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
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
    return snapshots.map((snap, index) => snap.exists() ? { dateId: past7Days[index], ...snap.data() } : null);
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    return [];
  }
};

export const updateUserProgress = async (uid, dateId, data) => {
  try {
    const docRef = doc(db, 'users', uid, 'daily_progress', dateId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};

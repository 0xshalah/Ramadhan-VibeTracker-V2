import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
  apiKey: "AIzaSy...", // Will be filled from env in build or hardcoded if necessary for SW
  authDomain: "vibetracker-architect-v2.firebaseapp.com",
  projectId: "vibetracker-architect-v2",
  storageBucket: "vibetracker-architect-v2.firebasestorage.app",
  messagingSenderId: "721098781478",
  appId: "1:721098781478:web:1ab8040ca519bf64c087e7",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  
  // 1. Set Default Role murni di Server (RBAC Anti-Bypass)
  const userRef = db.collection('users').doc(user.uid);
  await userRef.set({
    email: user.email,
    uid: user.uid,
    displayName: user.displayName || 'Santri Baru',
    photoURL: user.photoURL || '',
    role: 'student', // Terkunci, tidak bisa di-bypass klien
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Eksekusi Klaim Donasi secara aman di Server
  const unclaimedRef = db.collection('unclaimed_donations').where('email', '==', user.email);
  const snapshot = await unclaimedRef.get();
  
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      const targetRef = db.collection('users').doc(user.uid).collection('sadaqah').doc(doc.id);
      batch.set(targetRef, { ...doc.data(), claimedAt: new Date().toISOString() });
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[ZERO-TRUST] Orchestrator successfully transferred ${snapshot.size} orphaned donations to user ${user.uid}`);
  }
});

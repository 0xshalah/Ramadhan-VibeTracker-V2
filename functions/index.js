const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  
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

// ═══════════════════════════════════════════════════════
// PHASE 6: LEADERBOARD AGGREGATION ENGINE
// Materialized View Pattern — 1 Document Read untuk 1000 klien
// ═══════════════════════════════════════════════════════
exports.updateGlobalLeaderboard = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    // Jika user dihapus, lewati
    if (!change.after.exists) return null;

    const newData = change.after.data();
    const oldData = change.before.exists ? change.before.data() : {};

    // Kalkulasi Total XP dari map dailyXP
    const calculateTotalXP = (dailyXPMap) => {
      if (!dailyXPMap) return 0;
      return Object.values(dailyXPMap).reduce((acc, curr) => acc + curr, 0);
    };

    const newTotalXP = calculateTotalXP(newData.dailyXP);
    const oldTotalXP = calculateTotalXP(oldData.dailyXP);

    // Cost Guard: Jika XP dan nama tidak berubah, hentikan eksekusi
    if (newTotalXP === oldTotalXP && newData.displayName === oldData.displayName) {
      return null;
    }

    const userId = context.params.userId;
    const leaderboardRef = db.collection('metadata').doc('leaderboard_global');

    // Atomic Transaction (Race Condition Safe)
    return db.runTransaction(async (transaction) => {
      const doc = await transaction.get(leaderboardRef);
      let topUsers = doc.exists ? doc.data().top100 || [] : [];

      const userEntry = {
        uid: userId,
        displayName: newData.displayName || 'Hamba Allah',
        photoURL: newData.photoURL || '',
        totalXP: newTotalXP,
        role: newData.role || 'student'
      };

      // Hanya student yang masuk kompetisi leaderboard
      if (userEntry.role !== 'student') return;

      // Hapus entri lama siswa ini
      topUsers = topUsers.filter((u) => u.uid !== userId);

      // Masukkan data XP baru
      topUsers.push(userEntry);

      // Urutkan descending dan potong Top 100
      topUsers.sort((a, b) => b.totalXP - a.totalXP);
      topUsers = topUsers.slice(0, 100);

      transaction.set(leaderboardRef, { 
        top100: topUsers,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  });

// ============================================================================
// ⏰ CRON JOBS: THE VIBE AUTOMATION ENGINE (Requires Blaze Plan)
// ============================================================================

// 1. STREAK DECAY ENGINE (Berjalan setiap 23:59 WIB)
// Menghukum siswa yang tidak beribadah dengan me-reset streak mereka menjadi 0.
exports.dailyStreakDecay = functions.pubsub.schedule('59 23 * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0];
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'student').get();

    const batch = db.batch();
    let resetCount = 0;

    snapshot.docs.forEach(doc => {
      const userData = doc.data();
      // Jika lastActivity bukan hari ini, reset streak!
      if (!userData.lastActivity || !userData.lastActivity.startsWith(today)) {
        batch.update(doc.ref, { streak: 0 });
        resetCount++;
      }
    });

    if (resetCount > 0) {
      await batch.commit();
      console.log(`[DECAY ENGINE] Mereset streak untuk ${resetCount} siswa yang bolos ibadah.`);
    }
    return null;
  });

// 2. SUBUH PUSH NOTIFICATION (Berjalan setiap 04:00 WIB)
// Membangunkan seluruh siswa yang memiliki FCM Token.
exports.subuhReminder = functions.pubsub.schedule('00 04 * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const usersRef = db.collection('users');
    // Hanya ambil siswa yang menyalakan notifikasi dan memiliki token
    const snapshot = await usersRef
      .where('role', '==', 'student')
      .where('notificationsEnabled', '==', true)
      .get();

    const tokens = [];
    snapshot.docs.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: '🌙 Waktu Sahur Berakhir!',
          body: 'Segera bersiap untuk Sholat Subuh. Jangan putus streak-mu hari ini!',
        },
        tokens: tokens, // Targetkan ke array tokens ini
      };

      const response = await admin.messaging().sendMulticast(payload);
      console.log(`[NOTIF ENGINE] Berhasil mengirim ${response.successCount} notifikasi Subuh.`);
    }
    return null;
  });


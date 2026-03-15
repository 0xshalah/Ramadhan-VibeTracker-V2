import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const SEED_NAMES = [
  'Ahmad Farhan', 'Siti Aisyah', 'Muhammad Rizki', 'Fatimah Zahra', 'Umar Hakim',
  'Khadijah Nur', 'Ibrahim Zaki', 'Maryam Husna', 'Yusuf Qadir', 'Hafsa Rahmah',
  'Ali Syahid', 'Zainab Fitri', 'Bilal Ihsan', 'Ruqayya Amira', 'Hamza Ridwan',
  'Safiya Latifah', 'Idris Mahdi', 'Asma Nabiha', 'Khalid Taufiq', 'Sumayya Wafa',
];

export async function POST(request: Request) {
  try {
    const { adminUid, count = 15 } = await request.json();

    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const batch = adminDb.batch();
    const seedCount = Math.min(count, 20);
    const seededUsers: { uid: string; displayName: string; totalXP: number }[] = [];

    for (let i = 0; i < seedCount; i++) {
      const seedId = `seed_user_${Date.now()}_${i}`;
      const name = SEED_NAMES[i % SEED_NAMES.length];
      const totalXP = Math.floor(Math.random() * 900) + 100; // 100-999 XP
      const streak = Math.floor(Math.random() * 15) + 1;

      const ref = adminDb.collection('users').doc(seedId);
      batch.set(ref, {
        displayName: name,
        email: `${name.toLowerCase().replace(/\s/g, '.')}@demo.vibetracker.app`,
        photoURL: null,
        role: 'student',
        totalXP,
        streak,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        _isSeedData: true, // Flag for easy cleanup
      });

      seededUsers.push({ uid: seedId, displayName: name, totalXP });
    }

    // Also write audit log
    const auditRef = adminDb.collection('audit_logs').doc();
    batch.set(auditRef, {
      action: 'SEED_DATA_INJECTED',
      actorId: adminUid,
      targetUid: 'SYSTEM',
      details: `Admin seeded ${seedCount} demo users for leaderboard simulation`,
      timestamp: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${seedCount} demo users`,
      seededUsers,
    });

  } catch (error: any) {
    console.error('[SEED_ERROR]', error);
    return NextResponse.json({ error: 'Failed to seed data', details: error.message }, { status: 500 });
  }
}

// DELETE endpoint to clean up seed data
export async function DELETE(request: Request) {
  try {
    const { adminUid } = await request.json();

    if (!adminUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Find all seed users
    const seedSnap = await adminDb.collection('users').where('_isSeedData', '==', true).get();
    
    if (seedSnap.empty) {
      return NextResponse.json({ success: true, message: 'No seed data to clean up', deleted: 0 });
    }

    const batch = adminDb.batch();
    seedSnap.docs.forEach(doc => batch.delete(doc.ref));

    const auditRef = adminDb.collection('audit_logs').doc();
    batch.set(auditRef, {
      action: 'SEED_DATA_PURGED',
      actorId: adminUid,
      targetUid: 'SYSTEM',
      details: `Admin purged ${seedSnap.size} seed demo users`,
      timestamp: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: `Purged ${seedSnap.size} seed users`, deleted: seedSnap.size });

  } catch (error: any) {
    console.error('[SEED_CLEANUP_ERROR]', error);
    return NextResponse.json({ error: 'Failed to clean up', details: error.message }, { status: 500 });
  }
}

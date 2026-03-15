import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { uid, email, displayName, requestedRole } = await request.json();

    if (!uid || !email || !requestedRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use email as doc ID to prevent multiple requests from same email
    const docId = email.toLowerCase().trim();
    const requestRef = adminDb.collection('role_requests').doc(docId);
    
    // Check if pending request exists
    const existing = await requestRef.get();
    if (existing.exists && existing.data()?.status === 'pending') {
      return NextResponse.json({ error: 'A pending request already exists for this email.' }, { status: 409 });
    }

    await requestRef.set({
      uid,
      email,
      displayName: displayName || 'Anonymous User',
      requestedRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Audit Log
    await adminDb.collection('audit_logs').add({
      action: 'ROLE_REQUEST_CREATED',
      actorId: uid,
      targetEmail: email,
      details: `User ${email} requested escalation to ${requestedRole}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: 'Request submitted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error("[ROLE_REQUEST_ERROR]", error);
    return NextResponse.json({ error: 'Failed to submit request', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { email, action, adminUid } = await request.json();
    
    if (!email || !action || !adminUid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify Admin Authorization
    // In production, you would securely verify the auth token in headers. 
    // Here we query Firestore to verify the adminUid actually has 'admin' role.
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const docId = email.toLowerCase().trim();
    const requestRef = adminDb.collection('role_requests').doc(docId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestSnap.data()!;
    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Batch Write for atomic operations
    const batch = adminDb.batch();

    // 1. Update Request Status
    batch.update(requestRef, {
      status: newStatus,
      resolvedAt: new Date().toISOString(),
      resolvedBy: adminUid
    });

    // 2. If approved, escalate role in users collection and set JSON Web Token Custom Claims
    if (action === 'approve' && requestData.uid) {
      const userRef = adminDb.collection('users').doc(requestData.uid);
      batch.update(userRef, { role: requestData.requestedRole });
      
      // [GUARDIAN FLOW] Set Custom Claims to lock role at the JWT Level
      await adminAuth.setCustomUserClaims(requestData.uid, { role: requestData.requestedRole });

      // [FCM NOTIFICATION] Kirim Notifikasi Sistem ke Siswa
      const notifRef = adminDb.collection('users').doc(requestData.uid).collection('notifications').doc();
      batch.set(notifRef, {
        id: notifRef.id,
        title: "🎉 Akses Staf Disetujui!",
        body: `Permintaan Anda untuk menjadi ${requestData.requestedRole} telah disetujui oleh Super Admin. Silakan muat ulang (refresh) halaman atau login kembali.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    // 3. Audit Log
    const auditRef = adminDb.collection('audit_logs').doc();
    batch.set(auditRef, {
      action: action === 'approve' ? 'ROLE_APPROVED' : 'ROLE_REJECTED',
      actorId: adminUid,
      targetUid: requestData.uid,
      targetEmail: email,
      details: `Admin ${adminUid} ${newStatus} role request to ${requestData.requestedRole} for ${email}`,
      timestamp: new Date().toISOString()
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: `Request ${newStatus} successfully` }, { status: 200 });

  } catch (error: any) {
    console.error("[ROLE_RESOLUTION_ERROR]", error);
    return NextResponse.json({ error: 'Failed to resolve request', details: error.message }, { status: 500 });
  }
}

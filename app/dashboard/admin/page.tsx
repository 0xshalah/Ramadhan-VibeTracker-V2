"use client";

import React, { useEffect, useState } from 'react';
import { auth, db, getUserProfile, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ErrorBoundary } from 'react-error-boundary';
import Link from 'next/link';

type UserRow = {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  totalXP: number;
  streak: number;
  lastLogin: string;
  photoURL: string;
};

type SystemStats = {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalXPGlobal: number;
};

function AdminDashboardContent() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStats>({ totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalAdmins: 0, totalXPGlobal: 0 });
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/'); return; }

      const profile = await getUserProfile(u.uid);
      if (profile?.role !== 'admin') {
        router.push('/dashboard/student');
        return;
      }
      setAdminName(profile.displayName || u.displayName || 'Admin');

      // Listen to pending role requests
      const requestsRef = collection(db, 'role_requests');
      const qReq = query(requestsRef, where('status', '==', 'pending'));
      const unsubReq = onSnapshot(qReq, (snap) => {
        const reqs: any[] = [];
        snap.docs.forEach(doc => {
          reqs.push({ id: doc.id, ...doc.data() });
        });
        setRoleRequests(reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });

      // Real-time listener on all users
      const usersRef = collection(db, 'users');
      const unsub = onSnapshot(usersRef, (snapshot) => {
        const allUsers: UserRow[] = [];
        let students = 0, teachers = 0, admins = 0, globalXP = 0;

        snapshot.docs.forEach(d => {
          const data = d.data();
          const role = data.role || 'student';
          const xp = data.totalXP || 0;

          if (role === 'student') students++;
          else if (role === 'teacher') teachers++;
          else if (role === 'admin') admins++;
          globalXP += xp;

          allUsers.push({
            uid: d.id,
            displayName: data.displayName || 'Unknown',
            email: data.email || '',
            role,
            totalXP: xp,
            streak: data.streak || 0,
            lastLogin: data.lastLogin || data.createdAt || '—',
            photoURL: data.photoURL || '',
          });
        });

        // Sort by totalXP descending
        allUsers.sort((a, b) => b.totalXP - a.totalXP);
        setUsers(allUsers);
        setStats({
          totalUsers: allUsers.length,
          totalStudents: students,
          totalTeachers: teachers,
          totalAdmins: admins,
          totalXPGlobal: globalXP,
        });
        setLoading(false);
      }, (error) => {
        console.error("[ADMIN CONSOLE] Listener Error:", error);
        setLoading(false);
        // We will let the user see a blank table but at least they won't be stuck loading
      });

      return () => {
        unsub();
        unsubReq();
      };
    });

    return () => unsubAuth();
  }, [router]);

  const handleRoleAction = async (email: string, action: 'approve' | 'reject') => {
    setIsProcessingRequest(email);
    try {
      const res = await fetch('/api/admin/role-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action, adminUid: auth.currentUser?.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = searchQuery === '' ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-indigo-400 animate-spin">settings</span>
          <p className="mt-4 text-slate-400 font-bold">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Top Bar */}
      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">VibeTracker Admin</h1>
            <p className="text-xs text-slate-500">Super Admin Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/teacher" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all">
            <span className="material-symbols-outlined text-[16px]">school</span>
            Teacher View
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-400">{adminName}</span>
          </div>
          <button onClick={logout} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'from-blue-500 to-cyan-500' },
            { label: 'Students', value: stats.totalStudents, icon: 'person', color: 'from-emerald-500 to-green-500' },
            { label: 'Teachers', value: stats.totalTeachers, icon: 'school', color: 'from-amber-500 to-orange-500' },
            { label: 'Admins', value: stats.totalAdmins, icon: 'shield_person', color: 'from-purple-500 to-indigo-500' },
            { label: 'Global XP', value: stats.totalXPGlobal.toLocaleString(), icon: 'stars', color: 'from-pink-500 to-rose-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <span className="material-symbols-outlined text-white text-lg">{stat.icon}</span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Approvals Queue */}
        {roleRequests.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-amber-500">
              <span className="material-symbols-outlined">how_to_reg</span>
              Pending Staff Approvals
            </h2>
            <div className="grid gap-4">
              {roleRequests.map(req => (
                <div key={req.id} className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/50 transition-colors">
                  <div>
                    <h3 className="font-bold text-white">{req.displayName}</h3>
                    <p className="text-sm text-slate-400">{req.email}</p>
                    <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">Requests: {req.requestedRole}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleRoleAction(req.email, 'approve')}
                      disabled={isProcessingRequest === req.email}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingRequest === req.email ? (
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">check_circle</span> Approve</>
                      )}
                    </button>
                    <button 
                      onClick={() => handleRoleAction(req.email, 'reject')}
                      disabled={isProcessingRequest === req.email}
                      className="flex-1 md:flex-none px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Management Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">database</span>
                User Management
              </h2>
              <p className="text-xs text-slate-500">{filteredUsers.length} of {users.length} users shown</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-5 py-3 font-bold">#</th>
                  <th className="px-5 py-3 font-bold">User</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">XP</th>
                  <th className="px-5 py-3 font-bold">Streak</th>
                  <th className="px-5 py-3 font-bold">Last Login</th>
                  <th className="px-5 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr key={user.uid} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-bold">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">person</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        user.role === 'teacher' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-indigo-400">{user.totalXP.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-orange-400 text-[14px]">local_fire_department</span>
                        <span className="font-bold text-orange-400">{user.streak}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{typeof user.lastLogin === 'string' ? user.lastLogin.slice(0, 10) : '—'}</td>
                    <td className="px-5 py-4">
                      {user.role === 'student' && (
                        <Link href={`/dashboard/teacher/student/${user.uid}`} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                          <span className="material-symbols-outlined text-[14px]">analytics</span>
                          Analytics
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="font-bold">No users match your filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FallbackAdminError({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-4">error</span>
        <h3 className="font-bold text-red-400 mb-2">Admin Console Error</h3>
        <p className="text-sm text-red-300/80 mb-4">{error.message}</p>
        <button onClick={resetErrorBoundary} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all">
          Retry
        </button>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  return (
    <ErrorBoundary FallbackComponent={FallbackAdminError}>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}

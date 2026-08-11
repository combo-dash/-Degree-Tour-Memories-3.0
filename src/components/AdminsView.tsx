import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Trash2, Plus, UserCheck, ShieldAlert, User } from 'lucide-react';
import { UserSession } from './AuthScreen';
import { getPublicAdminAvatar } from '../utils/adminAvatars';
import { subscribeUsers, addUserToFirestore, deleteUserFromFirestore } from '../firebase';
import { AppUser } from '../types';

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  assignedModule: string;
  phone: string;
  password?: string;
  rollNo?: string;
}

const INITIAL_ADMINS: AdminMember[] = [
  {
    id: 'superadmin-1',
    name: 'Tanvir Tuhin (Super Admin)',
    email: 'tanvirtuhin482@gmail.com',
    role: 'superadmin',
    assignedModule: 'Central Executive Committee',
    phone: '01712-345678',
    password: 'Tanvir@tuhin-88'
  }
];

interface AdminsViewProps {
  currentUser: UserSession | null;
}

export const AdminsView: React.FC<AdminsViewProps> = ({ currentUser }) => {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [moduleName, setModuleName] = useState('Central Executive Committee');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    const unsub = subscribeUsers((users) => {
      setAppUsers(users);
      const localAdmins = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').map((u) => ({
        ...u,
        role: u.role as 'admin' | 'superadmin',
        assignedModule: u.assignedModule || 'Management Committee',
      }));
      setAdmins([...INITIAL_ADMINS, ...localAdmins]);
    });
    return () => unsub();
  }, []);

  if (currentUser?.role === 'student' || (!isSuperAdmin && currentUser?.role !== 'admin')) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 max-w-xl mx-auto my-12 shadow-2xl relative">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10 shrink-0">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            এডমিন প্যানেল (Admin Panel) মডিউলটির অ্যাক্সেস শুধুমাত্র সুপার এডমিন এবং এডমিনদের জন্য সীমাবদ্ধ রাখা হয়েছে।
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Restricted for Student Role</span>
          </span>
        </div>
      </div>
    );
  }

  // Only super admins can see the full list of other admins
  const displayAdmins = isSuperAdmin ? admins : admins.filter(a => a.role === 'superadmin' || a.id === currentUser?.id);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('শুধুমাত্র সুপার এডমিন নতুন এডমিন যুক্ত করতে পারেন।');
      return;
    }
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    const newAdmin: AppUser = {
      id: `admin-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      role: 'admin',
      assignedModule: moduleName,
      phone: phone || '01700-000000',
      password: password,
      rollNo: 'ADMIN-' + Math.floor(100 + Math.random() * 900)
    };

    // check duplicate
    if (appUsers.find((u) => u.email === newAdmin.email)) {
       setErrorMsg('এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে!');
       return;
    }

    addUserToFirestore(newAdmin);

    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setIsAddOpen(false);
  };

  const handleDeleteAdmin = (id: string) => {
    if (!isSuperAdmin) return;
    
    // Remove from Firestore
    deleteUserFromFirestore(id);
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header Card matching Image 4 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white text-slate-900 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-rose-900 leading-tight">
            Admin Access & Control Panel
          </h1>
          <p className="text-xs font-semibold text-rose-700 mt-0.5">
            Super Admin Control: Add/Delete Admins & Grant Full Access
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-blue-500">
          Admin Authority Members ({displayAdmins.length})
        </h2>
      </div>

      {/* Admin Member Cards */}
      <div className="space-y-4">
        {displayAdmins.map((adm) => (
          <div
            key={adm.id}
            className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg relative"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const avatar = getPublicAdminAvatar(adm.role, adm.email, adm.name);
                  return avatar ? (
                    <img
                      src={avatar}
                      alt={adm.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shadow-md shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
                      {adm.name.charAt(0)}
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{adm.name}</h3>
                  <p className="text-xs text-slate-400">{adm.assignedModule}</p>
                </div>
              </div>

              {isSuperAdmin && adm.role !== 'superadmin' && (
                <button
                  onClick={() => handleDeleteAdmin(adm.id)}
                  className="text-rose-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  title="Delete Admin"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-slate-300">
                  <span className="text-slate-400">Email:</span>{' '}
                  {adm.role === 'superadmin' && !isSuperAdmin ? (
                    <span className="text-slate-500 font-mono italic">••••••••@••••.com (Protected)</span>
                  ) : (
                    adm.email
                  )}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Phone:</span>{' '}
                  {adm.role === 'superadmin' && !isSuperAdmin ? (
                    <span className="text-slate-500 font-mono italic">••••••••••</span>
                  ) : (
                    adm.phone
                  )}
                </p>
                {adm.password && (
                  <p className="text-blue-400 font-bold">
                    <span className="text-slate-400 font-normal">Password:</span>{' '}
                    {adm.role === 'superadmin' && !isSuperAdmin ? (
                      <span className="text-rose-400/80 font-mono italic">•••••••• (Protected)</span>
                    ) : (
                      adm.password
                    )}
                  </p>
                )}
              </div>

              <div className="mt-2 sm:mt-0">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Full Master Access</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Floating Add New Admin Button */}
      {isSuperAdmin && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm shadow-xl shadow-rose-500/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Admin</span>
          </button>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">নতুন এডমিন যুক্ত করুন</h3>

            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">এডমিনের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ সাব্বির হোসেন"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ইমেইল</label>
                <input
                  type="email"
                  required
                  placeholder="admin2@degreetour.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  placeholder="01700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">কমোটি / পদবী</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">নতুন পাসওয়ার্ড (New Password)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">কনফার্ম পাসওয়ার্ড (Confirm Password)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-bold bg-rose-950/50 p-2 rounded-xl border border-rose-900">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-500 hover:bg-rose-600 cursor-pointer shadow-md"
                >
                  এডমিন হিসাবে সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


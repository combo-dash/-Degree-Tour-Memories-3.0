import React, { useState, useEffect } from 'react';
import { Batchmate, AppUser, BusPackage } from '../types';
import { Users, Award, Phone, Quote, Plus, Search, User, X, Check, Lock, ShieldAlert, Edit, Trash2, GraduationCap, MapPin, ChevronRight, ShieldCheck, Bus } from 'lucide-react';
import { UserSession } from './AuthScreen';
import { subscribeUsers, disableUserInFirestore } from '../firebase';

interface BatchmateDirectoryProps {
  batchmates: Batchmate[];
  onAddBatchmate: (batchmate: Omit<Batchmate, 'id'>) => void;
  onUpdateBatchmate?: (id: string, updates: Partial<Batchmate>) => void;
  onDeleteBatchmate?: (id: string) => void;
  currentUser?: UserSession | null;
  buses: BusPackage[];
}

export const BatchmateDirectory: React.FC<BatchmateDirectoryProps> = ({
  batchmates,
  onAddBatchmate,
  onUpdateBatchmate,
  onDeleteBatchmate,
  currentUser,
  buses
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Batchmate | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const unsub = subscribeUsers(setAppUsers);
    return () => unsub();
  }, []);

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Form State
  const [name, setName] = useState('');
  const [nickName, setNickName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('BA');
  const [phone, setPhone] = useState('');

  const filteredBatchmates = batchmates.filter(
    (b) =>
      (b.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.nickName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.rollNo?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId('');
    setName('');
    setNickName('');
    setRollNo('');
    setSection('BA');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Batchmate) => {
    setIsEditMode(true);
    setEditingId(b.id);
    setName(b.name);
    setNickName(b.nickName);
    setRollNo(b.rollNo);
    setSection(b.section || 'BA');
    setPhone(b.phone || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim()) return;

    const payload = {
      name: name.trim(),
      nickName: nickName.trim() || name.trim(),
      rollNo: rollNo.trim(),
      section: section || 'BA',
      phone: phone.trim(),
      // Maintain old fields for existing data but set defaults for new
      quote: isEditMode && editingId ? (batchmates.find(b => b.id === editingId)?.quote || '') : '',
      photoUrl: isEditMode && editingId ? (batchmates.find(b => b.id === editingId)?.photoUrl || '') : '',
      favoriteMemory: isEditMode && editingId ? (batchmates.find(b => b.id === editingId)?.favoriteMemory || '') : '',
      awards: isEditMode && editingId ? (batchmates.find(b => b.id === editingId)?.awards || []) : []
    };

    if (isEditMode && editingId) {
      if (onUpdateBatchmate) {
        onUpdateBatchmate(editingId, payload);
      }
    } else {
      onAddBatchmate(payload);
    }

    // Reset Form & Close
    setName('');
    setNickName('');
    setRollNo('');
    setPhone('');
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId('');
  };

  const getStudentBusSeat = (studentRoll: string) => {
    for (const bus of buses) {
      const seats = (bus.seats || {}) as Record<string, any>;
      const seatEntry = Object.entries(seats).find(([_, seat]: [string, any]) => {
        const student = batchmates.find(b => b.rollNo === studentRoll);
        return (
          seat.bookedBy?.toLowerCase() === student?.name?.toLowerCase() ||
          seat.bookedPhone === student?.phone
        );
      });
      if (seatEntry) {
        return { busName: bus.name, seatNo: seatEntry[0] };
      }
    }
    return null;
  };

  const handleDelete = (id: string, sName: string) => {
    // Disable associated AppUser if found
    const student = batchmates.find(b => b.id === id);
    if (student) {
      const appUser = appUsers.find(u => u.rollNo === student.rollNo);
      if (appUser) {
        disableUserInFirestore(appUser.id);
      }
    }
    // Remove batchmate record
    if (onDeleteBatchmate) {
      onDeleteBatchmate(id);
    }
  };

  if (!isAdminOrSuper) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">অ্যাক্সেস সংরক্ষিত (Access Restricted)</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          স্টুডেন্ট ডিটেইলস এবং ইনফরমেশন শুধুমাত্র এডমিন এবং সুপার এডমিনগণ দেখতে ও পরিবর্তন করতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Search */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-sky-400" />
              <span>স্টুডেন্ট ডিটেইলস (Student Details)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ডিগ্রী ট্যুর ৩.০ এর সহযাত্রী স্টুডেন্টদের পরিচিতি ডায়েরি। রো-তে ক্লিক করে ডিটেইলস দেখুন।
            </p>
          </div>

          {isAdminOrSuper && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্টুডেন্ট যুক্ত করুন</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ডাকনাম বা রোল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* List View (Google Sheet Style) */}
      <div className="space-y-2">
        {filteredBatchmates.map((b, index) => {
          if (!b || !b.id) return null;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedStudent(b)}
              className="group flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-4 flex-grow">
                {/* Serial & Icon */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-sky-400 font-black text-xs border border-slate-700">
                    {index + 1}
                  </span>
                  <div className="relative w-12 h-12 rounded-xl bg-slate-950 border-2 border-sky-500/30 group-hover:border-sky-400 transition-colors flex-shrink-0 flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                </div>

                {/* Main Info */}
                <div className="min-w-0 flex-grow grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
                  <div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-sky-300 transition-colors">{b.name}</h3>
                    <p className="text-[10px] text-sky-400 font-semibold truncate">ডাকনাম: "{b.nickName}"</p>
                  </div>
                  
                  <div className="text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      <span>রোল: {b.rollNo}</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20 text-[9px]">
                        {b.section || 'BA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{b.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/50">
                {getStudentBusSeat(b.rollNo) && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 text-[10px] text-slate-500">
                    <Bus className="w-3 h-3 text-sky-500" />
                    {getStudentBusSeat(b.rollNo)?.seatNo}
                  </div>
                )}

                {isAdminOrSuper && (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="সম্পাদনা করুন"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-sky-500 transition-colors hidden md:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Details Viewer Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Info Layout */}
            <div className="flex flex-col items-center gap-4 pt-2 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-sky-500/30 shrink-0 shadow-lg shadow-sky-500/10 flex items-center justify-center text-slate-500">
                <User className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">{selectedStudent.name}</h3>
                <p className="text-sm text-sky-400 font-bold tracking-wide">ডাকনাম: "{selectedStudent.nickName}"</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">রোল নম্বর</p>
                    <p className="text-sm text-white font-bold">{selectedStudent.rollNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">গ্রুপ (Group)</p>
                  <p className="text-sm text-sky-400 font-bold">{selectedStudent.section || 'BA'}</p>
                </div>
              </div>

              {getStudentBusSeat(selectedStudent.rollNo) && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">বাস ও সিট</p>
                      <p className="text-sm text-white font-bold">
                        {`${getStudentBusSeat(selectedStudent.rollNo)?.busName} - Seat ${getStudentBusSeat(selectedStudent.rollNo)?.seatNo}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">ফোন নম্বর</p>
                    <p className="text-sm text-emerald-400 font-bold">{selectedStudent.phone || 'N/A'}</p>
                  </div>
                </div>
                {selectedStudent.phone && (
                   <a
                     href={`tel:${selectedStudent.phone}`}
                     className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20"
                   >
                     <Phone className="w-3.5 h-3.5" />
                   </a>
                )}
              </div>
            </div>

            {/* Admin Action Buttons */}
            {isAdminOrSuper && (
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    openEditModal(selectedStudent);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                >
                  <Edit className="w-4 h-4" />
                  <span>তথ্য সংশোধন (Edit)</span>
                </button>
                <button
                  onClick={() => {
                    const idToDelete = selectedStudent.id;
                    const nameToDelete = selectedStudent.name;
                    setSelectedStudent(null);
                    handleDelete(idToDelete, nameToDelete);
                  }}
                  className="flex-1 py-3 bg-rose-950/30 hover:bg-rose-600 text-rose-500 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>মুছে ফেলুন (Delete)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add & Edit Batchmate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Edit className="w-5 h-5" />
              </div>
              <span>{isEditMode ? 'স্টুডেন্ট তথ্য সংশোধন করুন' : 'নতুন স্টুডেন্ট নিবন্ধন করুন'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest ml-1">সম্পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest ml-1">ডাকনাম</label>
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="ডাকনাম"
                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest ml-1">রোল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="যেমন: 101"
                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest ml-1">গ্রুপ (Group) *</label>
                   <select
                     value={section}
                     onChange={(e) => setSection(e.target.value)}
                     className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer"
                   >
                     <option value="BA">BA</option>
                     <option value="BBS">BBS</option>
                     <option value="BSS">BSS</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest ml-1">ফোন নম্বর</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all"
                >
                  {isEditMode ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

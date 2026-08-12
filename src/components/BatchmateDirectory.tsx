import React, { useState, useEffect } from 'react';
import { Batchmate, AppUser } from '../types';
import { Users, Award, Phone, Quote, Plus, Search, User, X, Check, Lock, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { UserSession } from './AuthScreen';
import { subscribeUsers, disableUserInFirestore } from '../firebase';

interface BatchmateDirectoryProps {
  batchmates: Batchmate[];
  onAddBatchmate: (batchmate: Omit<Batchmate, 'id'>) => void;
  onUpdateBatchmate?: (id: string, updates: Partial<Batchmate>) => void;
  onDeleteBatchmate?: (id: string) => void;
  currentUser?: UserSession | null;
}

export const BatchmateDirectory: React.FC<BatchmateDirectoryProps> = ({
  batchmates,
  onAddBatchmate,
  onUpdateBatchmate,
  onDeleteBatchmate,
  currentUser
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
  const [section, setSection] = useState('A');
  const [quote, setQuote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [favoriteMemory, setFavoriteMemory] = useState('');
  const [phone, setPhone] = useState('');
  const [awardsText, setAwardsText] = useState('ট্যুর ফেলো 🌟');

  const filteredBatchmates = batchmates.filter(
    (b) =>
      (b.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.nickName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.rollNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.quote?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId('');
    setName('');
    setNickName('');
    setRollNo('');
    setSection('A');
    setQuote('');
    setPhotoUrl('');
    setFavoriteMemory('');
    setPhone('');
    setAwardsText('ট্যুর ফেলো 🌟');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Batchmate) => {
    setIsEditMode(true);
    setEditingId(b.id);
    setName(b.name);
    setNickName(b.nickName);
    setRollNo(b.rollNo);
    setSection(b.section || 'A');
    setQuote(b.quote || '');
    setPhotoUrl(b.photoUrl);
    setFavoriteMemory(b.favoriteMemory || '');
    setPhone(b.phone || '');
    setAwardsText(b.awards ? b.awards.join(', ') : 'ট্যুর ফেলো 🌟');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim()) return;

    const defaultPhoto = photoUrl.trim()
      ? photoUrl.trim()
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const awardsList = awardsText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      nickName: nickName.trim() || name.trim(),
      rollNo: rollNo.trim(),
      section: section || 'A',
      quote: quote.trim() || 'Degree Tour 3.0 was unforgettable!',
      photoUrl: defaultPhoto,
      favoriteMemory: favoriteMemory.trim() || 'সাজেক ভ্যালি নাইট',
      phone: phone.trim(),
      awards: awardsList.length > 0 ? awardsList : ['ট্যুর ফেলো 🌟']
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
    setQuote('');
    setPhotoUrl('');
    setFavoriteMemory('');
    setPhone('');
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId('');
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
              ডিগ্রী ট্যুর ৩.০ এর সহযাত্রী স্টুডেন্টদের পরিচিতি ডায়েরি। কার্ডে ক্লিক করে ডিটেইলস দেখুন।
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatchmates.map((b) => {
          if (!b || !b.id) return null;
          const appUser = appUsers.find(u => u.rollNo === b.rollNo);
          const finalPhotoUrl = appUser?.avatarUrl || b.photoUrl;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedStudent(b)}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between group cursor-pointer hover:shadow-sky-500/5 hover:-translate-y-0.5"
            >
              <div className="space-y-4">
                {/* Profile Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-500/30 group-hover:border-sky-400 transition-colors flex-shrink-0">
                      <img
                        src={finalPhotoUrl}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white leading-tight group-hover:text-sky-300 transition-colors">{b.name}</h3>
                      <p className="text-xs text-sky-400 font-semibold">ডাকনাম: "{b.nickName}"</p>
                      <p className="text-[11px] text-slate-400">রোল: {b.rollNo} (Section {b.section || 'A'})</p>
                    </div>
                  </div>

                  {/* Admin Actions directly on card */}
                  {isAdminOrSuper && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="সম্পাদনা করুন"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Award Badges */}
                {b.awards && b.awards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {b.awards.map((award, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold"
                      >
                        <Award className="w-3 h-3 text-amber-400" />
                        {award}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quote */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 italic flex gap-2">
                  <Quote className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">"{b.quote}"</span>
                </div>

                {/* Favorite Memory */}
                {b.favoriteMemory && (
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-200">সেরা স্মৃতি:</strong> {b.favoriteMemory}
                  </div>
                )}
              </div>

              {/* Footer Contact */}
              {b.phone && (
                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {b.phone}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium group-hover:text-sky-400 transition-colors">
                    Click to view full details →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 1-Click Student Details Viewer Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Info Layout */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-500/40 shrink-0">
                <img
                  src={appUsers.find(u => u.rollNo === selectedStudent.rollNo)?.avatarUrl || selectedStudent.photoUrl}
                  alt={selectedStudent.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">{selectedStudent.name}</h3>
                <p className="text-sm text-sky-400 font-bold">ডাকনাম: "{selectedStudent.nickName}"</p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                    রোল: {selectedStudent.rollNo}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                    সেকশন: {selectedStudent.section || 'A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300 italic flex gap-3">
              <Quote className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <span>"{selectedStudent.quote || 'Degree Tour 3.0 memories forever!'}"</span>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="space-y-4 pt-2">
              {/* Awards */}
              {selectedStudent.awards && selectedStudent.awards.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">ব্যাচ অ্যাওয়ার্ডস</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.awards.map((award, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Memory */}
              {selectedStudent.favoriteMemory && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">ট্যুরের সেরা স্মৃতি</span>
                  <p className="text-sm text-slate-300 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 font-medium">
                    ✨ {selectedStudent.favoriteMemory}
                  </p>
                </div>
              )}

              {/* Phone */}
              {selectedStudent.phone && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">যোগাযোগ নম্বর</span>
                  <a
                    href={`tel:${selectedStudent.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/20 px-4 py-2 rounded-2xl border border-emerald-500/20 hover:bg-emerald-950/40 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{selectedStudent.phone}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Admin Buttons Inside View Modal */}
            {isAdminOrSuper && (
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    openEditModal(selectedStudent);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>{isEditMode ? 'স্টুডেন্ট তথ্য সংশোধন করুন' : 'নতুন স্টুডেন্ট নিবন্ধন করুন'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">সম্পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">ডাকনাম</label>
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="যেমন: তুহিন"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">রোল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="যেমন: DEG-88-012"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">ছবি সংযোগ (Photo URL)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">ট্যুর উক্তি / বাণী (Tour Quote)</label>
                <textarea
                  rows={2}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="আপনার প্রিয় কোনো ট্যুর উক্তি..."
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">ব্যাচ অ্যাওয়ার্ডস (কমা দিয়ে লিখুন)</label>
                <input
                  type="text"
                  value={awardsText}
                  onChange={(e) => setAwardsText(e.target.value)}
                  placeholder="যেমন: ডিজে অফ দ্যা ট্যুর 🎶, ফটো মাস্টার 📸"
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">ফোন নম্বর</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">সেরা স্মৃতি</label>
                  <input
                    type="text"
                    value={favoriteMemory}
                    onChange={(e) => setFavoriteMemory(e.target.value)}
                    placeholder="যেমন: সাজেক বার্বিকিউ নাইট"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl"
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

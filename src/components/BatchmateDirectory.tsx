import React, { useState } from 'react';
import { Batchmate } from '../types';
import { Users, Award, Phone, Quote, Plus, Search, User, X, Check, Lock, ShieldAlert } from 'lucide-react';
import { UserSession } from './AuthScreen';

interface BatchmateDirectoryProps {
  batchmates: Batchmate[];
  onAddBatchmate: (batchmate: Omit<Batchmate, 'id'>) => void;
  currentUser?: UserSession | null;
}

export const BatchmateDirectory: React.FC<BatchmateDirectoryProps> = ({
  batchmates,
  onAddBatchmate,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // If user is logged in as a student, display restricted access card
  if (currentUser?.role === 'student') {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 max-w-xl mx-auto my-12 shadow-2xl relative">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10 shrink-0">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            শিক্ষার্থী অ্যাকাউন্ট (Student Account) সনাক্ত করা হয়েছে। শিক্ষার্থী তালিকা (Students Directory) মডিউলটি দেখার অনুমতি শুধুমাত্র এডমিনদের দেওয়া আছে।
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
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nickName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.quote && b.quote.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

    onAddBatchmate({
      name: name.trim(),
      nickName: nickName.trim() || name.trim(),
      rollNo: rollNo.trim(),
      section: section || 'A',
      quote: quote.trim() || 'Degree Tour 3.0 was unforgettable!',
      photoUrl: defaultPhoto,
      favoriteMemory: favoriteMemory.trim() || 'সাজেক ভ্যালি নাইট',
      phone: phone.trim(),
      awards: awardsList.length > 0 ? awardsList : ['ট্যুর ফেলো 🌟']
    });

    // Reset Form & Close
    setName('');
    setNickName('');
    setRollNo('');
    setQuote('');
    setPhotoUrl('');
    setFavoriteMemory('');
    setPhone('');
    setIsModalOpen(false);
  };

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
              ডিগ্রী ট্যুর ৩.০ এর সহযাত্রী স্টুডেন্টদের পরিচিতি ডায়েরি।
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন স্টুডেন্ট যুক্ত করুন</span>
          </button>
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
        {filteredBatchmates.map((b) => (
          <div
            key={b.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-500/30 group-hover:border-sky-400 transition-colors flex-shrink-0">
                  <img
                    src={b.photoUrl}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">{b.name}</h3>
                  <p className="text-xs text-sky-400 font-semibold">ডাকনাম: "{b.nickName}"</p>
                  <p className="text-[11px] text-slate-400">রোল: {b.rollNo} (Section {b.section || 'A'})</p>
                </div>
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
                <span>"{b.quote}"</span>
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Batchmate Modal */}
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
              <span>নতুন স্টুডেন্ট নিবন্ধন করুন</span>
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
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

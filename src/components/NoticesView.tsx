import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, Plus, Search, AlertCircle, Pin, Calendar, ShieldCheck, Edit2, Trash2, X } from 'lucide-react';
import { UserSession } from './AuthScreen';
import { subscribeNotices, addNoticeToFirestore, deleteNoticeFromFirestore, updateNoticeInFirestore } from '../firebase';

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  isPinned: boolean;
  priority: 'High' | 'Normal';
  timestamp?: number;
}

const INITIAL_NOTICES: Notice[] = [];

interface NoticesViewProps {
  currentUser: UserSession | null;
}

export const NoticesView: React.FC<NoticesViewProps> = ({ currentUser }) => {
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [priority, setPriority] = useState<'High' | 'Normal'>('Normal');

  useEffect(() => {
    const unsubscribe = subscribeNotices(setNotices);
    return () => unsubscribe();
  }, []);

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    if (editingNotice) {
      await updateNoticeInFirestore(editingNotice.id, {
        title: newTitle,
        content: newContent,
        isPinned: priority === 'High',
        priority
      });
      setEditingNotice(null);
    } else {
      const noticeObj: Omit<Notice, 'id'> = {
        title: newTitle,
        content: newContent,
        author: currentUser?.name || 'অফিসিয়াল এডমিন',
        authorRole: currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin',
        date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        isPinned: priority === 'High',
        priority
      };

      await addNoticeToFirestore(noticeObj);
    }
    
    setNewTitle('');
    setNewContent('');
    setIsAddOpen(false);
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      await deleteNoticeFromFirestore(id);
    }
  };

  const handleEditClick = (n: Notice) => {
    setEditingNotice(n);
    setNewTitle(n.title);
    setNewContent(n.content);
    setPriority(n.priority);
    setIsAddOpen(true);
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportant = showImportantOnly ? (n.priority === 'High' || n.isPinned) : true;
    return matchesSearch && matchesImportant;
  });

  return (
    <div className="space-y-6 relative pb-20">
      {/* Official Notice Board Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Official Notice Board</h1>
          <p className="text-xs text-slate-400 mt-0.5">Publish official announcements for all students</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => setShowImportantOnly(!showImportantOnly)}
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            showImportantOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-rose-500 font-black">!</span>
          <span>Important</span>
        </button>
      </div>

      {/* Notices Feed or Empty State */}
      {filteredNotices.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
          <Bell className="w-12 h-12 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-400">No notices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`p-6 rounded-3xl border transition-all ${
                n.isPinned
                  ? 'bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {n.isPinned && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Pin className="w-3 h-3" /> পিন করা
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {n.date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {n.author}
                  </span>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditClick(n)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Edit Notice"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteNotice(n.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{n.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Bottom Action Button */}
      {isAdminOrSuper && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Publish Notice</span>
          </button>
        </div>
      )}

      {/* Add / Edit Notice Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingNotice ? 'নোটিশটি এডিট করুন' : 'নতুন নোটিশ প্রকাশ করুন'}
              </h3>
              <button onClick={() => { setIsAddOpen(false); setEditingNotice(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">নোটিশের শিরোনাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ট্যুর টি-শার্ট বিতরণ সংক্রান্ত"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">বিস্তারিত নোটিশ</label>
                <textarea
                  rows={4}
                  required
                  placeholder="নোটিশের তথ্য বিস্তারিত লিখুন..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">প্রাধিকার / Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Normal">সাধারন নোটিশ (Normal)</option>
                  <option value="High">জরুরি / পিন নোটিশ (High Priority)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingNotice(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-md"
                >
                  {editingNotice ? 'আপডেট করুন' : 'পাবলিশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { Memory, Comment } from '../types';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Tag,
  Search,
  Flame,
  Camera,
  BookOpen,
  Music,
  Smile,
  Send,
  User,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemoryFeedProps {
  memories: Memory[];
  onLike: (memoryId: string, currentLikes: number) => void;
  onAddComment: (memoryId: string, comment: Comment) => void;
  onOpenAddModal: () => void;
}

export const MemoryFeed: React.FC<MemoryFeedProps> = ({
  memories,
  onLike,
  onAddComment,
  onOpenAddModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { key: 'All', label: 'সব স্মৃতি', icon: Flame },
    { key: 'Photo', label: 'ছবি', icon: Camera },
    { key: 'Story', label: 'গল্প', icon: BookOpen },
    { key: 'BBQ & Music', label: 'গান ও BBQ', icon: Music },
    { key: 'Funny Moment', label: 'মজার দৃশ্য', icon: Smile }
  ];

  const filteredMemories = memories.filter((mem) => {
    const matchesCat =
      selectedCategory === 'All' || mem.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const handleHeartClick = (e: React.MouseEvent, mem: Memory) => {
    // Fire confetti from heart location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { x, y },
      colors: ['#f43f5e', '#fbbf24', '#10b981', '#3b82f6']
    });

    onLike(mem.id, mem.likes || 0);
  };

  const handleShare = (mem: Memory) => {
    const shareText = `Degree Tour 3.0 Memory: ${mem.title} - ${mem.location}`;
    if (navigator.share) {
      navigator.share({
        title: mem.title,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopiedId(mem.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent, memoryId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComm: Comment = {
      id: 'c-' + Date.now(),
      author: commentAuthor.trim() || 'ব্যাচমেট',
      text: commentText.trim(),
      createdAt: 'এখনই'
    };

    onAddComment(memoryId, newComm);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Category Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন... (শিরোনাম, স্থান, লেখক বা ট্যাগ যেমন #Sajek)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Quick Post Memory CTA */}
          <button
            onClick={onOpenAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all whitespace-nowrap shadow-md cursor-pointer"
          >
            + নতুন স্মৃতি শেয়ার করুন
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Feed Cards List */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <Smile className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">কোনো স্মৃতি পাওয়া যায়নি!</h3>
          <p className="text-xs text-slate-400 mt-1">
            আপনার অনুসন্ধান ফিল্টারটি পরিবর্তন করে দেখুন অথবা প্রথম স্মৃতিটি শেয়ার করুন।
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            + স্মৃতি যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMemories.map((mem) => {
            const isCommentsOpen = activeCommentId === mem.id;

            return (
              <div
                key={mem.id}
                className="flex flex-col justify-between rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all shadow-xl overflow-hidden group"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
                        {mem.authorName ? mem.authorName.substring(0, 1) : 'D'}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {mem.authorName}
                        </h4>
                        {mem.authorRole && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            {mem.authorRole}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {mem.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Image or Video if available */}
                  {mem.imageUrl && (
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      {mem.imageUrl.startsWith('data:video') ||
                      mem.imageUrl.endsWith('.mp4') ||
                      mem.imageUrl.endsWith('.webm') ||
                      mem.category === 'Video' ? (
                        <video
                          src={mem.imageUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mem.imageUrl}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            // Replace broken image with dark placeholder
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                      
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white pointer-events-none">
                        <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {mem.location}
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-300">
                          {mem.date}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {mem.title}
                    </h3>

                    {!mem.imageUrl && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pb-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{mem.location}</span>
                        <span>•</span>
                        <span>{mem.date}</span>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {mem.description}
                    </p>

                    {/* Tags */}
                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mem.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-amber-300/90 border border-slate-700/50"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 sm:px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={(e) => handleHeartClick(e, mem)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all cursor-pointer group/like"
                      >
                        <Heart className="w-4 h-4 fill-rose-500/20 group-hover/like:scale-125 transition-transform" />
                        <span>{mem.likes || 0}</span>
                      </button>

                      {/* Comment Toggle */}
                      <button
                        onClick={() =>
                          setActiveCommentId(isCommentsOpen ? null : mem.id)
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {mem.comments ? mem.comments.length : 0} মন্তব্য
                        </span>
                      </button>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(mem)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedId === mem.id ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> লিংক কপি হয়েছে
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5" /> শেয়ার
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Comment Drawer Section */}
                  {isCommentsOpen && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
                      {/* Comment List */}
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {(!mem.comments || mem.comments.length === 0) ? (
                          <p className="text-xs text-slate-500 italic text-center py-2">
                            এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি লিখুন!
                          </p>
                        ) : (
                          mem.comments.map((comm) => (
                            <div
                              key={comm.id}
                              className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs"
                            >
                              <div className="flex items-center justify-between text-amber-300 font-semibold mb-0.5">
                                <span>{comm.author}</span>
                                <span className="text-[10px] text-slate-400">
                                  {comm.createdAt}
                                </span>
                              </div>
                              <p className="text-slate-200">{comm.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input Form */}
                      <form
                        onSubmit={(e) => handleCommentSubmit(e, mem.id)}
                        className="space-y-2"
                      >
                        <input
                          type="text"
                          placeholder="আপনার নাম (ঐচ্ছিক)"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="মন্তব্য লিখুন..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

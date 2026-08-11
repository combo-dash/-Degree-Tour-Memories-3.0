import React from 'react';
import { Memory, Batchmate, TourSpot } from '../types';
import { Camera, MapPin, Users, Heart, Award, Bus, Flame, Clock } from 'lucide-react';

interface TourStatsProps {
  memories: Memory[];
  batchmates: Batchmate[];
  spots: TourSpot[];
}

export const TourStats: React.FC<TourStatsProps> = ({
  memories,
  batchmates,
  spots
}) => {
  const totalLikes = memories.reduce((acc, m) => acc + (m.likes || 0), 0);
  const totalPhotos = memories.filter(m => m.category === 'Photo' || m.imageUrl).length;
  const totalStories = memories.filter(m => m.category === 'Story' || m.category === 'Funny Moment').length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Degree Tour 3.0 Dashboard
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-white tracking-tight">
            ডিগ্রী ট্যুর ৩.০ এর স্মরণীয় মুহূর্ত ও পরিসংখ্যান 📊
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            সাজেক ভ্যালির মেঘ থেকে কক্সবাজারের সমুদ্র সৈকত - ব্যাচ ৮৮ এর বন্ধুদের অবিস্মরণীয় ট্যুরের গল্প, ছবি এবং পরিসংখ্যান একনজরে দেখে নিন।
          </p>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">মোট স্মৃতি</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{memories.length}</p>
          <p className="mt-1 text-xs text-slate-400">{totalPhotos} টি ছবি ও {totalStories} টি গল্প</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">মোট রিয়্যাকশন</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{totalLikes}</p>
          <p className="mt-1 text-xs text-slate-400">ব্যাচমেটদের রিয়েলটাইম লাভ</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">দর্শনীয় স্থান</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{spots.length}</p>
          <p className="mt-1 text-xs text-slate-400">সাজেক, খাগড়াছড়ি, কক্সবাজার</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">ব্যাচমেট</span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-white">{batchmates.length}</p>
          <p className="mt-1 text-xs text-slate-400">ব্যাচ ৮৮ এর সদস্যবৃন্দ</p>
        </div>
      </div>

      {/* Fun Facts Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Fun Metrics */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>ট্যুর ফান ফ্যাক্টস (Fun Metrics)</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">মোট পথ অতিক্রম</p>
                  <p className="text-xs text-slate-400">ঢাকা - সাজেক - কক্সবাজার</p>
                </div>
              </div>
              <span className="text-base font-bold text-amber-400">১,২০০+ কিমি</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">বার্বিকিউ চিকেন খাওয়া</p>
                  <p className="text-xs text-slate-400">মেঘমাচা রিসোর্ট ইয়ার্ডে</p>
                </div>
              </div>
              <span className="text-base font-bold text-rose-400">৪৫ কেজি!</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">বাসে রাত জেগে গান গাওয়া</p>
                  <p className="text-xs text-slate-400">পরপর ৩ রাত বিরামহীন</p>
                </div>
              </div>
              <span className="text-base font-bold text-indigo-400">১৮+ ঘন্টা</span>
            </div>
          </div>
        </div>

        {/* Right Card: Most Popular Memory */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-400" />
            <span>সবচেয়ে জনপ্রিয় স্মৃতি 👑</span>
          </h3>

          {memories.length > 0 ? (
            (() => {
              const topMem = [...memories].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
              return (
                <div className="space-y-3">
                  {topMem.imageUrl && (
                    <div className="relative h-48 rounded-xl overflow-hidden">
                      <img
                        src={topMem.imageUrl}
                        alt={topMem.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-3 py-1 bg-rose-500 text-white font-bold text-xs rounded-full shadow-md flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{topMem.likes} Likes</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-base">{topMem.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">{topMem.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                      <span>লেখক: {topMem.authorName}</span>
                      <span>স্থান: {topMem.location}</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-slate-400">এখনো কোনো তথ্য নেই।</p>
          )}
        </div>
      </div>
    </div>
  );
};

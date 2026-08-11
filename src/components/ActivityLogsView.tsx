import React, { useState } from 'react';
import { History, Search, CheckCircle2 } from 'lucide-react';

interface ActivityLog {
  id: string;
  title: string;
  tag: 'AUTH' | 'SYSTEM' | 'NOTICE' | 'GALLERY' | 'CHAT';
  description: string;
  author: string;
  role: string;
  timestamp: string;
}

const INITIAL_LOGS: ActivityLog[] = [];

export const ActivityLogsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const filteredLogs = INITIAL_LOGS.filter((log) => {
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || log.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-5">
      {/* System Activity Logs Header matching Image 5 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-rose-950/60 border border-rose-900/50 flex items-center gap-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-400/20">
          <History className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">System Activity Logs</h1>
          <p className="text-xs text-slate-300 mt-0.5">Real-time audit log of all system events & actions</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search activity logs..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Filter Chips matching Image 5 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'NOTICE', 'GALLERY', 'CHAT'].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              selectedTag === tag
                ? 'bg-slate-700 text-white border-slate-600 shadow-md'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Log Items */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Activity Logs Found</h3>
            <p className="text-xs text-slate-500">
              There are no system activity records logged yet.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-400/40">
                    <CheckCircle2 className="w-5 h-5 fill-cyan-400/30" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{log.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{log.description}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wide shrink-0">
                  {log.tag}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-blue-400 font-medium flex justify-end">
                <span>By {log.author} ({log.role}) • {log.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


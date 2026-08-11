import React from 'react';
import { ViewTab, Memory, Batchmate, TourSpot, ScheduleItem } from '../types';
import { UserSession } from './AuthScreen';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Wifi,
  MapPin,
  Image as ImageIcon,
  Bell,
  Crown,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

import tourBusLogo from '../assets/images/tour_bus_logo_1786427462634.jpg';

interface DashboardViewProps {
  setActiveTab: (tab: ViewTab) => void;
  currentUser: UserSession | null;
  memories: Memory[];
  batchmates: Batchmate[];
  spots: TourSpot[];
  schedule: ScheduleItem[];
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  currentUser,
  memories,
  batchmates,
}) => {
  const registeredCount = batchmates.length || 0;
  const galleryCount = memories.length || 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Hero Banner Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 p-1 border border-indigo-500/40 shadow-lg shrink-0 overflow-hidden">
                <img
                  src={tourBusLogo}
                  alt="Tour Bus Logo"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest border border-indigo-700/60 inline-block mb-1">
                  WELCOME
                </span>
                <h1 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                  Welcome Degree Tour Memories 3.0
                </h1>
              </div>
            </div>

            {/* Role Badge */}
            <div className="shrink-0">
              {currentUser?.role === 'superadmin' && (
                <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-600/30">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  SUPER ADMIN
                </span>
              )}
              {currentUser?.role === 'admin' && (
                <span className="px-3 py-1.5 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                  ADMIN
                </span>
              )}
              {currentUser?.role === 'student' && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  STUDENT
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-indigo-900/60 my-2" />

          {/* Bottom Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-base sm:text-lg border-2 border-indigo-300/40 shadow-md shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Hello, {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role === 'admin' ? 'Admin' : 'Student'} ({currentUser?.name || 'User'})
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  Tap avatar to change photo
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-xs font-semibold text-slate-300 block">Tour Management</span>
              <span className="text-[11px] text-indigo-300 font-bold block">Portal</span>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 8 Metric Grid Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: REGISTERED STUDENTS */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              REGISTERED STUDENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {registeredCount}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: APPROVED STUDENTS */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              APPROVED STUDENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              0
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: PENDING STUDENTS */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              PENDING STUDENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              0
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: REJECTED STUDENTS */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              REJECTED STUDENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              0
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: ONLINE STUDENTS */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              ONLINE STUDENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              0
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        {/* Card 6: CHECK IN COUNT */}
        <div
          onClick={() => setActiveTab('tours')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              CHECK IN COUNT
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              1
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Card 7: GALLERY UPLOADS */}
        <div
          onClick={() => setActiveTab('gallery')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              GALLERY UPLOADS
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {galleryCount}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 8: NOTICE COUNT */}
        <div
          onClick={() => setActiveTab('notices')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              NOTICE COUNT
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              0
            </p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};


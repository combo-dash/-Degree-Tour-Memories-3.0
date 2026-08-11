import React from 'react';
import { ViewTab } from '../types';
import { UserSession } from './AuthScreen';
import {
  Camera,
  MapPin,
  Users,
  Calendar,
  Bus,
  Plus,
  Database,
  Grid,
  BarChart2,
  LogOut,
  GraduationCap,
  Shield,
  Crown
} from 'lucide-react';

import tourBusLogo from '../assets/images/tour_bus_logo_1786427462634.jpg';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  onOpenFirebaseModal: () => void;
  isConnected: boolean;
  activeProjectId: string;
  currentUser: UserSession | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenFirebaseModal,
  isConnected,
  activeProjectId,
  currentUser,
  onSignOut
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white transition-all shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src={tourBusLogo}
                  alt="Tour Bus Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-rose-300 to-emerald-300 bg-clip-text text-transparent tracking-tight">
                  Degree Tour 3.0
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Batch '88
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                স্মৃতি অ্যালবাম ও ট্যুর ডায়েরি • Tour Management System
              </p>
            </div>
          </div>

          {/* Right Controls: User Badge, Firebase Badge, Add Memory */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Logged in User Badge & Sign Out Button */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-indigo-500/30 rounded-xl px-2.5 py-1.5 text-xs">
                {currentUser.role === 'superadmin' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <div className="hidden lg:block font-medium">
                  <span className="text-white">{currentUser.name}</span>
                  <span className={`text-[10px] block capitalize ${currentUser.role === 'superadmin' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign Out to Sign In Screen"
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">সাইন আউট</span>
                </button>
              </div>
            )}

            {/* Firebase Status Badge */}
            <button
              onClick={onOpenFirebaseModal}
              title="Firebase Settings & Project Info"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-all"
            >
              <Database className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden md:inline font-mono">
                {activeProjectId.length > 15 ? `${activeProjectId.substring(0, 12)}...` : activeProjectId}
              </span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            </button>

            {/* Add Memory Modal Trigger */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>স্মৃতি যোগ করুন</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { ViewTab } from '../types';
import { UserSession } from './AuthScreen';
import {
  Bus,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  GraduationCap,
  Lock,
  ShieldCheck,
  Eye,
  LogIn
} from 'lucide-react';

import tourBusLogo from '../assets/images/tour_bus_logo_1786427462634.jpg';

interface SidebarNavProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  currentUser: UserSession | null;
  onSignOut: () => void;
  language: 'EN' | 'BN';
  onOpenAdminLogin?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSignOut,
  language,
  onOpenAdminLogin
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const allMenuItems = [
    {
      id: 'buses' as ViewTab,
      label: language === 'EN' ? 'Buses & Seats' : 'বাস ও সিট প্ল্যান',
      icon: Bus,
      requiresAdmin: false
    },
    {
      id: 'admins' as ViewTab,
      label: language === 'EN' ? 'Admin Panel' : 'এডমিন প্যানেল',
      icon: Shield,
      requiresAdmin: true
    },
    {
      id: 'settings' as ViewTab,
      label: language === 'EN' ? 'Settings' : 'সেটিংস',
      icon: Settings,
      requiresAdmin: true
    }
  ];

  // Hide settings option completely for public viewers (only visible to admin/superadmin)
  const menuItems = allMenuItems.filter((item) => {
    if (item.id === 'settings' && !isAdminOrSuper) {
      return false;
    }
    return true;
  });

  const handleSelectTab = (tab: ViewTab, requiresAdmin: boolean) => {
    if (requiresAdmin && !isAdminOrSuper) {
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      } else {
        setActiveTab(tab);
      }
      setIsMobileOpen(false);
      return;
    }
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 overflow-hidden">
            <img src={tourBusLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Degree Tour 3.0</h1>
            <p className="text-[10px] text-slate-400">
              {isAdminOrSuper ? 'Admin Mode' : 'Public View'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!currentUser && onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Logo Box */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 shadow-md shadow-amber-500/10 shrink-0">
              <img
                src={tourBusLogo}
                alt="Tour Bus Logo"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white truncate leading-tight">
                Degree Tour 3.0
              </h2>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Tour Management System
              </p>
            </div>
          </div>

          {/* User Profile Badge or Public Mode Badge */}
          {currentUser ? (
            <div className="px-3 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : currentUser.role === 'superadmin' ? (
                    <Crown className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Shield className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                  <p className={`text-[10px] font-extrabold uppercase tracking-wide truncate ${currentUser.role === 'superadmin' ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {language === 'EN' ? 'Public Visitor' : 'সাধারণ ভিউয়ার'}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-400">
                    {language === 'EN' ? 'Open View (Read Only)' : 'উন্মুক্ত দর্শন (রিড-অনলি)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.requiresAdmin && !isAdminOrSuper;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id, item.requiresAdmin)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Button (Admin Login if Guest, Logout if Admin) */}
        <div className="pt-3 border-t border-slate-800/80">
          {currentUser ? (
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              <span>{language === 'EN' ? 'Logout' : 'লগআউট'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenAdminLogin) onOpenAdminLogin();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{language === 'EN' ? 'Admin Login' : 'এডমিন লগইন'}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

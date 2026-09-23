import React, { useState } from 'react';
import {
  Shield,
  Crown,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { UserSession } from './AuthScreen';
import { getPublicAdminAvatar } from '../utils/adminAvatars';
import { getAllUsersDirectly } from '../firebase';
import { AppUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (user: UserSession) => void;
  language?: 'EN' | 'BN';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSignInSuccess,
  language = 'BN'
}) => {
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = emailOrId.trim().toLowerCase();
    const passStr = password.trim();

    if (!queryStr || !passStr) {
      setErrorMsg(language === 'EN' ? 'Please fill in all fields' : 'সবগুলো ঘর পূরণ করুন');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // 1. Check Super Admin default
    if (
      (queryStr === 'tanvirtuhin482@gmail.com' ||
        queryStr === 'superadmin' ||
        queryStr === 'tanvir' ||
        queryStr === 'tanvir tuhin' ||
        queryStr === 'tanvirtuhin') &&
      (passStr === 'Tanvirtuhin88' || passStr === 'Tanvir@tuhin-88')
    ) {
      setIsLoading(false);
      const superAdminUser: UserSession = {
        id: 'superadmin-1',
        name: 'Tanvir Tuhin (Super Admin)',
        email: 'tanvirtuhin482@gmail.com',
        role: 'superadmin',
        phone: '01793-439488',
        avatarUrl:
          getPublicAdminAvatar('superadmin', 'tanvirtuhin482@gmail.com', 'Tanvir Tuhin (Super Admin)') ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      };
      onSignInSuccess(superAdminUser);
      onClose();
      return;
    }

    // 2. Check registered admin users created by Super Admin in Firestore & Local Backup
    try {
      const allUsers = await getAllUsersDirectly();

      // Read local custom admins backup
      let localAdmins: any[] = [];
      try {
        localAdmins = JSON.parse(localStorage.getItem('degree_tour_custom_admins') || '[]');
      } catch {}

      // Combine users
      const pool: AppUser[] = [...allUsers];
      for (const la of localAdmins) {
        if (!pool.some((u) => u.id === la.id || (u.email && u.email.toLowerCase() === la.email.toLowerCase()))) {
          pool.push(la);
        }
      }

      const queryDigits = queryStr.replace(/[^0-9]/g, '');

      const matchedAdmin = pool.find((u: AppUser) => {
        if (u.role !== 'admin' && u.role !== 'superadmin') return false;

        const uEmail = String(u.email || '').trim().toLowerCase();
        const uEmailPrefix = uEmail.split('@')[0];
        const uName = String(u.name || '').trim().toLowerCase();
        const uRoll = String(u.rollNo || '').trim().toLowerCase();
        const uId = String(u.id || '').trim().toLowerCase();
        const uPhoneDigits = String(u.phone || '').replace(/[^0-9]/g, '');

        if (uEmail === queryStr) return true;
        if (uEmailPrefix === queryStr) return true;
        if (uName === queryStr) return true;
        if (uRoll === queryStr) return true;
        if (uId === queryStr) return true;
        if (queryDigits.length >= 8 && uPhoneDigits.endsWith(queryDigits.slice(-8))) return true;

        return false;
      });

      if (matchedAdmin) {
        if (matchedAdmin.disabled) {
          setIsLoading(false);
          setErrorMsg(language === 'EN' ? 'This admin account is disabled' : 'এই এডমিন অ্যাকাউন্টটি নিষ্ক্রিয় করা আছে');
          return;
        }

        // Must match the exact password created by Super Admin
        const isPasswordCorrect = String(matchedAdmin.password || '').trim() === passStr;

        if (isPasswordCorrect) {
          setIsLoading(false);
          onSignInSuccess({
            id: matchedAdmin.id,
            name: matchedAdmin.name,
            email: matchedAdmin.email,
            role: matchedAdmin.role as 'admin' | 'superadmin',
            phone: matchedAdmin.phone,
            avatarUrl:
              matchedAdmin.avatarUrl ||
              getPublicAdminAvatar('admin', matchedAdmin.email, matchedAdmin.name)
          });
          onClose();
          return;
        } else {
          setIsLoading(false);
          setErrorMsg(
            language === 'EN'
              ? 'Incorrect admin password! Please enter the correct password.'
              : 'এডমিন পাসওয়ার্ড ভুল হয়েছে! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
          );
          return;
        }
      }
    } catch (err) {
      console.warn('Admin check error:', err);
    }

    setIsLoading(false);
    setErrorMsg(
      language === 'EN'
        ? 'Invalid Admin credentials! Only accounts created by Super Admin can log in.'
        : 'ভুল তথ্য! শুধুমাত্র সুপার এডমিন কর্তৃক অনুমোদিত এডমিন অ্যাকাউন্ট এবং পাসওয়ার্ড দিয়ে লগইন করা যাবে।'
    );
  };

  const handleQuickFillSuper = () => {
    setEmailOrId('tanvirtuhin482@gmail.com');
    setPassword('Tanvirtuhin88');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-amber-500/20 flex items-center justify-center text-white">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {language === 'EN' ? 'Admin Access Login' : 'এডমিন প্যানেল লগইন'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {language === 'EN'
              ? 'Login as Admin or Super Admin to edit buses, assign seats, and manage tour settings.'
              : 'বাস পরিবর্তন, সিট বরাদ্দ এবং সেটিংস এডিট করতে এডমিন বা সুপার এডমিন হিসেবে লগইন করুন।'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              {language === 'EN' ? 'Admin Email / Username' : 'এডমিন ইমেইল বা ইউজারনেম'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="admin@degreetour.com or superadmin"
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 transition-all text-xs"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              {language === 'EN' ? 'Admin Password' : 'এডমিন পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 transition-all text-xs"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>{language === 'EN' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
            ) : (
              <>
                <span>{language === 'EN' ? 'Login as Admin' : 'এডমিন হিসেবে প্রবেশ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Super Admin Quick Access */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{language === 'EN' ? 'Super Admin Quick Fill:' : 'সুপার এডমিন লগইন:'}</span>
            <button
              type="button"
              onClick={handleQuickFillSuper}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin Fill</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            * {language === 'EN'
              ? 'Only admins created by Super Admin can login with their provided credentials.'
              : 'সুপার এডমিন ব্যতীত অন্য যেকোনো এডমিনকে সুপার এডমিন কর্তৃক তৈরি করা আইডি ও পাসওয়ার্ড দিয়ে লগইন করতে হবে।'}
          </p>
        </div>
      </div>
    </div>
  );
};

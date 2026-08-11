import React, { useState } from 'react';
import { RefreshCw, Lock, CloudDownload, LogOut, CheckCircle2, Camera, Upload, User as UserIcon } from 'lucide-react';
import { UserSession } from './AuthScreen';
import { saveAdminAvatar } from '../utils/adminAvatars';

interface SettingsViewProps {
  language: 'EN' | 'BN';
  setLanguage: (lang: 'EN' | 'BN') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenFirebaseModal: () => void;
  currentUser: UserSession | null;
  onLogout?: () => void;
  onUpdateUserAvatar?: (newAvatarUrl: string) => void;
  onUpdateProfile?: (updatedData: Partial<UserSession>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  setLanguage,
  theme,
  setTheme,
  onOpenFirebaseModal,
  currentUser,
  onLogout,
  onUpdateUserAvatar,
  onUpdateProfile
}) => {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [workOffline, setWorkOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState(currentUser?.avatarUrl || '');
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1200);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrlInput(url);
      if (currentUser && isAdminOrSuper) {
        saveAdminAvatar(currentUser.role, url);
        if (currentUser.email) saveAdminAvatar(currentUser.email, url);
        saveAdminAvatar(currentUser.name, url);
      }
      if (onUpdateUserAvatar) {
        onUpdateUserAvatar(url);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      }
    }
  };

  const handleAvatarUrlSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarUrlInput.trim()) {
      if (currentUser && isAdminOrSuper) {
        saveAdminAvatar(currentUser.role, avatarUrlInput.trim());
        if (currentUser.email) saveAdminAvatar(currentUser.email, avatarUrlInput.trim());
        saveAdminAvatar(currentUser.name, avatarUrlInput.trim());
      }
      if (onUpdateUserAvatar) {
        onUpdateUserAvatar(avatarUrlInput.trim());
      }
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    if (onUpdateProfile) {
      onUpdateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        avatarUrl: avatarUrlInput.trim() || currentUser?.avatarUrl
      });
    }
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16">
      {/* SECTION 1: NOTIFICATION CHANNELS */}
      <div className="space-y-2">
        <h2 className="text-xs font-black text-blue-500 uppercase tracking-wider">
          NOTIFICATION CHANNELS
        </h2>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-white">Push Notifications</span>
            <button
              onClick={() => setPushNotifs(!pushNotifs)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                pushNotifs ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* SMS Alerts */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-white">SMS Alerts to Guardians</span>
            <button
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                smsAlerts ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Email Receipts */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-white">Email Receipts & Notices</span>
            <button
              onClick={() => setEmailReceipts(!emailReceipts)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                emailReceipts ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN / SUPER ADMIN PROFILE SETTING & EDIT */}
      {isAdminOrSuper && (
        <div className="space-y-2">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider">
            SUPER ADMIN & ADMIN PROFILE SETTINGS
          </h2>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-white" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{currentUser?.name}</h3>
                <p className="text-xs text-amber-400 font-semibold capitalize">{currentUser?.role}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update your profile info, phone number and profile picture.
                </p>
              </div>
            </div>

            {(avatarSuccess || profileSuccess) && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>প্রোফাইল সফলভাবে আপডেট করা হয়েছে!</span>
              </div>
            )}

            {/* Profile Info Update Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  এডমিনের নাম (Full Name)
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="আপনার নাম"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  মোবাইল নম্বর (Phone Number)
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="01700-000000"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  প্রোফাইল ছবি (Upload Image File or URL)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    placeholder="অথবাছবির সরাসরি URL পেস্ট করুন"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  প্রোফাইল আপডেট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 2: OFFLINE PERSISTENCE & CLOUD SYNC */}
      <div className="space-y-2">
        <h2 className="text-xs font-black text-blue-500 uppercase tracking-wider">
          OFFLINE PERSISTENCE & CLOUD SYNC
        </h2>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-lg">
          {/* Offline Persistence Item */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Offline Persistence (Room DB)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All user data & edits saved in SQLite database
              </p>
            </div>
          </div>

          {/* Work Offline Switch */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Work Offline Switch</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Force offline mode to verify Room persistence
              </p>
            </div>

            <button
              onClick={() => setWorkOffline(!workOffline)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                workOffline ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Cloud Sync Status */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Cloud Sync Status</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last synced: Today at 11:24 PM
              </p>
            </div>

            <button
              onClick={handleSync}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: SECURITY & SUPPORT */}
      <div className="space-y-2">
        <h2 className="text-xs font-black text-blue-500 uppercase tracking-wider">
          SECURITY & SUPPORT
        </h2>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
          <button
            onClick={() => {}}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>Change Account Password</span>
          </button>

          <button
            onClick={onOpenFirebaseModal}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Backup Online Database</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};


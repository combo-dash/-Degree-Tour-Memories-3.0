import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Key,
  Layers,
  AlertTriangle,
  Zap,
  Trash2
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  seedInitialFirestoreData,
  isConnectedToFirestore
} from '../firebase';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSettingsModal: React.FC<FirebaseSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const currentConfig = getActiveFirebaseConfig();
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState(
    currentConfig?.firestoreDatabaseId || ''
  );
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSeedData = async () => {
    if (!window.confirm('Are you absolutely sure? This will PERMANENTLY delete 100% of the data including all payments, memories, and users!')) return;
    
    setSeedingStatus('seeding');
    const success = await seedInitialFirestoreData();
    if (success) {
      setSeedingStatus('success');
      setTimeout(() => {
        setSeedingStatus(null);
        window.location.reload();
      }, 2000);
    } else {
      setSeedingStatus('error');
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const configObj = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      firestoreDatabaseId: firestoreDatabaseId.trim(),
      storageBucket: storageBucket.trim(),
      appId: appId.trim()
    };

    saveCustomFirebaseConfig(configObj);
  };

  const handleResetToDefault = () => {
    saveCustomFirebaseConfig(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Firebase Realtime Sync Settings</h3>
            <p className="text-xs text-slate-400">
              Degree Tour 3.0 ডাটাবেজ সংযোগ স্ট্যাটাস ও কনফিগারেশন
            </p>
          </div>
        </div>

        {/* Current Active Connection Status */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isConnectedToFirestore ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <strong className="text-sm text-white">
                {isConnectedToFirestore ? 'Firebase Firestore সক্রিয়' : 'অফলাইন মোড'}
              </strong>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-slate-700">
              Project: {currentConfig?.projectId}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            স্মৃতি, লাইক, কমেন্ট ও ব্যাচমেট ডাটা রিয়েলটাইমে ফায়ারবেস ফায়ারস্টোর ডাটাবেজে সংরক্ষিত হচ্ছে।
          </p>
        </div>

        {/* 1-Click Clear Database Button */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>সব ডেমো ডাটা সম্পূর্ণ পরিষ্কার করুন (Reset Database)</span>
              </h4>
              <p className="text-[11px] text-slate-300">
                ডাটাবেজ ও গ্যালারী থেকে পুরাতন সব ডেমো ডাটা ও স্মৃতি মুছে ফেলুন।
              </p>
            </div>
            
            <button
              onClick={handleSeedData}
              disabled={seedingStatus === 'seeding'}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
            >
              {seedingStatus === 'seeding' ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> মুছা হচ্ছে...
                </span>
              ) : seedingStatus === 'success' ? (
                <span className="flex items-center gap-1 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> মুছে ফেলা হয়েছে!
                </span>
              ) : (
                '১-ক্লিকে ডাটা রিসেট'
              )}
            </button>
          </div>
        </div>

        {/* Custom Project Form Toggle */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              কাস্টম ফায়ারবেস প্রজেক্ট কনফিগারেশন (degreetourmemories88)
            </span>
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-amber-400 underline font-semibold cursor-pointer"
            >
              {isCustomMode ? 'ফর্ম লুকান' : 'প্রজেক্ট আইডি পরিবর্তন'}
            </button>
          </div>

          {isCustomMode && (
            <form onSubmit={handleSaveCustom} className="space-y-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
                আপনার নিজস্ব Firebase Project Credentials (যেমন degreetourmemories88) এখানে লিখে সংরক্ষণ করতে পারেন:
              </div>

              <div>
                <label className="text-slate-300 font-semibold">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="degreetourmemories88"
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Auth Domain</label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="degreetourmemories88.firebaseapp.com"
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs text-rose-400 hover:underline"
                >
                  ডিফল্ট প্রজেক্টে ফিরুন
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
                >
                  সংরক্ষণ ও রিলোড
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ViewTab, Batchmate, BusPackage } from './types';
import { AuthScreen, UserSession } from './components/AuthScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SidebarNav } from './components/SidebarNav';
import { BusesView } from './components/BusesView';
import { AdminsView } from './components/AdminsView';
import { SettingsView } from './components/SettingsView';
import { FirebaseSettingsModal } from './components/FirebaseSettingsModal';
import {
  subscribeBatchmates,
  subscribeBuses,
  addBatchmateToFirestore,
  updateBatchmateInFirestore,
  getActiveFirebaseConfig,
  updateUserInFirestore
} from './firebase';
import { INITIAL_BATCHMATES, INITIAL_BUSES } from './data/initialData';
import { saveAdminAvatar } from './utils/adminAvatars';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('degree_tour_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('degree_tour_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        if (currentUser.avatarUrl) {
          saveAdminAvatar(currentUser.role, currentUser.avatarUrl);
          if (currentUser.email) saveAdminAvatar(currentUser.email, currentUser.avatarUrl);
          saveAdminAvatar(currentUser.name, currentUser.avatarUrl);
        }
      }
    } else {
      localStorage.removeItem('degree_tour_current_user');
    }
  }, [currentUser]);
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [activeTab, setActiveTab] = useState<ViewTab>('buses');
  const [batchmates, setBatchmates] = useState<Batchmate[]>(INITIAL_BATCHMATES);
  const [buses, setBuses] = useState<BusPackage[]>(INITIAL_BUSES);

  // Modals
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Realtime Firestore Subscriptions
  useEffect(() => {
    const unsubBm = subscribeBatchmates((data) => {
      if (data) setBatchmates(data);
    });

    const unsubBuses = subscribeBuses((data) => {
      if (data) setBuses(data);
    });

    return () => {
      unsubBm();
      unsubBuses();
    };
  }, []);

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // If user is not admin/superadmin, ensure they cannot stay on or view 'settings'
  useEffect(() => {
    if (activeTab === 'settings' && !isAdminOrSuper) {
      setActiveTab('buses');
    }
  }, [activeTab, isAdminOrSuper]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('degree_tour_current_user');
    setActiveTab('buses');
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col lg:flex-row ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSignOut={handleLogout}
        language={language}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {activeTab === 'buses' && (
            <BusesView
              currentUser={currentUser}
              batchmates={batchmates}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            />
          )}

          {activeTab === 'admins' && (
            <AdminsView
              currentUser={currentUser}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && isAdminOrSuper && (
            <SettingsView
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              onUpdateUserAvatar={async (newAvatarUrl) => {
                if (currentUser) {
                  const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
                  setCurrentUser(updatedUser);
                  if (currentUser.id) {
                    await updateUserInFirestore(currentUser.id, { avatarUrl: newAvatarUrl });
                  }
                }
              }}
              onUpdateProfile={async (updatedData) => {
                if (currentUser) {
                  const updatedUser = { ...currentUser, ...updatedData };
                  setCurrentUser(updatedUser);
                  if (currentUser.id) {
                    await updateUserInFirestore(currentUser.id, updatedData);
                    // Also update in batchmates collection if this user is a batchmate
                    const batchmate = batchmates.find(b => b.rollNo === currentUser.rollNo);
                    if (batchmate) {
                      await updateBatchmateInFirestore(batchmate.id, {
                        name: updatedData.name !== undefined ? updatedData.name : batchmate.name,
                        phone: updatedData.phone !== undefined ? updatedData.phone : batchmate.phone
                      });
                    }
                  }
                }
              }}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-bold text-slate-400">
              Degree Tour 3.0 • Tour Management System
            </p>
            <p>
              Powered by Firebase Firestore Realtime Sync • Batch '88
            </p>
          </div>
        </footer>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSignInSuccess={(user) => {
          setCurrentUser(user);
        }}
        language={language}
      />

      {/* Firebase Settings Modal */}
      <FirebaseSettingsModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}



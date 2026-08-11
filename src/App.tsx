import React, { useState, useEffect } from 'react';
import { ViewTab, Memory, Batchmate, TourSpot, ScheduleItem, Comment } from './types';
import { AuthScreen, UserSession } from './components/AuthScreen';
import { SidebarNav } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { PaymentView } from './components/PaymentView';
import { BusesView } from './components/BusesView';
import { NoticesView } from './components/NoticesView';
import { ChatView } from './components/ChatView';
import { AdminsView } from './components/AdminsView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { SettingsView } from './components/SettingsView';
import { MemoryFeed } from './components/MemoryFeed';
import { PhotoGallery } from './components/PhotoGallery';
import { InteractiveMap } from './components/InteractiveMap';
import { BatchmateDirectory } from './components/BatchmateDirectory';
import { TourItinerary } from './components/TourItinerary';
import { ToursView } from './components/ToursView';
import { AddMemoryModal } from './components/AddMemoryModal';
import { FirebaseSettingsModal } from './components/FirebaseSettingsModal';
import {
  subscribeMemories,
  subscribeBatchmates,
  subscribeTourSpots,
  subscribeSchedule,
  addMemoryToFirestore,
  deleteMemoryFromFirestore,
  clearAllMemoriesFromFirestore,
  likeMemoryInFirestore,
  addCommentToFirestore,
  addBatchmateToFirestore,
  getActiveFirebaseConfig,
  isConnectedToFirestore
} from './firebase';
import { INITIAL_MEMORIES, INITIAL_BATCHMATES, INITIAL_TOUR_SPOTS, INITIAL_SCHEDULE } from './data/initialData';
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

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [batchmates, setBatchmates] = useState<Batchmate[]>(INITIAL_BATCHMATES);
  const [spots, setSpots] = useState<TourSpot[]>(INITIAL_TOUR_SPOTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const config = getActiveFirebaseConfig();
  const activeProjectId = config?.projectId || 'degreetourmemories88';

  // Realtime Firestore Subscriptions
  useEffect(() => {
    const unsubMem = subscribeMemories((data) => {
      if (data) setMemories(data);
    });

    const unsubBm = subscribeBatchmates((data) => {
      if (data) setBatchmates(data);
    });

    const unsubSpots = subscribeTourSpots((data) => {
      if (data) setSpots(data);
    });

    const unsubSch = subscribeSchedule((data) => {
      if (data) setSchedule(data);
    });

    return () => {
      unsubMem();
      unsubBm();
      unsubSpots();
      unsubSch();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('degree_tour_current_user');
  };

  // Handlers
  const handleLike = async (memoryId: string, currentLikes: number) => {
    // Optimistic local update
    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, likes: (m.likes || 0) + 1 } : m))
    );
    await likeMemoryInFirestore(memoryId, currentLikes);
  };

  const handleAddComment = async (memoryId: string, comment: Comment) => {
    // Optimistic local update
    setMemories((prev) =>
      prev.map((m) =>
        m.id === memoryId ? { ...m, comments: [...(m.comments || []), comment] } : m
      )
    );
    await addCommentToFirestore(memoryId, comment);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    await deleteMemoryFromFirestore(memoryId);
  };

  const handleClearAllMemories = async () => {
    setMemories([]);
    await clearAllMemoriesFromFirestore();
  };

  const handleAddMemory = async (
    newMemData: Omit<Memory, 'id' | 'likes' | 'timestamp' | 'comments'>
  ) => {
    try {
      const newDocId = await addMemoryToFirestore(newMemData);
      
      // Add locally to immediate view
      const newMemoryObj: Memory = {
        ...newMemData,
        id: newDocId || 'mem-' + Date.now(),
        likes: 0,
        timestamp: Date.now(),
        comments: []
      };

      setMemories((prev) => [newMemoryObj, ...prev]);
      setIsAddModalOpen(false);
      setActiveTab('gallery');
    } catch (err) {
      console.error('Failed to add memory:', err);
      setIsAddModalOpen(false);
      setActiveTab('gallery');
    }
  };

  const handleAddBatchmate = async (newBm: Omit<Batchmate, 'id'>) => {
    const newId = await addBatchmateToFirestore(newBm);
    setBatchmates((prev) => [...prev, { ...newBm, id: newId }]);
  };

  // If no user is logged in, show AuthScreen as the FIRST INTERFACE
  if (!currentUser) {
    return (
      <AuthScreen
        onSignInSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
          if (user.role === 'student') {
            const exists = batchmates.some(
              (b) => b.rollNo === user.rollNo || b.name.toLowerCase() === user.name.toLowerCase()
            );
            if (!exists) {
              addBatchmateToFirestore({
                name: user.name,
                nickName: user.name.split(' ')[0] || user.name,
                rollNo: user.rollNo || 'DEG-88-' + Math.floor(100 + Math.random() * 900),
                section: user.degreeType?.includes('B') ? 'B' : 'A',
                quote: 'Degree Tour 3.0 memories forever!',
                photoUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                favoriteMemory: 'Degree Tour 3.0',
                phone: user.phone || '01700-000000',
                awards: ['ট্যুর ফেলো 🌟']
              }).catch((err) => console.warn('Failed to register student in directory:', err));
            }
          }
        }}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col lg:flex-row ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSignOut={() => setCurrentUser(null)}
        language={language}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              memories={memories}
              batchmates={batchmates}
              spots={spots}
              schedule={schedule}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentView currentUser={currentUser} />
          )}

          {activeTab === 'students' && (
            <BatchmateDirectory
              batchmates={batchmates}
              onAddBatchmate={handleAddBatchmate}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'tours' && (
            <div className="space-y-8">
              <ToursView currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'buses' && (
            <BusesView currentUser={currentUser} batchmates={batchmates} />
          )}

          {activeTab === 'notices' && (
            <NoticesView currentUser={currentUser} />
          )}

          {activeTab === 'gallery' && (
            <PhotoGallery
              memories={memories}
              onLike={handleLike}
              onAddMemoryClick={() => setIsAddModalOpen(true)}
              currentUser={currentUser}
              onDeleteMemory={handleDeleteMemory}
              onClearAllMemories={handleClearAllMemories}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView currentUser={currentUser} />
          )}

          {activeTab === 'admins' && (
            <AdminsView currentUser={currentUser} />
          )}

          {activeTab === 'activityLogs' && (
            <ActivityLogsView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpdateUserAvatar={(newAvatarUrl) => {
                if (currentUser) {
                  setCurrentUser({ ...currentUser, avatarUrl: newAvatarUrl });
                }
              }}
              onUpdateProfile={(updatedData) => {
                if (currentUser) {
                  setCurrentUser({ ...currentUser, ...updatedData });
                }
              }}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-bold text-slate-400">
              Degree Tour 3.0 • Tour Management System & Digital Memory Wall
            </p>
            <p>
              Powered by Firebase Firestore Realtime Sync • Batch '88
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMemory}
        currentUser={currentUser}
      />

      <FirebaseSettingsModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}



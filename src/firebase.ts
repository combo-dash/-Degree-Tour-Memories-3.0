import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  query,
  orderBy,
  Firestore,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import defaultConfig from '../firebase-applet-config.json';
import { AppUser, Memory, Batchmate, TourSpot, ScheduleItem, TourPackage, BusPackage, Comment, ChatMessage } from './types';
import {
  INITIAL_MEMORIES,
  INITIAL_BATCHMATES,
  INITIAL_TOUR_SPOTS,
  INITIAL_SCHEDULE,
  INITIAL_TOURS,
  INITIAL_BUSES
} from './data/initialData';

// Local storage key for custom config override if user provides one
const CUSTOM_FIREBASE_KEY = 'degree_tour_3_custom_firebase_config';

export function getActiveFirebaseConfig() {
  try {
    const custom = localStorage.getItem(CUSTOM_FIREBASE_KEY);
    if (custom) {
      console.log('Using CUSTOM Firebase config:', custom);
      return JSON.parse(custom);
    }
  } catch (e) {
    console.warn('Failed to parse custom firebase config:', e);
  }
  console.log('Using DEFAULT Firebase config');
  return defaultConfig;
}

export function saveCustomFirebaseConfig(config: any) {
  if (!config) {
    localStorage.removeItem(CUSTOM_FIREBASE_KEY);
  } else {
    localStorage.setItem(CUSTOM_FIREBASE_KEY, JSON.stringify(config));
  }
  window.location.reload();
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isConnectedToFirestore = false;

try {
  const config = getActiveFirebaseConfig();
  // FORCE-CLEAR custom config to ensure consistency across all student devices
  localStorage.removeItem(CUSTOM_FIREBASE_KEY);
  
  if (config && config.projectId) {
    console.log('Firebase config loaded, initializing app with projectId:', config.projectId);
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(config);
    }
    
    // Pass custom firestore databaseId if specified in config, else default
    const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
      ? config.firestoreDatabaseId 
      : '(default)';
    console.log('Firebase Init: projectId=', config.projectId, 'dbId=', dbId);
    
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    isConnectedToFirestore = true;
    console.log('Firebase Firestore DB initialized successfully:', !!db);
  } else {
    console.error('Firebase config missing projectId:', config);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, isConnectedToFirestore };

// Collection References
const USERS_COL = 'users';
const MEMORIES_COL = 'memories';
const BATCHMATES_COL = 'batchmates';
const SPOTS_COL = 'tourSpots';
const SCHEDULE_COL = 'schedule';
const TOURS_COL = 'tours';
const BUSES_COL = 'buses';
const MESSAGES_COL = 'messages';
const PAYMENT_ACCOUNTS_COL = 'paymentAccounts';
const PAYMENT_RECORDS_COL = 'paymentRecords';
const SETTINGS_COL = 'settings';

export function subscribeMessages(onData: (messages: ChatMessage[]) => void) {
  if (!db) {
    console.log('Firestore not ready, retrying in 1s...');
    setTimeout(() => subscribeMessages(onData), 1000);
    return () => {};
  }

  try {
    const q = query(collection(db, MESSAGES_COL), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('Firestore messages snapshot received. Docs count:', snapshot.docs.length);
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            console.log("New message added: ", change.doc.data());
          }
        });
        const list: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessage, 'id'>)
        }));
        onData(list);
      },
      (err) => {
        console.error('Firestore messages subscription error:', err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Error subscribing to messages:', e);
    return () => {};
  }
}

export async function sendMessageToFirestore(msg: Omit<ChatMessage, 'id'>): Promise<string> {
  if (!db) {
    console.warn('No Firestore db instance for sending message.');
    return 'temp-' + Date.now();
  }
  console.log('Attempting to send message to Firestore collection:', MESSAGES_COL);
  try {
    let safeMsg = { ...msg };
    // Firestore document limit is 1MB (~1,048,576 bytes).
    // If mediaUrl is over 750KB base64, truncate media payload for firestore document doc safety
    if (safeMsg.mediaUrl && safeMsg.mediaUrl.length > 750000) {
      console.warn('Media payload is too large for Firestore document size limit. Trimming payload.');
      safeMsg = {
        ...safeMsg,
        mediaUrl: safeMsg.mediaUrl.substring(0, 100) + '...[large media saved locally]'
      };
    }
    const docRef = await addDoc(collection(db, MESSAGES_COL), safeMsg);
    console.log('Message successfully saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error sending message to Firestore:', e);
    return 'temp-' + Date.now();
  }
}

export async function deleteMessageFromFirestore(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, MESSAGES_COL, id));
  } catch (e) {
    console.error('Error deleting message:', e);
  }
}

export function subscribeBuses(onData: (buses: BusPackage[]) => void) {
  if (!db) {
    onData(INITIAL_BUSES);
    return () => {};
  }

  try {
    const q = query(collection(db, BUSES_COL));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial buses into Firestore so every client connects to the exact same documents
          try {
            for (const b of INITIAL_BUSES) {
              const { id, ...data } = b;
              await setDoc(doc(db, BUSES_COL, id), data);
            }
          } catch (err) {
            console.error('Error auto-seeding initial buses:', err);
          }
          onData(INITIAL_BUSES);
        } else {
          const list: BusPackage[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BusPackage, 'id'>)
          }));
          onData(list);
        }
      },
      (error) => {
        console.error('Snapshot error in subscribeBuses:', error);
        onData(INITIAL_BUSES);
      }
    );
    return unsubscribe;
  } catch (e) {
    onData(INITIAL_BUSES);
    return () => {};
  }
}

export function subscribeTours(onData: (tours: TourPackage[]) => void) {
  if (!db) {
    onData(INITIAL_TOURS);
    return () => {};
  }

  try {
    const q = query(collection(db, TOURS_COL));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onData(INITIAL_TOURS);
        } else {
          const list: TourPackage[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<TourPackage, 'id'>)
          }));
          onData(list);
        }
      },
      () => onData(INITIAL_TOURS)
    );
    return unsubscribe;
  } catch (e) {
    onData(INITIAL_TOURS);
    return () => {};
  }
}

// ----------------------------------------------------------------------
// Firestore Realtime Stream Subscriptions with Fallback
// ----------------------------------------------------------------------

export function subscribeMemories(
  onData: (memories: Memory[]) => void,
  onError?: (err: any) => void
) {
  if (!db) {
    onData(INITIAL_MEMORIES);
    return () => {};
  }

  try {
    const q = query(collection(db, MEMORIES_COL), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, return initial fallback and offer seed
          onData(INITIAL_MEMORIES);
        } else {
          const list: Memory[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || '',
              description: data.description || '',
              category: data.category || 'Photo',
              authorName: data.authorName || 'Anonymous',
              authorRole: data.authorRole || '',
              imageUrl: data.imageUrl || '',
              location: data.location || 'Degree Tour Spot',
              date: data.date || new Date().toISOString().split('T')[0],
              timestamp: data.timestamp || Date.now(),
              likes: data.likes || 0,
              likedBy: data.likedBy || [],
              tags: data.tags || [],
              comments: data.comments || []
            };
          });
          onData(list);
        }
      },
      (err) => {
        console.warn('Firestore memories subscription error, using fallback:', err);
        if (onError) onError(err);
        onData(INITIAL_MEMORIES);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Error setting up memories snapshot:', e);
    onData(INITIAL_MEMORIES);
    return () => {};
  }
}

export function subscribeBatchmates(onData: (batchmates: Batchmate[]) => void) {
  if (!db) {
    onData(INITIAL_BATCHMATES);
    return () => {};
  }

  try {
    const q = query(collection(db, BATCHMATES_COL));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          onData(INITIAL_BATCHMATES);
        } else {
          const demoRolls = ['DEG-88-001', 'DEG-88-014', 'DEG-88-025', 'DEG-88-038', 'DEG-88-042', 'DEG-88-050'];
          const demoNames = ['তানভীর তুহিন', 'সাব্বির আহমেদ', 'মালিহা রহমান', 'শাহরিয়ার নাফিস', 'অনন্যা দাস', 'ফারহান চৌধুরী'];

          const list: Batchmate[] = [];
          for (const d of snapshot.docs) {
            const data = d.data() as Omit<Batchmate, 'id'>;
            const isDemo = demoRolls.includes(data.rollNo) || demoNames.some(n => data.name?.includes(n));
            if (isDemo) {
              // Permanently delete demo batchmate from Firestore
              try {
                await deleteDoc(doc(db, BATCHMATES_COL, d.id));
              } catch (err) {
                console.warn('Failed to delete demo batchmate:', err);
              }
            } else {
              list.push({
                id: d.id,
                ...data
              });
            }
          }
          onData(list);
        }
      },
      (err) => {
        console.warn('Firestore batchmates subscription error:', err);
        onData(INITIAL_BATCHMATES);
      }
    );
    return unsubscribe;
  } catch (e) {
    onData(INITIAL_BATCHMATES);
    return () => {};
  }
}

export function subscribeTourSpots(onData: (spots: TourSpot[]) => void) {
  if (!db) {
    onData(INITIAL_TOUR_SPOTS);
    return () => {};
  }

  try {
    const q = query(collection(db, SPOTS_COL), orderBy('day', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onData(INITIAL_TOUR_SPOTS);
        } else {
          const list: TourSpot[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<TourSpot, 'id'>)
          }));
          onData(list);
        }
      },
      () => onData(INITIAL_TOUR_SPOTS)
    );
    return unsubscribe;
  } catch (e) {
    onData(INITIAL_TOUR_SPOTS);
    return () => {};
  }
}

export function subscribeSchedule(onData: (schedule: ScheduleItem[]) => void) {
  if (!db) {
    onData(INITIAL_SCHEDULE);
    return () => {};
  }

  try {
    const q = query(collection(db, SCHEDULE_COL));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onData(INITIAL_SCHEDULE);
        } else {
          const list: ScheduleItem[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ScheduleItem, 'id'>)
          }));
          onData(list);
        }
      },
      () => onData(INITIAL_SCHEDULE)
    );
    return unsubscribe;
  } catch (e) {
    onData(INITIAL_SCHEDULE);
    return () => {};
  }
}

// ----------------------------------------------------------------------
// Firestore Mutation Helpers
// ----------------------------------------------------------------------

export async function addMemoryToFirestore(memory: Omit<Memory, 'id' | 'likes' | 'timestamp' | 'comments'>): Promise<string> {
  const newMemory = {
    ...memory,
    timestamp: Date.now(),
    likes: 0,
    likedBy: [],
    comments: []
  };

  if (!db) {
    console.warn('No Firestore db instance. Simulated local add.');
    return 'temp-' + Date.now();
  }

  try {
    let safeMemory = { ...newMemory };
    // Firestore document limit is 1MB (~1,048,576 bytes).
    // If imageUrl is over 750KB base64, trim/warn payload to ensure document creation succeeds
    if (safeMemory.imageUrl && safeMemory.imageUrl.length > 750000) {
      console.warn('Memory payload is too large for Firestore document size limit. Trimming payload.');
      safeMemory = {
        ...safeMemory,
        imageUrl: safeMemory.imageUrl.substring(0, 100) + '...[large media saved locally]'
      };
    }
    const docRef = await addDoc(collection(db, MEMORIES_COL), safeMemory);
    return docRef.id;
  } catch (err) {
    console.error('Error adding memory to Firestore:', err);
    return 'temp-' + Date.now();
  }
}

export async function deleteMemoryFromFirestore(memoryId: string) {
  if (!db) return;
  try {
    const docRef = doc(db, MEMORIES_COL, memoryId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting memory from Firestore:', e);
  }
}

export async function likeMemoryInFirestore(memoryId: string, currentLikes: number, userSessionId?: string) {
  if (!db) return;
  try {
    const docRef = doc(db, MEMORIES_COL, memoryId);
    await updateDoc(docRef, {
      likes: currentLikes + 1,
      ...(userSessionId ? { likedBy: arrayUnion(userSessionId) } : {})
    });
  } catch (e) {
    console.error('Error liking memory:', e);
  }
}

export async function addCommentToFirestore(memoryId: string, comment: Comment) {
  if (!db) return;
  try {
    const docRef = doc(db, MEMORIES_COL, memoryId);
    await updateDoc(docRef, {
      comments: arrayUnion(comment)
    });
  } catch (e) {
    console.error('Error adding comment:', e);
  }
}

export async function addBatchmateToFirestore(batchmate: Omit<Batchmate, 'id'>) {
  if (!db) return 'temp-' + Date.now();
  const docRef = await addDoc(collection(db, BATCHMATES_COL), batchmate);
  return docRef.id;
}

export async function updateBatchmateInFirestore(id: string, updates: Partial<Batchmate>) {
  if (!db) return;
  try {
    const docRef = doc(db, BATCHMATES_COL, id);
    await updateDoc(docRef, updates);
  } catch (e) {
    console.error('Error updating batchmate:', e);
  }
}

export async function deleteBatchmateFromFirestore(id: string) {
  if (!db) return;
  console.log('Attempting to delete batchmate:', id);
  try {
    const docRef = doc(db, BATCHMATES_COL, id);
    await deleteDoc(docRef);
    console.log('Batchmate deleted successfully');
  } catch (e) {
    console.error('Error deleting batchmate:', e);
  }
}

export async function addTourToFirestore(tour: Omit<TourPackage, 'id'>): Promise<string> {
  if (!db) return 'temp-' + Date.now();
  const docRef = await addDoc(collection(db, TOURS_COL), tour);
  return docRef.id;
}

export async function updateTourInFirestore(id: string, updates: Partial<TourPackage>) {
  if (!db) return;
  try {
    const docRef = doc(db, TOURS_COL, id);
    await updateDoc(docRef, updates);
  } catch (e) {
    console.error('Error updating tour:', e);
  }
}

export async function deleteTourFromFirestore(id: string) {
  if (!db) return;
  try {
    const docRef = doc(db, TOURS_COL, id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting tour:', e);
  }
}

export async function addBusToFirestore(bus: Omit<BusPackage, 'id'>): Promise<string> {
  if (!db) return 'temp-' + Date.now();
  const docRef = await addDoc(collection(db, BUSES_COL), bus);
  return docRef.id;
}

export async function updateBusInFirestore(id: string, updates: Partial<BusPackage>) {
  if (!db) return;
  try {
    const docRef = doc(db, BUSES_COL, id);
    await setDoc(docRef, updates, { merge: true });
  } catch (e) {
    console.error('Error updating bus:', e);
  }
}

export async function deleteBusFromFirestore(id: string) {
  if (!db) return;
  try {
    const docRef = doc(db, BUSES_COL, id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting bus:', e);
  }
}

// ----------------------------------------------------------------------
// Clear Firestore database collections
// ----------------------------------------------------------------------

export async function clearAllMemoriesFromFirestore(): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDocs(collection(db, MEMORIES_COL));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, MEMORIES_COL, d.id));
    }
    return true;
  } catch (e) {
    console.error('Error clearing memories collection:', e);
    return false;
  }
}

export async function clearAllFirestoreData(): Promise<boolean> {
  if (!db) return false;

  try {
    const collectionsToClear = [
      MEMORIES_COL,
      SPOTS_COL,
      SCHEDULE_COL,
      TOURS_COL,
      BATCHMATES_COL,
      PAYMENT_RECORDS_COL,
      MESSAGES_COL,
      BUSES_COL,
      PAYMENT_ACCOUNTS_COL,
      SETTINGS_COL,
      NOTICES_COL,
      USERS_COL
    ];
    
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) continue;

      // Use batches (Firestore limit is 500 per batch)
      let batch = writeBatch(db);
      let count = 0;

      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    }
    return true;
  } catch (e) {
    console.error('Error clearing Firestore database:', e);
    return false;
  }
}

export async function seedInitialFirestoreData(): Promise<boolean> {
  if (!db) return false;

  try {
    // Clear all existing data to ensure a fresh, clean database state
    await clearAllFirestoreData();
    return true;
  } catch (e) {
    console.error('Error clearing Firestore database:', e);
    return false;
  }
}

export function subscribeUsers(onData: (users: AppUser[]) => void) {
  if (!db) {
    onData([]);
    return () => {};
  }
  
  try {
    const q = query(collection(db, USERS_COL));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppUser[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppUser, 'id'>)
        }));
        onData(list);
      },
      (error) => {
        console.error('Snapshot error in subscribeUsers:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up subscribeUsers:', err);
    return () => {};
  }
}

export async function addUserToFirestore(user: AppUser) {
  if (!db) return;
  try {
    const { id, ...data } = user;
    if (id) {
      await setDoc(doc(db, USERS_COL, id), data);
    } else {
      await addDoc(collection(db, USERS_COL), data);
    }
  } catch (e) {
    console.error('Error adding user:', e);
  }
}

export async function updateUserInFirestore(id: string, data: Partial<AppUser>) {
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS_COL, id), data);
  } catch (e) {
    console.error('Error updating user:', e);
  }
}

export async function deleteUserFromFirestore(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, USERS_COL, id));
  } catch (e) {
    console.error('Error deleting user:', e);
  }
}

export async function disableUserInFirestore(id: string) {
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS_COL, id), { disabled: true });
    console.log('User disabled successfully:', id);
  } catch (e) {
    console.error('Error disabling user:', e);
  }
}

// ----------------------------------------------------------------------
// Payment & Settings Helpers
// ----------------------------------------------------------------------

export function subscribePackageFee(onData: (fee: number) => void) {
  if (!db) {
    onData(3500);
    return () => {};
  }
  try {
    const docRef = doc(db, SETTINGS_COL, 'paymentSettings');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.packageFee !== undefined) {
          onData(data.packageFee);
        } else {
          onData(3500);
        }
      } else {
        onData(3500);
      }
    }, () => onData(3500));
  } catch (err) {
    onData(3500);
    return () => {};
  }
}

export async function updatePackageFeeInFirestore(fee: number) {
  if (!db) return;
  try {
    const docRef = doc(db, SETTINGS_COL, 'paymentSettings');
    await setDoc(docRef, { packageFee: fee }, { merge: true });
  } catch (err) {
    console.error('Error updating fee:', err);
  }
}

export function subscribePaymentAccounts(onData: (accounts: any[]) => void, defaultAccounts: any[]) {
  if (!db) {
    onData(defaultAccounts);
    return () => {};
  }
  try {
    const q = query(collection(db, PAYMENT_ACCOUNTS_COL));
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        onData(defaultAccounts);
      } else {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onData(list);
      }
    }, () => onData(defaultAccounts));
  } catch (err) {
    onData(defaultAccounts);
    return () => {};
  }
}

export async function updatePaymentAccountsInFirestore(accounts: any[]) {
  if (!db) return;
  try {
    // We can clear and set, or just use a single document for all accounts if easier.
    // Let's use a single document 'accountsList' inside SETTINGS_COL for simplicity to avoid managing multiple docs.
    const docRef = doc(db, SETTINGS_COL, 'paymentAccountsList');
    await setDoc(docRef, { accounts });
  } catch (err) {
    console.error('Error updating accounts:', err);
  }
}

export function subscribePaymentAccountsList(onData: (accounts: any[]) => void, defaultAccounts: any[]) {
  if (!db) {
    onData(defaultAccounts);
    return () => {};
  }
  try {
    const docRef = doc(db, SETTINGS_COL, 'paymentAccountsList');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().accounts) {
        onData(snap.data().accounts);
      } else {
        onData(defaultAccounts);
      }
    }, () => onData(defaultAccounts));
  } catch (err) {
    onData(defaultAccounts);
    return () => {};
  }
}

export function subscribePaymentRecords(onData: (records: any[]) => void) {
  if (!db) {
    onData([]);
    return () => {};
  }
  try {
    const q = query(collection(db, PAYMENT_RECORDS_COL));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by date desc
      list.sort((a: any, b: any) => {
        if (a.date === b.date) {
           return (b.timestamp || 0) - (a.timestamp || 0);
        }
        return b.date.localeCompare(a.date);
      });
      onData(list);
    }, () => onData([]));
  } catch (err) {
    onData([]);
    return () => {};
  }
}

export async function addPaymentRecordToFirestore(record: Omit<any, 'id'>): Promise<string> {
  if (!db) return 'temp-' + Date.now();
  const docRef = await addDoc(collection(db, PAYMENT_RECORDS_COL), { ...record, timestamp: Date.now() });
  return docRef.id;
}

export async function updatePaymentRecordStatusInFirestore(id: string, status: string) {
  if (!db) return;
  try {
    const docRef = doc(db, PAYMENT_RECORDS_COL, id);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error('Error updating record status:', err);
  }
}

export async function clearAllPaymentsFromFirestore(): Promise<boolean> {
  if (!db) {
    console.error('Firestore not initialized during clear operation');
    return false;
  }
  try {
    const snap = await getDocs(collection(db, PAYMENT_RECORDS_COL));
    if (snap.empty) {
      console.log('Payment records collection already empty');
      return true;
    }

    console.log(`Clearing all payment records (${snap.size} documents)...`);
    let batch = writeBatch(db);
    let count = 0;

    for (const d of snap.docs) {
      batch.delete(d.ref);
      count++;
      if (count >= 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
    console.log('Successfully cleared all payment records from Firestore.');
    return true;
  } catch (e) {
    console.error('CRITICAL: Error clearing paymentRecords collection:', e);
    return false;
  }
}

export async function deletePaymentFromFirestore(id: string) {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }
  try {
    const docRef = doc(db, PAYMENT_RECORDS_COL, id);
    console.log('Attempting to delete payment record document:', id);
    await deleteDoc(docRef);
    console.log('Successfully deleted payment record:', id);
  } catch (err) {
    console.error('CRITICAL: Failed to delete payment record:', err);
    throw err;
  }
}


// ----------------------------------------------------------------------
// Notices Helpers
// ----------------------------------------------------------------------
const NOTICES_COL = 'notices';

export function subscribeNotices(onData: (notices: any[]) => void) {
  if (!db) {
    onData([]);
    return () => {};
  }
  try {
    const q = query(collection(db, NOTICES_COL));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      onData(list);
    }, () => onData([]));
  } catch (err) {
    onData([]);
    return () => {};
  }
}

export async function addNoticeToFirestore(notice: Omit<any, 'id'>): Promise<string> {
  if (!db) return 'temp-' + Date.now();
  try {
    const docRef = await addDoc(collection(db, NOTICES_COL), { ...notice, timestamp: Date.now() });
    return docRef.id;
  } catch (err) {
    console.error('Error adding notice:', err);
    return 'temp-' + Date.now();
  }
}

export async function updateNoticeInFirestore(id: string, updates: Partial<any>) {
  if (!db) return;
  try {
    const docRef = doc(db, NOTICES_COL, id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error('Error updating notice:', err);
  }
}

export async function deleteNoticeFromFirestore(id: string) {
  if (!db) return;
  try {
    const docRef = doc(db, NOTICES_COL, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting notice:', err);
  }
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'superadmin';
  assignedModule?: string;
  phone?: string;
  password?: string;
  rollNo?: string;
  createdAt?: number;
  degreeType?: string;
  session?: string;
  status?: string;
  bloodGroup?: string;
  avatarUrl?: string;
  address?: string;
  emergencyContact?: string;
  gender?: 'male' | 'female';
  disabled?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  category: 'Photo' | 'Story' | 'Video' | 'Quote' | 'Funny Moment' | 'BBQ & Music';
  authorName: string;
  authorRole?: string;
  imageUrl?: string;
  location: string;
  date: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  tags: string[];
  comments: Comment[];
}

export interface Batchmate {
  id: string;
  name: string;
  nickName: string;
  rollNo: string;
  section?: string;
  quote: string;
  photoUrl: string;
  favoriteMemory?: string;
  phone?: string;
  socialLink?: string;
  awards: string[];
}

export interface TourSpot {
  id: string;
  name: string;
  locationName: string;
  day: number;
  description: string;
  latitude: number;
  longitude: number;
  highlightPhoto: string;
  tips: string;
  bestTime?: string;
}

export interface ScheduleItem {
  id: string;
  dayNumber: number;
  dayTitle: string;
  time: string;
  title: string;
  location: string;
  details: string;
  iconType: 'bus' | 'hotel' | 'mountain' | 'food' | 'music' | 'camera' | 'waterfall' | 'party';
}

export interface TourPackage {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  organizer: string;
  emergencyContact: string;
  fee: number;
  description?: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  createdAt?: number;
}

export interface BusSeat {
  id: string; // e.g. "A1", "A2"
  status: 'available' | 'booked' | 'male_only' | 'female_only' | 'locked';
  bookedBy?: string;
  bookedPhone?: string;
  bookedPhotoUrl?: string;
  gender?: 'male' | 'female';
}

export interface BusPackage {
  id: string;
  name: string;
  regNo: string;
  type: string;
  totalSeats: number;
  driverName: string;
  driverPhone: string;
  leaderName: string;
  leaderPhone: string;
  seats: Record<string, BusSeat>;
  tourId?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  role: 'student' | 'admin' | 'superadmin';
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  time: string;
  timestamp: number;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type ViewTab = 
  | 'dashboard'
  | 'payment'
  | 'students'
  | 'tours'
  | 'buses'
  | 'notices'
  | 'gallery'
  | 'chat'
  | 'admins'
  | 'activityLogs'
  | 'settings';

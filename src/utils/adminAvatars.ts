// Global helper for storing and retrieving permanent public admin/superadmin profile pictures

const ADMIN_AVATARS_KEY = 'degree_tour_global_admin_avatars_v1';

export interface AdminAvatarMap {
  [key: string]: string; // key can be email, role ('superadmin' / 'admin'), or name
}

export function getStoredAdminAvatars(): AdminAvatarMap {
  try {
    const saved = localStorage.getItem(ADMIN_AVATARS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load admin avatars:', e);
  }
  return {
    superadmin: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    admin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  };
}

export function saveAdminAvatar(identifier: string, avatarUrl: string) {
  try {
    const current = getStoredAdminAvatars();
    current[identifier.toLowerCase().trim()] = avatarUrl;
    localStorage.setItem(ADMIN_AVATARS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save admin avatar:', e);
  }
}

export function getPublicAdminAvatar(role?: string, email?: string, name?: string): string | undefined {
  const map = getStoredAdminAvatars();
  if (email && map[email.toLowerCase().trim()]) {
    return map[email.toLowerCase().trim()];
  }
  if (name && map[name.toLowerCase().trim()]) {
    return map[name.toLowerCase().trim()];
  }
  if (role && map[role.toLowerCase().trim()]) {
    return map[role.toLowerCase().trim()];
  }
  return undefined;
}

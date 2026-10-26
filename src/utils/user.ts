import { UserProfile } from '../types';

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'user-default',
    name: 'Alex Mercer (You)',
    email: 'alex.mercer@example.com',
    avatarColor: '#2563eb', // Blue
    avatarInitials: 'AM',
  },
  {
    id: 'user-jordan',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    avatarColor: '#10b981', // Emerald
    avatarInitials: 'JL',
  },
  {
    id: 'user-taylor',
    name: 'Taylor Rivera',
    email: 'taylor.r@example.com',
    avatarColor: '#f59e0b', // Amber
    avatarInitials: 'TR',
  },
  {
    id: 'user-sam',
    name: 'Sam Patel',
    email: 'sam.patel@example.com',
    avatarColor: '#ec4899', // Pink
    avatarInitials: 'SP',
  },
];

const STORAGE_KEY = 'synchrotask_active_user';

export function getStoredUser(): UserProfile {
  if (typeof window === 'undefined') return PRESET_USERS[0];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored user profile:', e);
  }

  // Check URL param if testing with ?user=jordan or similar
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get('user');
  if (userParam) {
    const matched = PRESET_USERS.find(
      (u) => u.name.toLowerCase().includes(userParam.toLowerCase()) || u.id.toLowerCase().includes(userParam.toLowerCase())
    );
    if (matched) {
      saveStoredUser(matched);
      return matched;
    }
  }

  saveStoredUser(PRESET_USERS[0]);
  return PRESET_USERS[0];
}

export function saveStoredUser(user: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('synchrotask:user_changed', { detail: user }));
}

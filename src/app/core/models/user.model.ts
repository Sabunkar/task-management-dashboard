export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Project Manager' | 'Developer' | 'Designer';
  avatarUrl?: string;
  department?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Project Manager' | 'Developer' | 'Designer';
  department?: string;
}

export interface MockUserRecord extends User {
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
  rememberMe: boolean;
  timestamp: string;
}

export interface ProfileUpdateData {
  name: string;
  email: string;
  role: 'Admin' | 'Project Manager' | 'Developer' | 'Designer';
  department?: string;
  avatarUrl?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface UserNotificationPreferences {
  taskAssigned: boolean;
  deadlineReminders: boolean;
  projectUpdates: boolean;
  workspaceAnnouncements: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: UserNotificationPreferences;
}

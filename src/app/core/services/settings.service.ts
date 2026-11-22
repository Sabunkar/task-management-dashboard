import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserNotificationPreferences } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly THEME_KEY = 'pulsetask_theme';
  private readonly NOTIF_KEY = 'pulsetask_notifications';

  private readonly defaultNotifications: UserNotificationPreferences = {
    taskAssigned: true,
    deadlineReminders: true,
    projectUpdates: true,
    workspaceAnnouncements: false
  };

  private readonly themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  readonly theme$ = this.themeSubject.asObservable();

  private readonly notificationSubject = new BehaviorSubject<UserNotificationPreferences>(this.defaultNotifications);
  readonly notificationPreferences$ = this.notificationSubject.asObservable();

  constructor() {
    this.initSettings();
  }

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Initialize theme and notification settings from persistent browser storage
   */
  private initSettings(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      // 1. Theme initialization
      const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.themeSubject.next(savedTheme);
        this.applyThemeToDOM(savedTheme);
      } else {
        this.applyThemeToDOM('light');
      }

      // 2. Notification preferences initialization
      const savedNotifs = localStorage.getItem(this.NOTIF_KEY);
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        this.notificationSubject.next({
          ...this.defaultNotifications,
          ...parsed
        });
      }
    } catch (e) {
      console.warn('Could not restore settings from localStorage', e);
    }
  }

  get currentTheme(): 'light' | 'dark' {
    return this.themeSubject.value;
  }

  get currentNotifications(): UserNotificationPreferences {
    return { ...this.notificationSubject.value };
  }

  /**
   * Set and persist active theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSubject.next(theme);
    this.applyThemeToDOM(theme);

    if (this.isBrowser) {
      try {
        localStorage.setItem(this.THEME_KEY, theme);
      } catch (e) {
        console.warn('Could not persist theme to localStorage', e);
      }
    }
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const next = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  /**
   * Update and persist notification preferences
   */
  updateNotificationPreferences(prefs: Partial<UserNotificationPreferences>): void {
    const updated: UserNotificationPreferences = {
      ...this.currentNotifications,
      ...prefs
    };

    this.notificationSubject.next(updated);

    if (this.isBrowser) {
      try {
        localStorage.setItem(this.NOTIF_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist notification preferences to localStorage', e);
      }
    }
  }

  private applyThemeToDOM(theme: 'light' | 'dark'): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}


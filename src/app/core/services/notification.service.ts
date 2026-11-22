import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppNotification, NotificationType } from '../models/notification.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly STORAGE_KEY = 'pulsetask_notifications_data';
  private readonly settingsService = inject(SettingsService);

  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  /**
   * Reactively derived unread notifications count
   */
  readonly unreadCount$: Observable<number> = this.notifications$.pipe(
    map(items => items.filter(n => !n.read).length)
  );

  constructor() {
    this.initNotifications();
  }

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Current snapshot of notifications
   */
  get currentNotifications(): AppNotification[] {
    return this.notificationsSubject.getValue();
  }

  /**
   * Current snapshot of unread count
   */
  get unreadCount(): number {
    return this.currentNotifications.filter(n => !n.read).length;
  }

  /**
   * Initialize notifications from persistent browser storage or fallback to mock seed
   */
  private initNotifications(): void {
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed: AppNotification[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.notificationsSubject.next(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not restore notifications from localStorage', e);
      }
    }

    // Default seed mock notifications
    const now = Date.now();
    const seed: AppNotification[] = [
      {
        id: 'notif-1',
        title: 'New Task Assigned',
        message: 'Sarah Jenkins assigned you to "REST API Schema & Endpoints".',
        type: 'task_assigned',
        read: false,
        createdAt: new Date(now - 10 * 60000).toISOString(),
        relatedEntityId: 'task-1',
        routeUrl: '/tasks',
        icon: 'assignment_ind',
        color: '#4f46e5'
      },
      {
        id: 'notif-2',
        title: 'Deadline Approaching',
        message: 'Pulse SaaS Redesign milestone due today at 5:00 PM.',
        type: 'deadline_approaching',
        read: false,
        createdAt: new Date(now - 60 * 60000).toISOString(),
        relatedEntityId: 'proj-1',
        routeUrl: '/dashboard',
        icon: 'schedule',
        color: '#f59e0b'
      },
      {
        id: 'notif-3',
        title: 'Project Status Updated',
        message: 'Design System & Token Library marked as Completed.',
        type: 'project_completed',
        read: false,
        createdAt: new Date(now - 180 * 60000).toISOString(),
        relatedEntityId: 'proj-4',
        routeUrl: '/projects',
        icon: 'check_circle',
        color: '#10b981'
      },
      {
        id: 'notif-4',
        title: 'Task Status Changed',
        message: '"Mobile App Architecture v2" moved to In Progress.',
        type: 'task_status_changed',
        read: true,
        createdAt: new Date(now - 86400000).toISOString(),
        relatedEntityId: 'task-3',
        routeUrl: '/board',
        icon: 'published_with_changes',
        color: '#f59e0b'
      },
      {
        id: 'notif-5',
        title: 'Project Workspace Created',
        message: '"API Gateway & Auth Service" was added to active projects.',
        type: 'project_created',
        read: true,
        createdAt: new Date(now - 2 * 86400000).toISOString(),
        relatedEntityId: 'proj-3',
        routeUrl: '/projects',
        icon: 'create_new_folder',
        color: '#8b5cf6'
      }
    ];

    this.notificationsSubject.next(seed);
  }

  /**
   * Maps notification types to design system icon and brand color
   */
  private getVisualsForType(type: NotificationType): { icon: string; color: string } {
    switch (type) {
      case 'task_assigned':
        return { icon: 'assignment_ind', color: '#4f46e5' };
      case 'task_created':
        return { icon: 'add_task', color: '#0ea5e9' };
      case 'task_status_changed':
        return { icon: 'published_with_changes', color: '#f59e0b' };
      case 'task_completed':
        return { icon: 'task_alt', color: '#10b981' };
      case 'deadline_approaching':
        return { icon: 'schedule', color: '#ef4444' };
      case 'project_created':
        return { icon: 'create_new_folder', color: '#8b5cf6' };
      case 'project_updated':
        return { icon: 'folder_managed', color: '#0284c7' };
      case 'project_completed':
        return { icon: 'check_circle', color: '#10b981' };
      case 'general':
      default:
        return { icon: 'notifications', color: '#6366f1' };
    }
  }

  /**
   * Check if notification should be generated based on active user Settings preferences
   */
  private isAllowedByPreferences(type: NotificationType): boolean {
    const prefs = this.settingsService.currentNotifications;

    if (type === 'task_assigned' || type === 'task_created' || type === 'task_status_changed' || type === 'task_completed') {
      return prefs.taskAssigned;
    }
    if (type === 'deadline_approaching') {
      return prefs.deadlineReminders;
    }
    if (type === 'project_created' || type === 'project_updated' || type === 'project_completed') {
      return prefs.projectUpdates;
    }
    if (type === 'general') {
      return prefs.workspaceAnnouncements;
    }

    return true;
  }

  /**
   * Create and broadcast a new notification if allowed by user preferences
   */
  createNotification(item: {
    title: string;
    message: string;
    type: NotificationType;
    relatedEntityId?: string;
    routeUrl?: string;
    icon?: string;
    color?: string;
  }): AppNotification | null {
    // Respect user's existing notification settings
    if (!this.isAllowedByPreferences(item.type)) {
      return null;
    }

    const visuals = this.getVisualsForType(item.type);

    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      message: item.message,
      type: item.type,
      read: false,
      createdAt: new Date().toISOString(),
      relatedEntityId: item.relatedEntityId,
      routeUrl: item.routeUrl,
      icon: item.icon || visuals.icon,
      color: item.color || visuals.color
    };

    const updated = [newNotification, ...this.currentNotifications];
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
    return newNotification;
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(id: string): void {
    const current = this.currentNotifications;
    const index = current.findIndex(n => n.id === id);

    if (index !== -1 && !current[index].read) {
      const updated = [...current];
      updated[index] = { ...current[index], read: true };
      this.notificationsSubject.next(updated);
      this.saveToStorage(updated);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const updated = this.currentNotifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Delete or dismiss a single notification
   */
  deleteNotification(id: string): void {
    const updated = this.currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.saveToStorage([]);
  }

  /**
   * Filter notifications stream by status (all, unread, read)
   */
  filterNotifications(filter: 'all' | 'unread' | 'read'): Observable<AppNotification[]> {
    return this.notifications$.pipe(
      map(items => {
        if (filter === 'unread') return items.filter(n => !n.read);
        if (filter === 'read') return items.filter(n => n.read);
        return items;
      })
    );
  }

  private saveToStorage(notifications: AppNotification[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not persist notifications to localStorage', e);
    }
  }
}


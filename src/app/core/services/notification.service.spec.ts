import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';
import { SettingsService } from './settings.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let settingsService: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [NotificationService, SettingsService]
    });
    service = TestBed.inject(NotificationService);
    settingsService = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with mock notifications and calculate unread count', async () => {
    const notifications = await firstValueFrom(service.notifications$);
    expect(notifications.length).toBeGreaterThan(0);

    const unreadCount = await firstValueFrom(service.unreadCount$);
    const expectedUnread = notifications.filter(n => !n.read).length;
    expect(unreadCount).toBe(expectedUnread);
  });

  it('should create a new notification when preferences allow', () => {
    const initialCount = service.currentNotifications.length;
    const initialUnread = service.unreadCount;

    const created = service.createNotification({
      title: 'Task Assigned',
      message: 'You were assigned to "Design Tokens".',
      type: 'task_assigned',
      relatedEntityId: 'task-10',
      routeUrl: '/tasks'
    });

    expect(created).toBeTruthy();
    expect(created?.id).toMatch(/^notif-/);
    expect(created?.read).toBe(false);
    expect(service.currentNotifications.length).toBe(initialCount + 1);
    expect(service.unreadCount).toBe(initialUnread + 1);
  });

  it('should respect user preferences and suppress notifications when disabled', () => {
    // Disable task notifications in Settings
    settingsService.updateNotificationPreferences({ taskAssigned: false });

    const created = service.createNotification({
      title: 'Task Created',
      message: 'A task was created.',
      type: 'task_created'
    });

    expect(created).toBeNull(); // Suppressed
  });

  it('should suppress project notifications when projectUpdates is disabled in Settings', () => {
    settingsService.updateNotificationPreferences({ projectUpdates: false });

    const created = service.createNotification({
      title: 'Project Milestone',
      message: 'Milestone reached.',
      type: 'project_completed'
    });

    expect(created).toBeNull(); // Suppressed
  });

  it('should mark an individual notification as read and decrement unread count', () => {
    const unread = service.currentNotifications.find(n => !n.read)!;
    expect(unread).toBeDefined();

    const previousUnread = service.unreadCount;
    service.markAsRead(unread.id);

    const updated = service.currentNotifications.find(n => n.id === unread.id)!;
    expect(updated.read).toBe(true);
    expect(service.unreadCount).toBe(previousUnread - 1);
  });

  it('should mark all notifications as read', () => {
    expect(service.unreadCount).toBeGreaterThan(0);

    service.markAllAsRead();

    expect(service.unreadCount).toBe(0);
    expect(service.currentNotifications.every(n => n.read)).toBe(true);
  });

  it('should delete a notification and persist the change', () => {
    const target = service.currentNotifications[0];
    const initialLength = service.currentNotifications.length;

    service.deleteNotification(target.id);

    expect(service.currentNotifications.length).toBe(initialLength - 1);
    expect(service.currentNotifications.find(n => n.id === target.id)).toBeUndefined();
  });

  it('should clear all notifications', () => {
    service.clearAll();
    expect(service.currentNotifications.length).toBe(0);
    expect(service.unreadCount).toBe(0);
  });

  it('should filter notifications by all, unread, and read streams', async () => {
    const all = await firstValueFrom(service.filterNotifications('all'));
    const unread = await firstValueFrom(service.filterNotifications('unread'));
    const read = await firstValueFrom(service.filterNotifications('read'));

    expect(all.length).toBe(unread.length + read.length);
    expect(unread.every(n => !n.read)).toBe(true);
    expect(read.every(n => n.read)).toBe(true);
  });
});


import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NotificationsComponent } from './notifications.component';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let router: Router;

  const mockList: AppNotification[] = [
    {
      id: 'notif-1',
      title: 'New Task Assigned',
      message: 'You have been assigned to REST API.',
      type: 'task_assigned',
      read: false,
      createdAt: new Date().toISOString(),
      relatedEntityId: 'task-1',
      routeUrl: '/tasks',
      icon: 'assignment_ind',
      color: '#4f46e5'
    },
    {
      id: 'notif-2',
      title: 'Project Milestone',
      message: 'Design System completed.',
      type: 'project_completed',
      read: true,
      createdAt: new Date().toISOString(),
      relatedEntityId: 'proj-4',
      routeUrl: '/projects',
      icon: 'check_circle',
      color: '#10b981'
    }
  ];

  let notificationsSubject: BehaviorSubject<AppNotification[]>;
  let unreadCountSubject: BehaviorSubject<number>;
  let notificationServiceSpy: {
    notifications$: BehaviorSubject<AppNotification[]>;
    currentNotifications: AppNotification[];
    unreadCount$: BehaviorSubject<number>;
    unreadCount: number;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
    deleteNotification: ReturnType<typeof vi.fn>;
    clearAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<AppNotification[]>(mockList);
    unreadCountSubject = new BehaviorSubject<number>(1);

    notificationServiceSpy = {
      notifications$: notificationsSubject,
      get currentNotifications() {
        return notificationsSubject.value;
      },
      unreadCount$: unreadCountSubject,
      get unreadCount() {
        return unreadCountSubject.value;
      },
      markAsRead: vi.fn((id: string) => {
        const updated = notificationsSubject.value.map(n => n.id === id ? { ...n, read: true } : n);
        notificationsSubject.next(updated);
        unreadCountSubject.next(updated.filter(n => !n.read).length);
      }),
      markAllAsRead: vi.fn(() => {
        const updated = notificationsSubject.value.map(n => ({ ...n, read: true }));
        notificationsSubject.next(updated);
        unreadCountSubject.next(0);
      }),
      deleteNotification: vi.fn((id: string) => {
        const updated = notificationsSubject.value.filter(n => n.id !== id);
        notificationsSubject.next(updated);
        unreadCountSubject.next(updated.filter(n => !n.read).length);
      }),
      clearAll: vi.fn(() => {
        notificationsSubject.next([]);
        unreadCountSubject.next(0);
      })
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should render notifications list and summary counters', () => {
    expect(component).toBeTruthy();
    expect(component.totalCount()).toBe(2);
    expect(component.unreadCount()).toBe(1);
    expect(component.readCount()).toBe(1);
    expect(component.filteredNotifications().length).toBe(2);
  });

  it('should filter notifications when tab changes to unread or read', () => {
    component.activeFilter.set('unread');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('notif-1');

    component.activeFilter.set('read');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('notif-2');
  });

  it('should mark an individual notification as read', () => {
    component.onMarkAsRead('notif-1');

    expect(notificationServiceSpy.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(component.actionNotice()).toContain('marked as read');
  });

  it('should mark all notifications as read', () => {
    component.onMarkAllRead();

    expect(notificationServiceSpy.markAllAsRead).toHaveBeenCalled();
    expect(component.actionNotice()).toContain('All notifications');
  });

  it('should dismiss a single notification', () => {
    component.onDeleteNotification('notif-1');

    expect(notificationServiceSpy.deleteNotification).toHaveBeenCalledWith('notif-1');
    expect(component.actionNotice()).toContain('dismissed');
  });

  it('should clear all notifications', () => {
    component.onClearAll();

    expect(notificationServiceSpy.clearAll).toHaveBeenCalled();
    expect(component.actionNotice()).toContain('cleared');
  });

  it('should mark as read and navigate when clicking view details', () => {
    const item = mockList[0];
    component.navigateToEntity(item);

    expect(notificationServiceSpy.markAsRead).toHaveBeenCalledWith(item.id);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });
});


import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification, NotificationType } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notifications-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Notification Center</h1>
          <p class="page-subtitle">Stay informed with real-time audit alerts, task assignments, and project milestone updates.</p>
        </div>
        <div class="header-actions">
          @if (unreadCount() > 0) {
            <button type="button" class="btn btn-outline-primary" (click)="onMarkAllRead()">
              <span class="material-symbols-outlined">done_all</span>
              <span>Mark All as Read</span>
            </button>
          }
          @if (allNotifications().length > 0) {
            <button type="button" class="btn btn-secondary" (click)="onClearAll()">
              <span class="material-symbols-outlined">delete_sweep</span>
              <span>Clear All</span>
            </button>
          }
          <a routerLink="/settings" class="btn btn-secondary">
            <span class="material-symbols-outlined">tune</span>
            <span>Preferences</span>
          </a>
        </div>
      </div>

      <!-- Action Feedback Notice Banner -->
      @if (actionNotice()) {
        <div class="alert alert-info" role="alert">
          <span class="material-symbols-outlined alert-icon">info</span>
          <div class="alert-content">
            <span class="alert-message">{{ actionNotice() }}</span>
          </div>
          <button type="button" class="alert-close" (click)="actionNotice.set(null)" aria-label="Dismiss">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Metric Stats Summary Bar -->
      <div class="stats-summary-grid">
        <div class="card stat-metric-card">
          <div class="stat-icon-box" style="background-color: #eef2ff; color: #4f46e5;">
            <span class="material-symbols-outlined">notifications</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Notifications</span>
            <span class="stat-value">{{ totalCount() }}</span>
          </div>
        </div>

        <div class="card stat-metric-card">
          <div class="stat-icon-box" style="background-color: #fef2f2; color: #ef4444;">
            <span class="material-symbols-outlined">mark_email_unread</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Unread Alerts</span>
            <span class="stat-value text-danger">{{ unreadCount() }}</span>
          </div>
        </div>

        <div class="card stat-metric-card">
          <div class="stat-icon-box" style="background-color: #ecfdf5; color: #10b981;">
            <span class="material-symbols-outlined">mark_email_read</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Read Notifications</span>
            <span class="stat-value text-success">{{ readCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Filter Tabs Bar -->
      <div class="notifications-tabs-container">
        <div class="tabs-nav">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeFilter() === 'all'"
            (click)="activeFilter.set('all')"
          >
            <span>All Alerts</span>
            <span class="tab-badge">{{ totalCount() }}</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeFilter() === 'unread'"
            (click)="activeFilter.set('unread')"
          >
            <span>Unread</span>
            <span class="tab-badge" [class.badge-danger]="unreadCount() > 0">{{ unreadCount() }}</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeFilter() === 'read'"
            (click)="activeFilter.set('read')"
          >
            <span>Read</span>
            <span class="tab-badge">{{ readCount() }}</span>
          </button>
        </div>
      </div>

      <!-- Notifications List Container -->
      <div class="notifications-main-content">
        @if (filteredNotifications().length > 0) {
          <div class="notifications-card-list">
            @for (item of filteredNotifications(); track item.id) {
              <div 
                class="notification-card" 
                [class.unread-card]="!item.read"
              >
                <!-- Notification Icon -->
                <div class="card-icon-box" [style.background-color]="item.color + '1a'" [style.color]="item.color">
                  <span class="material-symbols-outlined">{{ item.icon || 'notifications' }}</span>
                </div>

                <!-- Main Content -->
                <div class="card-text-content">
                  <div class="card-title-row">
                    <div class="card-title-group">
                      @if (!item.read) {
                        <span class="unread-dot" title="Unread notification"></span>
                      }
                      <h3 class="card-title">{{ item.title }}</h3>
                      <span class="category-badge" [style.color]="item.color" [style.background-color]="item.color + '18'">
                        {{ getCategoryLabel(item.type) }}
                      </span>
                    </div>
                    <span class="card-timestamp" [title]="item.createdAt">
                      {{ formatRelativeTime(item.createdAt) }}
                    </span>
                  </div>

                  <p class="card-message">{{ item.message }}</p>

                  <!-- Card Footer Actions -->
                  <div class="card-footer-actions">
                    @if (item.routeUrl) {
                      <button 
                        type="button" 
                        class="btn-action-link" 
                        (click)="navigateToEntity(item)"
                      >
                        <span class="material-symbols-outlined">launch</span>
                        <span>View Details</span>
                      </button>
                    }

                    @if (!item.read) {
                      <button 
                        type="button" 
                        class="btn-action-link" 
                        (click)="onMarkAsRead(item.id)"
                      >
                        <span class="material-symbols-outlined">done</span>
                        <span>Mark as read</span>
                      </button>
                    }

                    <button 
                      type="button" 
                      class="btn-action-link btn-action-danger" 
                      (click)="onDeleteNotification(item.id)"
                      title="Dismiss notification"
                    >
                      <span class="material-symbols-outlined">close</span>
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Empty State -->
          <div class="card empty-state-card">
            <div class="empty-state-icon-box">
              <span class="material-symbols-outlined">
                {{ activeFilter() === 'unread' ? 'done_all' : 'notifications_off' }}
              </span>
            </div>
            <h3 class="empty-state-title">
              {{ activeFilter() === 'unread' ? "You're all caught up!" : 'No notifications found' }}
            </h3>
            <p class="empty-state-desc">
              @if (activeFilter() === 'unread') {
                Great job! There are no unread notifications requiring your attention.
              } @else if (activeFilter() === 'read') {
                You haven't read or archived any notifications yet.
              } @else {
                There are no notifications in your activity center at this time.
              }
            </p>
            @if (activeFilter() !== 'all') {
              <button type="button" class="btn btn-secondary btn-sm" (click)="activeFilter.set('all')">
                <span>View all notifications</span>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-main);
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Alert */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    .alert-info {
      background-color: var(--color-info-bg);
      border: 1px solid var(--color-info-border);
      color: var(--color-info-text);
    }

    .alert-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-content {
      flex: 1;
      line-height: 1.4;
    }

    .alert-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0;
    }

    /* Stats Summary Grid */
    .stats-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 768px) {
      .stats-summary-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-metric-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
    }

    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-box .material-symbols-outlined {
      font-size: 26px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-main);
      line-height: 1.2;
    }

    .text-danger {
      color: var(--color-danger);
    }

    .text-success {
      color: var(--color-success);
    }

    /* Filter Tabs Bar */
    .notifications-tabs-container {
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 2px;
    }

    .tabs-nav {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      background: none;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--color-text-main);
    }

    .tab-btn.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }

    .tab-badge {
      background-color: var(--color-surface-hover);
      color: var(--color-text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: var(--radius-full);
      line-height: 1;
    }

    .tab-btn.active .tab-badge {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
    }

    .tab-badge.badge-danger {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
    }

    /* Notification Cards List */
    .notifications-card-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-xs);
    }

    .notification-card:hover {
      border-color: var(--color-border-strong);
      box-shadow: var(--shadow-sm);
    }

    .notification-card.unread-card {
      border-left: 4px solid var(--color-primary);
      background-color: var(--color-surface);
    }

    .card-icon-box {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon-box .material-symbols-outlined {
      font-size: 22px;
    }

    .card-text-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-primary);
      flex-shrink: 0;
    }

    .card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .unread-card .card-title {
      font-weight: 700;
    }

    .category-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: var(--radius-xs);
      letter-spacing: 0.02em;
    }

    .card-timestamp {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .card-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    .card-footer-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .btn-action-link {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0;
      transition: color 0.15s ease;
    }

    .btn-action-link:hover {
      text-decoration: underline;
    }

    .btn-action-link .material-symbols-outlined {
      font-size: 16px;
    }

    .btn-action-danger {
      color: var(--color-text-muted);
    }

    .btn-action-danger:hover {
      color: var(--color-danger);
    }

    /* Empty State */
    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 56px 24px;
      gap: 14px;
    }

    .empty-state-icon-box {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background-color: var(--color-surface-hover);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state-icon-box .material-symbols-outlined {
      font-size: 36px;
    }

    .empty-state-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .empty-state-desc {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      max-width: 420px;
      line-height: 1.5;
    }

    .btn-outline-primary {
      background-color: transparent;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
    }

    .btn-outline-primary:hover {
      background-color: var(--color-primary-light);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Filter state
  activeFilter = signal<'all' | 'unread' | 'read'>('all');
  actionNotice = signal<string | null>(null);

  // Central notifications stream
  allNotifications = toSignal(this.notificationService.notifications$, {
    initialValue: this.notificationService.currentNotifications
  });

  unreadCount = toSignal(this.notificationService.unreadCount$, {
    initialValue: this.notificationService.unreadCount
  });

  totalCount = computed(() => this.allNotifications().length);
  readCount = computed(() => this.allNotifications().filter(n => n.read).length);

  // Dynamic filtered list based on tab selection
  filteredNotifications = computed(() => {
    const list = this.allNotifications();
    const filter = this.activeFilter();
    if (filter === 'unread') return list.filter(n => !n.read);
    if (filter === 'read') return list.filter(n => n.read);
    return list;
  });

  onMarkAsRead(id: string): void {
    this.notificationService.markAsRead(id);
    this.actionNotice.set('Notification marked as read.');
    setTimeout(() => this.actionNotice.set(null), 2500);
  }

  onMarkAllRead(): void {
    this.notificationService.markAllAsRead();
    this.actionNotice.set('All notifications have been marked as read.');
    setTimeout(() => this.actionNotice.set(null), 2500);
  }

  onDeleteNotification(id: string): void {
    this.notificationService.deleteNotification(id);
    this.actionNotice.set('Notification dismissed.');
    setTimeout(() => this.actionNotice.set(null), 2500);
  }

  onClearAll(): void {
    this.notificationService.clearAll();
    this.actionNotice.set('All notifications have been cleared.');
    setTimeout(() => this.actionNotice.set(null), 2500);
  }

  navigateToEntity(item: AppNotification): void {
    this.notificationService.markAsRead(item.id);
    if (item.routeUrl) {
      this.router.navigateByUrl(item.routeUrl);
    }
  }

  getCategoryLabel(type: NotificationType): string {
    switch (type) {
      case 'task_assigned':
        return 'Task Assigned';
      case 'task_created':
        return 'Task Created';
      case 'task_status_changed':
        return 'Status Changed';
      case 'task_completed':
        return 'Task Completed';
      case 'deadline_approaching':
        return 'Deadline Alert';
      case 'project_created':
        return 'Project Workspace';
      case 'project_updated':
        return 'Project Update';
      case 'project_completed':
        return 'Project Milestone';
      case 'general':
      default:
        return 'Announcement';
    }
  }

  formatRelativeTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const time = new Date(isoString).getTime();
      const diffMs = Date.now() - time;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
}

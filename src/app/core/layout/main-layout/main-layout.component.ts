import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, of, filter, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { DashboardService } from '../../services/dashboard.service';
import { NotificationService } from '../../services/notification.service';
import { SearchService, GlobalSearchResults } from '../../services/search.service';
import { AppNotification } from '../../models/notification.model';
import { Task } from '../../models/task.model';
import { Project } from '../../models/project.model';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

export interface QuickNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private taskService = inject(TaskService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private searchService = inject(SearchService);

  // Authenticated user state reactively synced with AuthService
  currentUser = toSignal(this.authService.currentUser$, { initialValue: this.authService.currentUser });
  userName = computed(() => this.currentUser()?.name ?? 'User');
  userEmail = computed(() => this.currentUser()?.email ?? '');
  userRole = computed(() => this.currentUser()?.role ?? 'Member');
  userInitials = computed(() => {
    const name = this.userName().trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'PT').toUpperCase();
  });

  // Centralized notifications state
  notifications = toSignal(this.notificationService.notifications$, {
    initialValue: this.notificationService.currentNotifications
  });
  unreadCount = toSignal(this.notificationService.unreadCount$, {
    initialValue: this.notificationService.unreadCount
  });

  // Responsive sidebar state
  sidebarCollapsed = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);

  // Topbar dropdown states
  notificationDropdownOpen = signal<boolean>(false);
  userDropdownOpen = signal<boolean>(false);
  quickTaskModalOpen = signal<boolean>(false);

  // Global Search state with debounced stream
  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();
  searchDropdownOpen = signal<boolean>(false);
  searchFocused = signal<boolean>(false);
  searchLoading = signal<boolean>(false);
  searchResults = signal<GlobalSearchResults>({ query: '', tasks: [], projects: [], totalCount: 0 });

  // Quick Task form local state
  newQuickTaskTitle = signal<string>('');
  newQuickTaskPriority = signal<'Low' | 'Medium' | 'High'>('Medium');
  quickTaskCreatedNotice = signal<boolean>(false);

  // Active route tracking for breadcrumb
  currentPath = signal<string>('/dashboard');

  // Navigation Items
  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'My Projects', path: '/projects', icon: 'folder_open' },
    { label: 'All Tasks', path: '/tasks', icon: 'task_alt' },
    { label: 'Kanban Board', path: '/board', icon: 'view_kanban' },
    { label: 'Analytics', path: '/analytics', icon: 'monitoring' },
    { label: 'Notifications', path: '/notifications', icon: 'notifications', badge: 3 },
    { label: 'Profile', path: '/profile', icon: 'account_circle' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ];

  // Computed page title and breadcrumb
  pageTitle = computed(() => {
    const path = this.currentPath();
    if (path.includes('dashboard')) return 'Dashboard Overview';
    if (path.includes('projects')) return 'My Projects';
    if (path.includes('tasks')) return 'All Tasks';
    if (path.includes('board')) return 'Kanban Task Board';
    if (path.includes('analytics')) return 'Reports & Analytics';
    if (path.includes('notifications')) return 'Notification Center';
    if (path.includes('profile')) return 'User Profile';
    if (path.includes('settings')) return 'Workspace Settings';
    if (path.includes('404')) return 'Page Not Found';
    return 'Dashboard';
  });

  pageBreadcrumb = computed(() => {
    const path = this.currentPath();
    if (path.includes('dashboard')) return 'Home / Dashboard';
    if (path.includes('projects')) return 'Workspaces / Projects';
    if (path.includes('tasks')) return 'Workspace / Tasks';
    if (path.includes('board')) return 'Projects / Board';
    if (path.includes('analytics')) return 'Insights / Analytics';
    if (path.includes('notifications')) return 'Activity / Notifications';
    if (path.includes('profile')) return 'Account / Profile';
    if (path.includes('settings')) return 'System / Settings';
    return 'Home / Overview';
  });

  constructor() {
    // Track router navigation to automatically update breadcrumbs
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentPath.set(event.urlAfterRedirects || event.url);
        this.closeAllDropdowns();
        this.closeSearchDropdown();
      });

    // Debounced global search across tasks and projects
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        if (!q) {
          this.searchLoading.set(false);
          return of({ query: '', tasks: [], projects: [], totalCount: 0 });
        }
        this.searchLoading.set(true);
        return this.searchService.search(q).pipe(
          tap(() => this.searchLoading.set(false))
        );
      })
    ).subscribe(res => {
      this.searchResults.set(res);
    });
  }

  // Sidebar controls
  toggleSidebar(): void {
    this.sidebarCollapsed.update(val => !val);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(val => !val);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // Topbar dropdown toggles
  toggleNotificationDropdown(event: Event): void {
    event.stopPropagation();
    this.userDropdownOpen.set(false);
    this.notificationDropdownOpen.update(val => !val);
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.notificationDropdownOpen.set(false);
    this.userDropdownOpen.update(val => !val);
  }

  closeAllDropdowns(): void {
    this.notificationDropdownOpen.set(false);
    this.userDropdownOpen.set(false);
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onNotificationClick(item: AppNotification): void {
    this.notificationService.markAsRead(item.id);
    this.closeAllDropdowns();
    if (item.routeUrl) {
      this.router.navigateByUrl(item.routeUrl);
    }
  }

  formatTimeAgo(isoString: string): string {
    if (!isoString) return '';
    const now = Date.now();
    const time = new Date(isoString).getTime();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Search actions
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
    this.searchDropdownOpen.set(true);
  }

  onSearchFocus(): void {
    this.searchFocused.set(true);
    this.searchDropdownOpen.set(true);
    if (this.searchQuery().trim()) {
      this.searchSubject.next(this.searchQuery());
    }
  }

  closeSearchDropdown(): void {
    this.searchDropdownOpen.set(false);
    this.searchFocused.set(false);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSearchDropdown();
      event.preventDefault();
    } else if (event.key === 'Enter') {
      this.onSearchSubmit(event);
    }
  }

  selectTaskResult(task: Task): void {
    this.closeSearchDropdown();
    this.router.navigate(['/tasks'], { queryParams: { q: task.title } });
  }

  selectProjectResult(project: Project): void {
    this.closeSearchDropdown();
    this.router.navigate(['/projects', project.id]);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
    this.searchResults.set({ query: '', tasks: [], projects: [], totalCount: 0 });
  }

  onSearchSubmit(event?: Event): void {
    if (event) event.preventDefault();
    const query = this.searchQuery().trim();
    this.closeSearchDropdown();
    if (query) {
      // Navigate to tasks with search query param
      this.router.navigate(['/tasks'], { queryParams: { q: query } });
    }
  }

  // Quick Task Modal
  openQuickTaskModal(): void {
    this.closeAllDropdowns();
    this.newQuickTaskTitle.set('');
    this.newQuickTaskPriority.set('Medium');
    this.quickTaskCreatedNotice.set(false);
    this.quickTaskModalOpen.set(true);
  }

  closeQuickTaskModal(): void {
    this.quickTaskModalOpen.set(false);
  }

  createQuickTask(): void {
    const title = this.newQuickTaskTitle().trim();
    if (!title) return;

    // Add task via TaskService which reactively updates all subscribers
    this.taskService.addTask({
      title,
      priority: this.newQuickTaskPriority(),
      status: 'To Do',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign'
    }).subscribe();

    this.dashboardService.addActivity(this.userName(), 'created new task', title);

    // Show instant success feedback
    this.quickTaskCreatedNotice.set(true);
    setTimeout(() => {
      this.quickTaskModalOpen.set(false);
      this.quickTaskCreatedNotice.set(false);
      // Navigate to tasks view to see tasks if not on dashboard
      this.router.navigate(['/dashboard']);
    }, 700);
  }

  /**
   * Terminate user session and redirect to /auth/login
   */
  onLogout(): void {
    this.closeAllDropdowns();
    this.authService.logout().subscribe();
  }

  // Close dropdowns on document click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.closeAllDropdowns();
    }
    if (!target.closest('.search-container')) {
      this.closeSearchDropdown();
    }
  }
}

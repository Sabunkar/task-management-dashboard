import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardPayload } from '../../core/services/dashboard.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { DashboardUpcomingTask } from './dashboard.data';
import { Project } from '../../core/models/project.model';
import { Task } from '../../core/models/task.model';
import { ActivityItem } from '../../core/models/dashboard.model';
import { DistributionItem } from '../../core/models/analytics.model';
import { SvgDonutChartComponent } from '../../shared/components/charts/svg-donut-chart.component';
import { SvgWeeklyProductivityChartComponent, WeekDayProductivity } from '../../shared/components/charts/svg-weekly-productivity-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    SvgDonutChartComponent,
    SvgWeeklyProductivityChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // Loading & Error States
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Authenticated user greeting state
  currentUser = toSignal(this.authService.currentUser$, { initialValue: this.authService.currentUser });
  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'there';
    return user.name.split(' ')[0];
  });

  userInitials = computed(() => {
    const name = this.currentUser()?.name || 'John Doe';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'PT').toUpperCase();
  });

  // Dynamic streams
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  activities = signal<ActivityItem[]>([]);
  upcomingTasks = signal<DashboardUpcomingTask[]>([]);

  // Computed metrics
  totalTasksCount = computed(() => this.tasks().length);
  completedTasksCount = computed(() => this.tasks().filter(t => t.status === 'Completed').length);
  inProgressTasksCount = computed(() => this.tasks().filter(t => t.status === 'In Progress').length);
  pendingTasksCount = computed(() => this.tasks().filter(t => t.status === 'To Do').length);
  
  overdueTasksCount = computed(() => {
    const now = Date.now();
    return this.tasks().filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < now).length;
  });

  completionPercentage = computed(() => {
    const total = this.totalTasksCount();
    return total > 0 ? Math.round((this.completedTasksCount() / total) * 100) : 0;
  });

  // Status Distribution for Donut Chart
  statusDistribution = computed<DistributionItem[]>(() => {
    const tasks = this.tasks();
    const total = tasks.length || 1;
    const completed = this.completedTasksCount();
    const inProgress = this.inProgressTasksCount();
    const todo = this.pendingTasksCount();

    return [
      { label: 'Completed', count: completed, percentage: Math.round((completed / total) * 100), color: '#10b981' },
      { label: 'In Progress', count: inProgress, percentage: Math.round((inProgress / total) * 100), color: '#f59e0b' },
      { label: 'To Do', count: todo, percentage: Math.round((todo / total) * 100), color: '#64748b' }
    ];
  });

  // Weekly Productivity Data for Bar Chart
  weeklyProductivityData = computed<WeekDayProductivity[]>(() => {
    const tasks = this.tasks();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: WeekDayProductivity[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const isoPrefix = d.toISOString().split('T')[0];
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const dayName = dayNames[d.getDay()];

      const completedCount = tasks.filter(t => 
        t.status === 'Completed' && t.completedAt && t.completedAt.startsWith(isoPrefix)
      ).length;

      const createdCount = tasks.filter(t => 
        t.createdAt && t.createdAt.startsWith(isoPrefix)
      ).length;

      days.push({
        day: dayName,
        dateLabel: `${monthName} ${dayNum}`,
        completedCount,
        createdCount
      });
    }

    return days;
  });

  totalWeeklyCompleted = computed(() => {
    return this.weeklyProductivityData().reduce((sum, d) => sum + d.completedCount, 0);
  });

  // Time-of-day greeting
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  // Formatted current date
  currentFormattedDate = computed(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  });

  // Filter on upcoming tasks (All vs High Priority)
  upcomingFilter = signal<'all' | 'high'>('all');

  filteredUpcomingTasks = computed(() => {
    const filter = this.upcomingFilter();
    const tasks = this.upcomingTasks();
    if (filter === 'high') {
      return tasks.filter(t => t.priority === 'High');
    }
    return tasks;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // 1. Subscribe to TaskService stream directly for real-time reactivity
    this.taskService.tasks$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tasksList => {
        this.tasks.set(tasksList);
      });

    // 2. Subscribe to DashboardService aggregated stream
    this.dashboardService.getDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload: DashboardPayload) => {
          this.upcomingTasks.set(payload.upcomingTasks);
          this.projects.set(payload.projects);
          this.activities.set(payload.activities);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.errorMessage.set(
            err?.message || 'Unable to load dashboard statistics. Please verify network connection.'
          );
          this.isLoading.set(false);
        }
      });
  }

  markTaskCompleted(taskId: string, title: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.taskService.updateTaskStatus(taskId, 'Completed').subscribe();
    this.dashboardService.addActivity('John Doe', 'marked task as Completed', title);
  }

  setUpcomingFilter(filter: 'all' | 'high'): void {
    this.upcomingFilter.set(filter);
  }

  getProjectStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'On Hold': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-danger';
      case 'Medium': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}

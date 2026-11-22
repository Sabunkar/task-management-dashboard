import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of, throwError } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { DashboardStats, ActivityItem, ActivityType } from '../models/dashboard.model';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { MockDataService } from './mock-data.service';
import { ActivityService } from './activity.service';
import { DashboardMetricCard, DashboardUpcomingTask } from '../../features/dashboard/dashboard.data';

export interface DashboardPayload {
  stats: DashboardStats;
  metrics: DashboardMetricCard[];
  taskBreakdown: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionPercentage: number;
  };
  upcomingTasks: DashboardUpcomingTask[];
  projects: Project[];
  activities: ActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private mockDataService = inject(MockDataService);
  private activityService = inject(ActivityService);

  // Centralized recent activities stream delegated to ActivityService
  readonly recentActivities$: Observable<ActivityItem[]> = this.activityService.activities$;

  // Flag for testing error state
  private simulateError = false;

  /**
   * Reactive dashboard statistics computed dynamically from Projects and Tasks
   */
  readonly stats$: Observable<DashboardStats> = combineLatest([
    this.projectService.projectsWithProgress$,
    this.taskService.tasks$
  ]).pipe(
    map(([projects, tasks]) => {
      const totalProjects = projects.length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
      const pendingTasks = tasks.filter(t => t.status === 'To Do').length;
      const completionPercentage = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 1000) / 10 
        : 0;

      return {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionPercentage
      };
    })
  );

  /**
   * Metric Cards stream mapped dynamically from stats
   */
  readonly metricCards$: Observable<DashboardMetricCard[]> = this.stats$.pipe(
    map(stats => [
      {
        id: 'projects',
        label: 'Total Projects',
        value: stats.totalProjects,
        icon: 'folder_open',
        color: '#4f46e5',
        bgColor: '#eef2ff',
        trend: `${stats.totalProjects} active`,
        trendDirection: 'up' as const,
        trendSubtext: 'current workspaces'
      },
      {
        id: 'tasks',
        label: 'Total Tasks',
        value: stats.totalTasks,
        icon: 'task_alt',
        color: '#0ea5e9',
        bgColor: '#f0f9ff',
        trend: `${stats.inProgressTasks} in progress`,
        trendDirection: 'up' as const,
        trendSubtext: 'active sprint backlog'
      },
      {
        id: 'completed',
        label: 'Completed Tasks',
        value: stats.completedTasks,
        icon: 'check_circle',
        color: '#10b981',
        bgColor: '#ecfdf5',
        trend: `${stats.completionPercentage}%`,
        trendDirection: 'up' as const,
        trendSubtext: 'completion rate'
      },
      {
        id: 'pending',
        label: 'Pending Tasks',
        value: stats.pendingTasks,
        icon: 'pending_actions',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        trend: `${stats.pendingTasks} to do`,
        trendDirection: stats.pendingTasks > 5 ? ('neutral' as const) : ('up' as const),
        trendSubtext: 'awaiting pickup'
      }
    ])
  );

  /**
   * Detailed breakdown for segmented progress visualization
   */
  readonly taskBreakdown$: Observable<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionPercentage: number;
  }> = this.stats$.pipe(
    map(stats => ({
      total: stats.totalTasks,
      completed: stats.completedTasks,
      inProgress: stats.inProgressTasks,
      todo: stats.pendingTasks,
      completionPercentage: stats.completionPercentage
    }))
  );

  /**
   * Upcoming deadlines stream computed dynamically from uncompleted tasks
   */
  readonly upcomingDeadlines$: Observable<DashboardUpcomingTask[]> = this.taskService.tasks$.pipe(
    map(tasks => {
      const now = new Date().getTime();
      return tasks
        .filter(t => t.status !== 'Completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
        .map(t => {
          const dueTime = new Date(t.dueDate).getTime();
          const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));

          let daysRemainingText = 'Due in ' + diffDays + ' days';
          let urgency: 'urgent' | 'warning' | 'normal' = 'normal';

          if (diffDays <= 0) {
            daysRemainingText = 'Due Today';
            urgency = 'urgent';
          } else if (diffDays === 1) {
            daysRemainingText = 'Due Tomorrow';
            urgency = 'warning';
          } else if (diffDays <= 3) {
            urgency = 'warning';
          }

          const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
          const formattedDate = new Date(t.dueDate).toLocaleDateString('en-US', options);

          return {
            id: t.id,
            title: t.title,
            projectName: t.projectName || 'General',
            dueDate: diffDays <= 0 ? 'Today, 5:00 PM' : formattedDate,
            daysRemainingText,
            urgency,
            priority: t.priority,
            status: t.status
          };
        });
    })
  );

  /**
   * Featured active projects stream with calculated progress
   */
  readonly featuredProjects$: Observable<Project[]> = this.projectService.projectsWithProgress$;

  /**
   * Aggregated data stream combining all sections into a single reactive payload
   */
  getDashboardData(): Observable<DashboardPayload> {
    if (this.simulateError) {
      return throwError(() => new Error('Simulated network error retrieving dashboard statistics.'));
    }

    return combineLatest([
      this.stats$,
      this.metricCards$,
      this.taskBreakdown$,
      this.upcomingDeadlines$,
      this.featuredProjects$,
      this.recentActivities$
    ]).pipe(
      map(([stats, metrics, taskBreakdown, upcomingTasks, projects, activities]) => ({
        stats,
        metrics,
        taskBreakdown,
        upcomingTasks,
        projects,
        activities
      }))
    );
  }

  /**
   * Record a new activity in the activity stream
   */
  addActivity(actor: string, action: string, target: string, type?: ActivityType, entityId?: string, entityType?: 'task' | 'project' | 'workspace'): void {
    this.activityService.recordActivity({
      user: actor,
      action,
      target,
      type,
      entityId,
      entityType
    });
  }

  /**
   * Utility for testing error state
   */
  setSimulateError(shouldError: boolean): void {
    this.simulateError = shouldError;
  }
}


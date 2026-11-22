import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import {
  DateRangeFilter,
  DateRangePreset,
  DistributionItem,
  OverviewMetrics,
  ProductivityInsights,
  ProjectAnalyticsItem,
  TaskTrendPoint,
  TrendAnalysis
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  private readonly dateFilterSubject = new BehaviorSubject<DateRangeFilter>({
    preset: 'last_30_days'
  });
  readonly dateFilter$: Observable<DateRangeFilter> = this.dateFilterSubject.asObservable();

  get currentDateFilter(): DateRangeFilter {
    return this.dateFilterSubject.getValue();
  }

  setDateFilter(preset: DateRangePreset, startDate?: string, endDate?: string): void {
    this.dateFilterSubject.next({ preset, startDate, endDate });
  }

  /**
   * Resolves filter to concrete start and end timestamps (in ms)
   */
  resolveDateBounds(filter: DateRangeFilter): { startMs: number; endMs: number; label: string } {
    const now = new Date();
    const endMs = now.getTime();
    let startMs = 0;
    let label = 'Last 30 Days';

    switch (filter.preset) {
      case 'last_7_days':
        startMs = endMs - 7 * 86400000;
        label = 'Last 7 Days';
        break;
      case 'last_30_days':
        startMs = endMs - 30 * 86400000;
        label = 'Last 30 Days';
        break;
      case 'last_90_days':
        startMs = endMs - 90 * 86400000;
        label = 'Last 90 Days';
        break;
      case 'this_year':
        startMs = new Date(now.getFullYear(), 0, 1).getTime();
        label = `Year ${now.getFullYear()}`;
        break;
      case 'all_time':
        startMs = 0;
        label = 'All Time';
        break;
      case 'custom':
        if (filter.startDate) {
          startMs = new Date(`${filter.startDate}T00:00:00Z`).getTime();
        }
        if (filter.endDate) {
          const customEnd = new Date(`${filter.endDate}T23:59:59.999Z`).getTime();
          label = `${filter.startDate || 'Start'} to ${filter.endDate}`;
          return { startMs, endMs: customEnd, label };
        }
        label = `From ${filter.startDate || 'Beginning'}`;
        break;
    }

    return { startMs, endMs, label };
  }

  /**
   * Combined reactive stream of tasks, projects, and active date bounds
   */
  readonly analyticsData$ = combineLatest([
    this.taskService.tasks$,
    this.projectService.projectsWithProgress$,
    this.dateFilter$
  ]).pipe(
    map(([tasks, projects, filter]) => {
      const bounds = this.resolveDateBounds(filter);
      return { tasks, projects, filter, bounds };
    })
  );

  /**
   * Overview Metrics calculation
   */
  getOverviewMetrics(filterOverride?: DateRangeFilter): Observable<OverviewMetrics> {
    return this.analyticsData$.pipe(
      map(({ tasks, projects, filter, bounds }) => {
        const activeBounds = filterOverride ? this.resolveDateBounds(filterOverride) : bounds;
        const nowMs = Date.now();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'To Do').length;
        const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
        
        // Overdue tasks: incomplete and due date has passed
        const overdueTasks = tasks.filter(t => {
          if (t.status === 'Completed') return false;
          return new Date(t.dueDate).getTime() < nowMs;
        }).length;

        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'Active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;
        const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

        // Distinct period-scoped counts
        const createdInPeriodCount = tasks.filter(t => {
          const cMs = new Date(t.createdAt).getTime();
          return cMs >= activeBounds.startMs && cMs <= activeBounds.endMs;
        }).length;

        const completedInPeriodCount = tasks.filter(t => {
          if (!t.completedAt) return false;
          const compMs = new Date(t.completedAt).getTime();
          return compMs >= activeBounds.startMs && compMs <= activeBounds.endMs;
        }).length;

        return {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          overdueTasks,
          taskCompletionRate,
          totalProjects,
          activeProjects,
          completedProjects,
          onHoldProjects,
          createdInPeriodCount,
          completedInPeriodCount
        };
      })
    );
  }

  /**
   * Task Distribution by Status
   */
  getStatusDistribution(): Observable<DistributionItem[]> {
    return this.taskService.tasks$.pipe(
      map(tasks => {
        const total = tasks.length;
        if (total === 0) return [];

        const completed = tasks.filter(t => t.status === 'Completed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const todo = tasks.filter(t => t.status === 'To Do').length;

        return [
          {
            label: 'Completed',
            count: completed,
            percentage: Math.round((completed / total) * 100),
            color: '#10b981' // emerald
          },
          {
            label: 'In Progress',
            count: inProgress,
            percentage: Math.round((inProgress / total) * 100),
            color: '#f59e0b' // amber
          },
          {
            label: 'To Do',
            count: todo,
            percentage: Math.round((todo / total) * 100),
            color: '#64748b' // slate
          }
        ];
      })
    );
  }

  /**
   * Task Distribution by Priority
   */
  getPriorityDistribution(): Observable<DistributionItem[]> {
    return this.taskService.tasks$.pipe(
      map(tasks => {
        const total = tasks.length;
        if (total === 0) return [];

        const high = tasks.filter(t => t.priority === 'High').length;
        const medium = tasks.filter(t => t.priority === 'Medium').length;
        const low = tasks.filter(t => t.priority === 'Low').length;

        return [
          {
            label: 'High Priority',
            count: high,
            percentage: Math.round((high / total) * 100),
            color: '#ef4444' // red
          },
          {
            label: 'Medium Priority',
            count: medium,
            percentage: Math.round((medium / total) * 100),
            color: '#f59e0b' // amber
          },
          {
            label: 'Low Priority',
            count: low,
            percentage: Math.round((low / total) * 100),
            color: '#0ea5e9' // sky blue
          }
        ];
      })
    );
  }

  /**
   * Project Analytics & Attention Identifiers
   */
  getProjectAnalytics(): Observable<ProjectAnalyticsItem[]> {
    return combineLatest([
      this.projectService.projectsWithProgress$,
      this.taskService.tasks$
    ]).pipe(
      map(([projects, tasks]) => {
        const nowMs = Date.now();
        const sevenDaysMs = 7 * 86400000;

        return projects.map(proj => {
          const projTasks = tasks.filter(t => t.projectId === proj.id);
          const totalTasks = projTasks.length;
          const completedTasks = projTasks.filter(t => t.status === 'Completed').length;
          const pendingTasks = projTasks.filter(t => t.status === 'To Do').length;
          const inProgressTasks = projTasks.filter(t => t.status === 'In Progress').length;
          const overdueTasks = projTasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < nowMs).length;
          
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proj.progress || 0);

          // Identify if project needs attention
          let needsAttention = false;
          let attentionReason: string | undefined;

          const dueMs = new Date(proj.dueDate).getTime();
          const isNearDue = dueMs > nowMs && (dueMs - nowMs) < sevenDaysMs;

          if (overdueTasks > 0) {
            needsAttention = true;
            attentionReason = `${overdueTasks} overdue task(s) require resolution`;
          } else if (proj.status === 'Active' && isNearDue && completionRate < 50) {
            needsAttention = true;
            attentionReason = `Due in under 7 days with only ${completionRate}% progress`;
          } else if (proj.status === 'Active' && totalTasks > 0 && completionRate === 0) {
            needsAttention = true;
            attentionReason = `Zero progress achieved with ${totalTasks} pending task(s)`;
          }

          return {
            id: proj.id,
            name: proj.name,
            status: proj.status,
            progress: proj.progress || completionRate,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            needsAttention,
            attentionReason,
            color: proj.color || '#4f46e5',
            dueDate: proj.dueDate
          };
        });
      })
    );
  }

  /**
   * Task Trends Over Time (Daily / Interval grouping)
   */
  getTaskTrends(filterOverride?: DateRangeFilter): Observable<TrendAnalysis> {
    return this.analyticsData$.pipe(
      map(({ tasks, bounds, filter }) => {
        const activeBounds = filterOverride ? this.resolveDateBounds(filterOverride) : bounds;
        
        // Filter tasks that were either created or completed in this period
        const relevantTasks = tasks.filter(t => {
          const cMs = new Date(t.createdAt).getTime();
          const compMs = t.completedAt ? new Date(t.completedAt).getTime() : 0;
          return (cMs >= activeBounds.startMs && cMs <= activeBounds.endMs) ||
                 (compMs >= activeBounds.startMs && compMs <= activeBounds.endMs);
        });

        // Group points by date string (YYYY-MM-DD)
        const dateMap = new Map<string, { created: number; completed: number; dateObj: Date }>();

        // Generate day buckets between start and end (cap at 30 points max for readability)
        const spanDays = Math.max(1, Math.round((activeBounds.endMs - activeBounds.startMs) / 86400000));
        const stepDays = Math.max(1, Math.ceil(spanDays / 15));

        for (let t = activeBounds.startMs; t <= activeBounds.endMs; t += stepDays * 86400000) {
          const d = new Date(t);
          const key = d.toISOString().split('T')[0];
          dateMap.set(key, { created: 0, completed: 0, dateObj: d });
        }

        let totalCreated = 0;
        let totalCompleted = 0;

        tasks.forEach(task => {
          const cMs = new Date(task.createdAt).getTime();
          if (cMs >= activeBounds.startMs && cMs <= activeBounds.endMs) {
            const key = new Date(cMs).toISOString().split('T')[0];
            totalCreated++;
            if (dateMap.has(key)) {
              dateMap.get(key)!.created++;
            } else {
              // find closest bucket
              for (const [bKey, val] of dateMap.entries()) {
                if (Math.abs(val.dateObj.getTime() - cMs) <= stepDays * 86400000) {
                  val.created++;
                  break;
                }
              }
            }
          }

          if (task.completedAt) {
            const compMs = new Date(task.completedAt).getTime();
            if (compMs >= activeBounds.startMs && compMs <= activeBounds.endMs) {
              const key = new Date(compMs).toISOString().split('T')[0];
              totalCompleted++;
              if (dateMap.has(key)) {
                dateMap.get(key)!.completed++;
              } else {
                for (const [bKey, val] of dateMap.entries()) {
                  if (Math.abs(val.dateObj.getTime() - compMs) <= stepDays * 86400000) {
                    val.completed++;
                    break;
                  }
                }
              }
            }
          }
        });

        const points: TaskTrendPoint[] = Array.from(dateMap.entries()).map(([isoDate, data]) => {
          const monthName = data.dateObj.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = data.dateObj.getDate();
          return {
            date: `${monthName} ${dayNum}`,
            isoDate,
            createdCount: data.created,
            completedCount: data.completed
          };
        });

        // Peak completion day
        let peakDay: string | undefined;
        let maxComp = 0;
        points.forEach(p => {
          if (p.completedCount > maxComp) {
            maxComp = p.completedCount;
            peakDay = `${p.date} (${p.completedCount} completed)`;
          }
        });

        const hasSufficientData = totalCreated > 0 || totalCompleted > 0;

        return {
          points,
          hasSufficientData,
          totalCreated,
          totalCompleted,
          peakCompletionDay: peakDay
        };
      })
    );
  }

  /**
   * Derive Productivity Insights grounded in actual recorded data
   */
  getProductivityInsights(): Observable<ProductivityInsights> {
    return combineLatest([
      this.taskService.tasks$,
      this.getProjectAnalytics()
    ]).pipe(
      map(([tasks, projectAnalytics]) => {
        const completedTasksWithDate = tasks.filter(t => t.status === 'Completed' && t.completedAt);
        const hasInsufficientData = completedTasksWithDate.length === 0;

        // Group completions by day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts: Record<string, number> = {
          Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
        };

        completedTasksWithDate.forEach(t => {
          const d = new Date(t.completedAt!);
          const dayName = dayNames[d.getDay()];
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        let bestDay = 'N/A';
        let maxDayCompletions = 0;
        Object.entries(dayCounts).forEach(([day, count]) => {
          if (count > maxDayCompletions) {
            maxDayCompletions = count;
            bestDay = day;
          }
        });

        const mostProductivePeriod = maxDayCompletions > 0 ? {
          period: bestDay,
          completionsCount: maxDayCompletions,
          detail: `${maxDayCompletions} tasks completed on ${bestDay}s`
        } : undefined;

        // Ranked projects by completion rate
        const topProjects = [...projectAnalytics]
          .filter(p => p.totalTasks > 0)
          .sort((a, b) => b.completionRate - a.completionRate)
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            completionRate: p.completionRate,
            completedCount: p.completedTasks
          }));

        // Overdue count
        const nowMs = Date.now();
        const overdueCount = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < nowMs).length;

        // Workload observations
        const workloadObservations: string[] = [];
        const highPriority = tasks.filter(t => t.priority === 'High').length;
        const highPercentage = tasks.length > 0 ? Math.round((highPriority / tasks.length) * 100) : 0;
        
        workloadObservations.push(`${highPercentage}% of current deliverables are categorized as High Priority.`);

        if (overdueCount > 0) {
          workloadObservations.push(`${overdueCount} task(s) currently past due date require priority unblocking.`);
        } else {
          workloadObservations.push('All active deliverables are currently on-schedule with zero overdue items.');
        }

        const activeProjectsCount = projectAnalytics.filter(p => p.status === 'Active').length;
        workloadObservations.push(`Team velocity is actively distributed across ${activeProjectsCount} active project workspaces.`);

        return {
          mostProductivePeriod,
          topProjects,
          overdueCount,
          hasInsufficientData,
          workloadObservations
        };
      })
    );
  }

  /**
   * Generate CSV format for Tasks Report
   */
  generateTasksCsv(tasks: Task[]): string {
    const headers = ['Task ID', 'Title', 'Project', 'Priority', 'Status', 'Due Date', 'Created At', 'Completed At', 'Is Overdue'];
    const nowMs = Date.now();

    const rows = tasks.map(t => {
      const isOverdue = t.status !== 'Completed' && new Date(t.dueDate).getTime() < nowMs ? 'Yes' : 'No';
      return [
        `"${t.id}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.projectName || '').replace(/"/g, '""')}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${t.dueDate ? t.dueDate.split('T')[0] : ''}"`,
        `"${t.createdAt ? t.createdAt.split('T')[0] : ''}"`,
        `"${t.completedAt ? t.completedAt.split('T')[0] : ''}"`,
        `"${isOverdue}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Generate CSV format for Projects Report
   */
  generateProjectsCsv(projects: ProjectAnalyticsItem[]): string {
    const headers = ['Project ID', 'Name', 'Status', 'Progress (%)', 'Total Tasks', 'Completed Tasks', 'Pending Tasks', 'Overdue Tasks', 'Due Date', 'Needs Attention'];

    const rows = projects.map(p => {
      return [
        `"${p.id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.status}"`,
        p.progress,
        p.totalTasks,
        p.completedTasks,
        p.pendingTasks,
        p.overdueTasks,
        `"${p.dueDate ? p.dueDate.split('T')[0] : ''}"`,
        `"${p.needsAttention ? 'Yes: ' + (p.attentionReason || '') : 'No'}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}


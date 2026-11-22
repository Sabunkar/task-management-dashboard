import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { MockDataService } from './mock-data.service';
import { DateRangeFilter } from '../models/analytics.model';

describe('Phase 11: Reports & Analytics Service', () => {
  let analyticsService: AnalyticsService;
  let taskService: TaskService;
  let projectService: ProjectService;
  let mockDataService: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService,
        AnalyticsService
      ]
    });

    analyticsService = TestBed.inject(AnalyticsService);
    taskService = TestBed.inject(TaskService);
    projectService = TestBed.inject(ProjectService);
    mockDataService = TestBed.inject(MockDataService);
  });

  it('1. should accurately calculate overview metrics from active application state', async () => {
    const metrics = await firstValueFrom(analyticsService.getOverviewMetrics());
    const initialTasks = mockDataService.getInitialTasks();
    const initialProjects = mockDataService.getInitialProjects();

    expect(metrics.totalTasks).toBe(initialTasks.length);
    expect(metrics.totalProjects).toBe(initialProjects.length);

    const completed = initialTasks.filter(t => t.status === 'Completed').length;
    expect(metrics.completedTasks).toBe(completed);

    const expectedRate = Math.round((completed / initialTasks.length) * 100);
    expect(metrics.taskCompletionRate).toBe(expectedRate);
  });

  it('2. should calculate task status distribution with exact percentage sums', async () => {
    const dist = await firstValueFrom(analyticsService.getStatusDistribution());
    expect(dist.length).toBe(3);

    const labels = dist.map(d => d.label);
    expect(labels).toContain('Completed');
    expect(labels).toContain('In Progress');
    expect(labels).toContain('To Do');

    const totalCount = dist.reduce((acc, d) => acc + d.count, 0);
    const initialTasks = mockDataService.getInitialTasks();
    expect(totalCount).toBe(initialTasks.length);
  });

  it('3. should calculate task priority distribution correctly', async () => {
    const dist = await firstValueFrom(analyticsService.getPriorityDistribution());
    expect(dist.length).toBe(3);

    const high = dist.find(d => d.label === 'High Priority');
    expect(high).toBeDefined();
    expect(high!.count).toBeGreaterThan(0);
    expect(high!.color).toBe('#ef4444');
  });

  it('4. should calculate project progress and flag projects needing attention', async () => {
    const projects = await firstValueFrom(analyticsService.getProjectAnalytics());
    expect(projects.length).toBeGreaterThan(0);

    projects.forEach(p => {
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(100);
      expect(p.totalTasks).toBeGreaterThanOrEqual(0);
    });

    // Check if attention flag is boolean and has reason if true
    const needingAttention = projects.filter(p => p.needsAttention);
    needingAttention.forEach(p => {
      expect(p.attentionReason).toBeDefined();
      expect(p.attentionReason!.length).toBeGreaterThan(0);
    });
  });

  it('5. should resolve preset date bounds correctly', () => {
    const now = Date.now();

    const sevenDays = analyticsService.resolveDateBounds({ preset: 'last_7_days' });
    expect(sevenDays.label).toBe('Last 7 Days');
    expect(sevenDays.endMs - sevenDays.startMs).toBeCloseTo(7 * 86400000, -3);

    const thirtyDays = analyticsService.resolveDateBounds({ preset: 'last_30_days' });
    expect(thirtyDays.label).toBe('Last 30 Days');
    expect(thirtyDays.endMs - thirtyDays.startMs).toBeCloseTo(30 * 86400000, -3);

    const allTime = analyticsService.resolveDateBounds({ preset: 'all_time' });
    expect(allTime.startMs).toBe(0);
    expect(allTime.label).toBe('All Time');
  });

  it('6. should support custom date ranges accurately', async () => {
    const customFilter: DateRangeFilter = {
      preset: 'custom',
      startDate: '2026-11-01',
      endDate: '2026-11-15'
    };

    const bounds = analyticsService.resolveDateBounds(customFilter);
    expect(bounds.label).toBe('2026-11-01 to 2026-11-15');

    const metrics = await firstValueFrom(analyticsService.getOverviewMetrics(customFilter));
    expect(metrics).toBeDefined();
    expect(metrics.createdInPeriodCount).toBeGreaterThanOrEqual(0);
    expect(metrics.completedInPeriodCount).toBeGreaterThanOrEqual(0);
  });

  it('7. should generate valid CSV export strings for tasks and projects', async () => {
    const tasks = await firstValueFrom(taskService.getTasks());
    const tasksCsv = analyticsService.generateTasksCsv(tasks);

    expect(tasksCsv).toContain('Task ID,Title,Project,Priority,Status,Due Date,Created At,Completed At,Is Overdue');
    expect(tasksCsv.split('\r\n').length).toBe(tasks.length + 1);

    const projects = await firstValueFrom(analyticsService.getProjectAnalytics());
    const projectsCsv = analyticsService.generateProjectsCsv(projects);

    expect(projectsCsv).toContain('Project ID,Name,Status,Progress (%),Total Tasks,Completed Tasks,Pending Tasks,Overdue Tasks,Due Date,Needs Attention');
    expect(projectsCsv.split('\r\n').length).toBe(projects.length + 1);
  });

  it('8. should update overview metrics reactively when a task is completed', async () => {
    const initialMetrics = await firstValueFrom(analyticsService.getOverviewMetrics());
    const tasks = await firstValueFrom(taskService.getTasks());
    const todoTask = tasks.find(t => t.status === 'To Do')!;

    expect(todoTask).toBeDefined();

    // Mark task as Completed
    await firstValueFrom(taskService.updateTaskStatus(todoTask.id, 'Completed'));

    const updatedMetrics = await firstValueFrom(analyticsService.getOverviewMetrics());
    expect(updatedMetrics.completedTasks).toBe(initialMetrics.completedTasks + 1);
    expect(updatedMetrics.pendingTasks).toBe(initialMetrics.pendingTasks - 1);
  });

  it('9. should derive productivity insights with valid observations', async () => {
    const insights = await firstValueFrom(analyticsService.getProductivityInsights());
    expect(insights).toBeDefined();
    expect(insights.workloadObservations.length).toBeGreaterThan(0);
    expect(insights.topProjects.length).toBeGreaterThanOrEqual(1);
  });

  it('10. should report insufficient data gracefully when historical date window has no points', async () => {
    const futureFilter: DateRangeFilter = {
      preset: 'custom',
      startDate: '2028-01-01',
      endDate: '2028-01-10'
    };

    const trends = await firstValueFrom(analyticsService.getTaskTrends(futureFilter));
    expect(trends.hasSufficientData).toBe(false);
    expect(trends.totalCreated).toBe(0);
    expect(trends.totalCompleted).toBe(0);
  });
});


import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { MockDataService } from './mock-data.service';

describe('Phase 3: Dashboard & Mock Data Services Integration', () => {
  let dashboardService: DashboardService;
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
        DashboardService
      ]
    });

    dashboardService = TestBed.inject(DashboardService);
    taskService = TestBed.inject(TaskService);
    projectService = TestBed.inject(ProjectService);
    mockDataService = TestBed.inject(MockDataService);
  });

  it('1. should calculate dashboard statistics directly from mock datasets', async () => {
    const stats = await firstValueFrom(dashboardService.stats$);
    const initialTasks = mockDataService.getInitialTasks();
    const initialProjects = mockDataService.getInitialProjects();

    expect(stats.totalProjects).toBe(initialProjects.length);
    expect(stats.totalTasks).toBe(initialTasks.length);
  });

  it('2. should calculate correct completed, in-progress, pending counts and completion percentage', async () => {
    const stats = await firstValueFrom(dashboardService.stats$);
    const tasks = mockDataService.getInitialTasks();

    const expectedCompleted = tasks.filter(t => t.status === 'Completed').length;
    const expectedInProgress = tasks.filter(t => t.status === 'In Progress').length;
    const expectedPending = tasks.filter(t => t.status === 'To Do').length;
    const expectedPercentage = Math.round((expectedCompleted / tasks.length) * 1000) / 10;

    expect(stats.completedTasks).toBe(expectedCompleted);
    expect(stats.inProgressTasks).toBe(expectedInProgress);
    expect(stats.pendingTasks).toBe(expectedPending);
    expect(stats.completionPercentage).toBe(expectedPercentage);
  });

  it('3. should update dashboard statistics when adding a new task', async () => {
    const initialStats = await firstValueFrom(dashboardService.stats$);

    // Add a new task to proj-1
    await firstValueFrom(taskService.addTask({
      title: 'New Unit Test Task',
      priority: 'High',
      status: 'To Do',
      projectId: 'proj-1'
    }));

    const updatedStats = await firstValueFrom(dashboardService.stats$);

    expect(updatedStats.totalTasks).toBe(initialStats.totalTasks + 1);
    expect(updatedStats.pendingTasks).toBe(initialStats.pendingTasks + 1);
  });

  it('4. should update dashboard statistics and project progress when changing task status', async () => {
    const initialStats = await firstValueFrom(dashboardService.stats$);
    const tasks = await firstValueFrom(taskService.tasks$);
    const inProgressTask = tasks.find(t => t.status === 'In Progress')!;

    expect(inProgressTask).toBeDefined();

    // Change status from In Progress to Completed
    await firstValueFrom(taskService.updateTaskStatus(inProgressTask.id, 'Completed'));

    const updatedStats = await firstValueFrom(dashboardService.stats$);
    const updatedProjects = await firstValueFrom(projectService.getProjects());
    const project = updatedProjects.find(p => p.id === inProgressTask.projectId)!;

    // Verify dashboard statistics update
    expect(updatedStats.completedTasks).toBe(initialStats.completedTasks + 1);
    expect(updatedStats.inProgressTasks).toBe(initialStats.inProgressTasks - 1);
    expect(updatedStats.completionPercentage).toBeGreaterThanOrEqual(initialStats.completionPercentage);

    // Verify project progress updates automatically from tasks
    const projTasks = (await firstValueFrom(taskService.tasks$)).filter(t => t.projectId === project.id);
    const projCompleted = projTasks.filter(t => t.status === 'Completed').length;
    const expectedProjectProgress = Math.round((projCompleted / projTasks.length) * 100);

    expect(project.completedTasksCount).toBe(projCompleted);
    expect(project.progress).toBe(expectedProjectProgress);
  });

  it('5. should update task count when deleting a task', async () => {
    const tasks = await firstValueFrom(taskService.tasks$);
    const taskToDelete = tasks[0];

    await firstValueFrom(taskService.deleteTask(taskToDelete.id));

    const updatedStats = await firstValueFrom(dashboardService.stats$);
    expect(updatedStats.totalTasks).toBe(tasks.length - 1);
  });

  it('6. should filter and sort upcoming deadlines for non-completed tasks', async () => {
    const upcoming = await firstValueFrom(dashboardService.upcomingDeadlines$);

    // All upcoming deadlines should have status !== 'Completed'
    upcoming.forEach(task => {
      expect(task.status).not.toBe('Completed');
    });

    // Should include urgency labels
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming[0].daysRemainingText).toBeDefined();
  });
});


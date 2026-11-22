import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskService } from './task.service';
import { MockDataService } from './mock-data.service';
import { Task } from '../models/task.model';

describe('Phase 5: Task Management Service & CRUD Operations', () => {
  let taskService: TaskService;
  let mockDataService: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MockDataService, 
        TaskService
      ]
    });

    taskService = TestBed.inject(TaskService);
    mockDataService = TestBed.inject(MockDataService);
  });

  it('1. should retrieve all tasks matching the initial mock dataset', async () => {
    const tasks = await firstValueFrom(taskService.getTasks());
    const initial = mockDataService.getInitialTasks();

    expect(tasks.length).toBe(initial.length);
  });

  it('2. should add a new task with dynamic ID and update the reactive stream', async () => {
    const initialTasks = await firstValueFrom(taskService.getTasks());

    const newTask = await firstValueFrom(taskService.addTask({
      title: 'Optimize Core Web Vitals LCP',
      description: 'Preload hero banners and minimize blocking CSS render paths.',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign',
      priority: 'High',
      status: 'To Do'
    }));

    expect(newTask.id).toMatch(/^task-\d+/);
    expect(newTask.title).toBe('Optimize Core Web Vitals LCP');

    const updatedTasks = await firstValueFrom(taskService.getTasks());
    expect(updatedTasks.length).toBe(initialTasks.length + 1);
    expect(updatedTasks[0].id).toBe(newTask.id);
  });

  it('3. should update an existing task and reflect changes immediately', async () => {
    const tasks = await firstValueFrom(taskService.getTasks());
    const target = tasks[0];

    const updated = await firstValueFrom(taskService.updateTask({
      ...target,
      title: 'Updated Task Title via Unit Test',
      priority: 'High',
      status: 'In Progress'
    }));

    expect(updated.title).toBe('Updated Task Title via Unit Test');
    expect(updated.updatedAt).toBeDefined();

    const fetched = await firstValueFrom(taskService.getTaskById(target.id));
    expect(fetched?.title).toBe('Updated Task Title via Unit Test');
    expect(fetched?.priority).toBe('High');
  });

  it('4. should delete a task and update the task stream', async () => {
    const tasks = await firstValueFrom(taskService.getTasks());
    const toDelete = tasks[0];

    const success = await firstValueFrom(taskService.deleteTask(toDelete.id));
    expect(success).toBe(true);

    const remaining = await firstValueFrom(taskService.getTasks());
    expect(remaining.length).toBe(tasks.length - 1);
    expect(remaining.some(t => t.id === toDelete.id)).toBe(false);
  });

  it('5. should quick-update task status using updateTaskStatus()', async () => {
    const tasks = await firstValueFrom(taskService.getTasks());
    const todoTask = tasks.find(t => t.status === 'To Do')!;

    expect(todoTask).toBeDefined();

    const updated = await firstValueFrom(taskService.updateTaskStatus(todoTask.id, 'Completed'));
    expect(updated?.status).toBe('Completed');

    const verified = await firstValueFrom(taskService.getTaskById(todoTask.id));
    expect(verified?.status).toBe('Completed');
  });

  it('6. should filter tasks by search term across title and description', async () => {
    const filtered = await firstValueFrom(taskService.filterTasks({
      searchTerm: 'REST API'
    }));

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(task => {
      const match = task.title.toLowerCase().includes('rest api') ||
                    task.description.toLowerCase().includes('rest api');
      expect(match).toBe(true);
    });
  });

  it('7. should filter tasks by priority and status', async () => {
    const filtered = await firstValueFrom(taskService.filterTasks({
      priority: 'High',
      status: 'In Progress'
    }));

    filtered.forEach(task => {
      expect(task.priority).toBe('High');
      expect(task.status).toBe('In Progress');
    });
  });

  it('8. should sort tasks by priority descending (High -> Medium -> Low)', async () => {
    const sorted = await firstValueFrom(taskService.filterTasks({
      sortBy: 'priority',
      sortOrder: 'desc'
    }));

    const weights = { High: 3, Medium: 2, Low: 1 };
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(weights[sorted[i].priority]).toBeGreaterThanOrEqual(weights[sorted[i + 1].priority]);
    }
  });

  it('9. should retrieve tasks belonging to a specific project', async () => {
    const projTasks = await firstValueFrom(taskService.getTasksByProject('proj-1'));

    expect(projTasks.length).toBeGreaterThan(0);
    projTasks.forEach(task => {
      expect(task.projectId).toBe('proj-1');
    });
  });

  it('10. should filter tasks by due date range (dueDateFrom and dueDateTo)', async () => {
    const allTasks = await firstValueFrom(taskService.getTasks());
    const sortedDates = allTasks.map(t => t.dueDate.split('T')[0]).sort();
    const fromDate = sortedDates[0];
    const toDate = sortedDates[Math.floor(sortedDates.length / 2)];

    const filtered = await firstValueFrom(taskService.filterTasks({
      dueDateFrom: fromDate,
      dueDateTo: toDate
    }));

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(task => {
      const taskDate = task.dueDate.split('T')[0];
      expect(taskDate >= fromDate).toBe(true);
      expect(taskDate <= toDate).toBe(true);
    });
  });

  it('11. should filter overdue tasks that are not completed', async () => {
    // Add an intentionally overdue task
    await firstValueFrom(taskService.addTask({
      title: 'Emergency Patch for Legacy API',
      description: 'Fix SSL certificate validation issue in legacy API proxy.',
      projectId: 'proj-1',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2020-01-01'
    }));

    const overdueTasks = await firstValueFrom(taskService.filterTasks({
      onlyOverdue: true
    }));

    expect(overdueTasks.length).toBeGreaterThan(0);
    overdueTasks.forEach(task => {
      expect(task.status).not.toBe('Completed');
      expect(new Date(task.dueDate).getTime()).toBeLessThan(Date.now());
    });
  });
});


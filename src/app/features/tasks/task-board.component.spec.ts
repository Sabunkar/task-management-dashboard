import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskBoardComponent } from './task-board.component';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Task } from '../../core/models/task.model';

describe('Phase 6: Interactive Kanban Board', () => {
  let component: TaskBoardComponent;
  let taskService: TaskService;
  let dashboardService: DashboardService;
  let projectService: ProjectService;
  let mockDataService: MockDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService,
        DashboardService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    dashboardService = TestBed.inject(DashboardService);
    projectService = TestBed.inject(ProjectService);
    mockDataService = TestBed.inject(MockDataService);

    component.ngOnInit();
  });

  it('1. should group tasks correctly into To Do, In Progress, and Completed columns', async () => {
    const allTasks = await firstValueFrom(taskService.getTasks());
    const expectedTodo = allTasks.filter(t => t.status === 'To Do');
    const expectedInProgress = allTasks.filter(t => t.status === 'In Progress');
    const expectedCompleted = allTasks.filter(t => t.status === 'Completed');

    expect(component.todoTasks().length).toBe(expectedTodo.length);
    expect(component.inProgressTasks().length).toBe(expectedInProgress.length);
    expect(component.completedTasks().length).toBe(expectedCompleted.length);
  });

  it('2. should move a task from To Do to In Progress and update TaskService reactively', async () => {
    const todoTasks = component.todoTasks();
    const taskToMove = todoTasks[0];
    expect(taskToMove).toBeDefined();

    // Simulate CDK DragDrop transfer between columns
    const fakeDropEvent: any = {
      previousContainer: { id: 'todoList', data: component.todoTasks() },
      container: { id: 'inProgressList', data: component.inProgressTasks() },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: taskToMove }
    };

    component.onTaskDrop(fakeDropEvent, 'In Progress');

    // Verify task status was updated in TaskService
    const updated = await firstValueFrom(taskService.getTaskById(taskToMove.id));
    expect(updated?.status).toBe('In Progress');

    // Verify dashboard statistics reflect the transition
    const stats = await firstValueFrom(dashboardService.stats$);
    expect(stats.inProgressTasks).toBeGreaterThan(0);
  });

  it('3. should reorder tasks within the same column and maintain order', async () => {
    const todoTasks = [...component.todoTasks()];
    if (todoTasks.length >= 2) {
      const firstTask = todoTasks[0];
      const secondTask = todoTasks[1];

      // Simulate reorder within the same container
      const columnContainer = { id: 'todoList', data: todoTasks };
      const fakeReorderEvent: any = {
        previousContainer: columnContainer,
        container: columnContainer,
        previousIndex: 0,
        currentIndex: 1,
        item: { data: firstTask }
      };

      component.onTaskDrop(fakeReorderEvent, 'To Do');

      const reordered = component.todoTasks();
      expect(reordered[0].id).toBe(secondTask.id);
      expect(reordered[1].id).toBe(firstTask.id);
    }
  });

  it('4. should filter tasks by search term on the Kanban board', () => {
    component.onSearchChange('REST API');

    const filtered = component.filteredTasks();
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(task => {
      const match = task.title.toLowerCase().includes('rest api') ||
                    task.description.toLowerCase().includes('rest api');
      expect(match).toBe(true);
    });
  });

  it('5. should filter tasks by project on the Kanban board', () => {
    component.setProjectFilter('proj-1');

    const filtered = component.filteredTasks();
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(task => {
      expect(task.projectId).toBe('proj-1');
    });
  });

  it('6. should filter tasks by priority on the Kanban board', () => {
    component.setPriorityFilter('High');

    const filtered = component.filteredTasks();
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(task => {
      expect(task.priority).toBe('High');
    });
  });

  it('7. should create a task from the Kanban board with preselected status', async () => {
    const initialTasks = await firstValueFrom(taskService.getTasks());

    component.openCreateModal('In Progress');
    expect(component.taskForm.get('status')?.value).toBe('In Progress');

    component.taskForm.patchValue({
      title: 'Kanban Integration Deliverable',
      description: 'Test agile sprint task creation from board column header.',
      projectId: 'proj-1'
    });

    component.saveTask();

    const updatedTasks = await firstValueFrom(taskService.getTasks());
    expect(updatedTasks.length).toBe(initialTasks.length + 1);

    const created = updatedTasks[0];
    expect(created.title).toBe('Kanban Integration Deliverable');
    expect(created.status).toBe('In Progress');
  });
});

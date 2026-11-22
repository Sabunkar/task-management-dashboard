import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { MockDataService } from './mock-data.service';

describe('Phase 4: Project Management CRUD & Reactive Progress', () => {
  let projectService: ProjectService;
  let taskService: TaskService;
  let mockDataService: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService
      ]
    });

    projectService = TestBed.inject(ProjectService);
    taskService = TestBed.inject(TaskService);
    mockDataService = TestBed.inject(MockDataService);
  });

  it('1. should retrieve all projects with reactive progress calculation', async () => {
    const projects = await firstValueFrom(projectService.getProjects());
    const initialProjects = mockDataService.getInitialProjects();

    expect(projects.length).toBe(initialProjects.length);
    projects.forEach(project => {
      expect(project.tasksCount).toBeDefined();
      expect(project.completedTasksCount).toBeDefined();
      expect(project.progress).toBeGreaterThanOrEqual(0);
      expect(project.progress).toBeLessThanOrEqual(100);
    });
  });

  it('2. should retrieve a project by its unique ID', async () => {
    const projects = await firstValueFrom(projectService.getProjects());
    const target = projects[0];

    const found = await firstValueFrom(projectService.getProjectById(target.id));
    expect(found).toBeDefined();
    expect(found?.name).toBe(target.name);
  });

  it('3. should add a new project and update the projects stream', async () => {
    const initialProjects = await firstValueFrom(projectService.getProjects());

    const created = await firstValueFrom(projectService.addProject({
      name: 'Cloudflare Edge Worker Platform',
      description: 'Distributed serverless compute and edge KV storage architecture.',
      status: 'Active',
      color: '#f59e0b'
    }));

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Cloudflare Edge Worker Platform');

    const updatedProjects = await firstValueFrom(projectService.getProjects());
    expect(updatedProjects.length).toBe(initialProjects.length + 1);
    expect(updatedProjects.some(p => p.id === created.id)).toBe(true);
  });

  it('4. should update an existing project details', async () => {
    const projects = await firstValueFrom(projectService.getProjects());
    const projectToUpdate = projects[0];

    const updated = await firstValueFrom(projectService.updateProject({
      ...projectToUpdate,
      name: 'Pulse SaaS Enterprise Redesign v2',
      status: 'Completed'
    }));

    expect(updated.name).toBe('Pulse SaaS Enterprise Redesign v2');
    expect(updated.status).toBe('Completed');

    const refreshed = await firstValueFrom(projectService.getProjectById(projectToUpdate.id));
    expect(refreshed?.name).toBe('Pulse SaaS Enterprise Redesign v2');
    expect(refreshed?.status).toBe('Completed');
  });

  it('5. should delete a project and cascade delete associated tasks to prevent orphans', async () => {
    const projects = await firstValueFrom(projectService.getProjects());
    const projectToDelete = projects[0];

    // Verify tasks exist for this project before deletion
    const tasksBefore = await firstValueFrom(taskService.getTasksByProject(projectToDelete.id));
    expect(tasksBefore.length).toBeGreaterThan(0);

    // Delete the project
    const deleteSuccess = await firstValueFrom(projectService.deleteProject(projectToDelete.id));
    expect(deleteSuccess).toBe(true);

    // Verify project is removed
    const remainingProjects = await firstValueFrom(projectService.getProjects());
    expect(remainingProjects.some(p => p.id === projectToDelete.id)).toBe(false);

    // Verify associated tasks were cleaned up
    const tasksAfter = await firstValueFrom(taskService.getTasksByProject(projectToDelete.id));
    expect(tasksAfter.length).toBe(0);
  });

  it('6. should dynamically recalculate project progress when a task status changes', async () => {
    const projects = await firstValueFrom(projectService.getProjects());
    const project = projects.find(p => (p.tasksCount || 0) > 0)!;

    const projTasks = await firstValueFrom(taskService.getTasksByProject(project.id));
    const pendingTask = projTasks.find(t => t.status !== 'Completed')!;

    if (pendingTask) {
      const initialProgress = project.progress;

      // Mark the task as Completed
      await firstValueFrom(taskService.updateTaskStatus(pendingTask.id, 'Completed'));

      const updatedProject = await firstValueFrom(projectService.getProjectById(project.id));
      expect(updatedProject?.progress).toBeGreaterThanOrEqual(initialProgress);
      expect(updatedProject?.completedTasksCount).toBe((project.completedTasksCount || 0) + 1);
    }
  });

  it('7. should filter projects by search term, status, and progress range', async () => {
    const filtered = await firstValueFrom(projectService.filterProjects({
      searchTerm: 'Pulse',
      status: 'Active'
    }));

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(p => {
      expect(p.name.toLowerCase().includes('pulse') || p.description.toLowerCase().includes('pulse')).toBe(true);
      expect(p.status).toBe('Active');
    });
  });

  it('8. should filter projects by progress range correctly', async () => {
    const all = await firstValueFrom(projectService.getProjects());
    const midRange = await firstValueFrom(projectService.filterProjects({
      progressRange: '26-75'
    }));

    midRange.forEach(p => {
      const prog = p.progress ?? 0;
      expect(prog).toBeGreaterThanOrEqual(26);
      expect(prog).toBeLessThanOrEqual(75);
    });
  });

  it('9. should sort projects by progress descending', async () => {
    const sorted = await firstValueFrom(projectService.filterProjects({
      sortBy: 'progress',
      sortOrder: 'desc'
    }));

    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].progress ?? 0).toBeGreaterThanOrEqual(sorted[i + 1].progress ?? 0);
    }
  });
});


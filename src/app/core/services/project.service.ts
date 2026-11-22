import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project, ProjectFilter, ProjectStatus } from '../models/project.model';
import { MockDataService } from './mock-data.service';
import { TaskService } from './task.service';
import { NotificationService } from './notification.service';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private mockDataService = inject(MockDataService);
  private taskService = inject(TaskService);
  private notificationService = inject(NotificationService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  // Central reactive state for all projects
  private projectsSubject = new BehaviorSubject<Project[]>(this.mockDataService.getInitialProjects());

  // Base projects stream
  readonly projects$: Observable<Project[]> = this.projectsSubject.asObservable();

  /**
   * Projects stream with dynamically computed progress and task counters from TaskService
   */
  readonly projectsWithProgress$: Observable<Project[]> = combineLatest([
    this.projects$,
    this.taskService.tasks$
  ]).pipe(
    map(([projects, tasks]) => {
      return projects.map(proj => {
        const projTasks = tasks.filter(t => t.projectId === proj.id);
        const total = projTasks.length;
        const completed = projTasks.filter(t => t.status === 'Completed').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...proj,
          tasksCount: total,
          completedTasksCount: completed,
          progress
        };
      });
    })
  );

  /**
   * Retrieve snapshot of current projects array
   */
  get currentProjects(): Project[] {
    return this.projectsSubject.getValue();
  }

  /**
   * Get all projects with reactive progress calculation
   */
  getProjects(): Observable<Project[]> {
    return this.projectsWithProgress$;
  }

  /**
   * Get single project by ID with computed progress
   */
  getProjectById(id: string): Observable<Project | undefined> {
    return this.projectsWithProgress$.pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  /**
   * Add a new project
   */
  addProject(projectData: Partial<Project> & { name: string; description: string }): Observable<Project> {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status || 'Active',
      startDate: projectData.startDate || new Date().toISOString(),
      dueDate: projectData.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      progress: 0,
      color: projectData.color || '#4f46e5',
      membersCount: projectData.membersCount || 1,
      tasksCount: 0,
      completedTasksCount: 0
    };

    const updated = [newProject, ...this.currentProjects];
    this.projectsSubject.next(updated);

    // Record activity and trigger notification
    const author = this.authService.currentUser?.name || 'You';
    this.activityService.recordActivity({
      user: author,
      action: 'created project workspace',
      target: newProject.name,
      type: 'project_created',
      entityId: newProject.id,
      entityType: 'project'
    });
    this.notificationService.createNotification({
      title: 'New Project Created',
      message: `Project workspace "${newProject.name}" was created.`,
      type: 'project_created',
      relatedEntityId: newProject.id,
      routeUrl: `/projects/${newProject.id}`
    });

    return of(newProject);
  }

  /**
   * Update existing project
   */
  updateProject(updatedProject: Project): Observable<Project> {
    const current = this.currentProjects;
    const index = current.findIndex(p => p.id === updatedProject.id);

    if (index !== -1) {
      const prevProject = current[index];
      const updated = [...current];
      updated[index] = { ...updatedProject };
      this.projectsSubject.next(updated);

      const author = this.authService.currentUser?.name || 'You';
      const isCompleted = updatedProject.status === 'Completed' && prevProject.status !== 'Completed';

      this.activityService.recordActivity({
        user: author,
        action: isCompleted ? 'completed project' : 'updated project details',
        target: updatedProject.name,
        type: isCompleted ? 'project_completed' : 'project_updated',
        entityId: updatedProject.id,
        entityType: 'project'
      });

      this.notificationService.createNotification({
        title: isCompleted ? 'Project Completed' : 'Project Updated',
        message: isCompleted 
          ? `Project "${updatedProject.name}" has been marked as Completed!` 
          : `Project details for "${updatedProject.name}" were updated.`,
        type: isCompleted ? 'project_completed' : 'project_updated',
        relatedEntityId: updatedProject.id,
        routeUrl: `/projects/${updatedProject.id}`
      });

      return of(updatedProject);
    }

    return of(updatedProject);
  }

  /**
   * Delete a project by ID and cascade delete associated tasks
   */
  deleteProject(id: string): Observable<boolean> {
    const current = this.currentProjects;
    const projectToDelete = current.find(p => p.id === id);
    const filtered = current.filter(p => p.id !== id);

    if (filtered.length !== current.length) {
      this.projectsSubject.next(filtered);
      // Clean up all tasks referencing this deleted project to prevent orphans
      this.taskService.deleteTasksByProject(id).subscribe();

      if (projectToDelete) {
        const author = this.authService.currentUser?.name || 'You';
        this.activityService.recordActivity({
          user: author,
          action: 'deleted project workspace',
          target: projectToDelete.name,
          type: 'project_deleted',
          entityId: projectToDelete.id,
          entityType: 'project'
        });
      }

      return of(true);
    }

    return of(false);
  }

  /**
   * Filter and sort projects based on search text, status, progress range, and due date range
   */
  filterProjects(filterConfig: ProjectFilter): Observable<Project[]> {
    return this.projectsWithProgress$.pipe(
      map(projects => {
        let result = [...projects];

        if (filterConfig.searchTerm?.trim()) {
          const term = filterConfig.searchTerm.toLowerCase().trim();
          result = result.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
          );
        }

        if (filterConfig.status && filterConfig.status !== 'All') {
          result = result.filter(p => p.status === filterConfig.status);
        }

        if (filterConfig.progressRange && filterConfig.progressRange !== 'All') {
          switch (filterConfig.progressRange) {
            case '0-25':
              result = result.filter(p => p.progress >= 0 && p.progress <= 25);
              break;
            case '26-75':
              result = result.filter(p => p.progress > 25 && p.progress <= 75);
              break;
            case '76-100':
              result = result.filter(p => p.progress > 75 && p.progress <= 100);
              break;
          }
        }

        if (filterConfig.dueDateFrom) {
          const fromTime = new Date(filterConfig.dueDateFrom).getTime();
          result = result.filter(p => new Date(p.dueDate).getTime() >= fromTime);
        }

        if (filterConfig.dueDateTo) {
          const toTime = new Date(filterConfig.dueDateTo).getTime() + 86399999;
          result = result.filter(p => new Date(p.dueDate).getTime() <= toTime);
        }

        if (filterConfig.sortBy) {
          result.sort((a, b) => {
            let comparison = 0;
            switch (filterConfig.sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'dueDate':
                comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                break;
              case 'progress':
                comparison = a.progress - b.progress;
                break;
            }
            return filterConfig.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        return result;
      })
    );
  }
}


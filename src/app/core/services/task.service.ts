import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task, TaskFilter, TaskStatus } from '../models/task.model';
import { MockDataService } from './mock-data.service';
import { NotificationService } from './notification.service';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private mockDataService = inject(MockDataService);
  private notificationService = inject(NotificationService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  // Central reactive state for all tasks
  private tasksSubject = new BehaviorSubject<Task[]>(this.mockDataService.getInitialTasks());

  // Public observable stream
  readonly tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  /**
   * Retrieve snapshot of current tasks array
   */
  get currentTasks(): Task[] {
    return this.tasksSubject.getValue();
  }

  /**
   * Retrieve all tasks as an Observable
   */
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Retrieve a task by its unique ID
   */
  getTaskById(id: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(t => t.id === id))
    );
  }

  /**
   * Retrieve all tasks belonging to a specific project
   */
  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(t => t.projectId === projectId))
    );
  }

  /**
   * Add a new task to the collection
   */
  addTask(taskData: Partial<Task> & { title: string; projectId: string }): Observable<Task> {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId,
      projectName: taskData.projectName || 'General Workspace',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'To Do',
      dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      assignee: taskData.assignee || {
        id: 'usr-1',
        name: 'John Doe'
      },
      createdAt: new Date().toISOString(),
      completedAt: taskData.status === 'Completed' ? (taskData.completedAt || new Date().toISOString()) : undefined
    };

    const updatedList = [newTask, ...this.currentTasks];
    this.tasksSubject.next(updatedList);

    // Record activity and trigger notification
    const author = this.authService.currentUser?.name || 'You';
    this.activityService.recordActivity({
      user: author,
      action: 'created task',
      target: newTask.title,
      type: 'task_created',
      entityId: newTask.id,
      entityType: 'task'
    });
    this.notificationService.createNotification({
      title: 'New Task Created',
      message: `Task "${newTask.title}" was added to ${newTask.projectName}.`,
      type: 'task_created',
      relatedEntityId: newTask.id,
      routeUrl: '/tasks'
    });

    return of(newTask);
  }

  /**
   * Update an existing task
   */
  updateTask(updatedTask: Task): Observable<Task> {
    const current = this.currentTasks;
    const index = current.findIndex(t => t.id === updatedTask.id);

    if (index !== -1) {
      const taskWithTimestamp: Task = {
        ...updatedTask,
        updatedAt: new Date().toISOString(),
        completedAt: updatedTask.status === 'Completed' 
          ? (updatedTask.completedAt || new Date().toISOString()) 
          : undefined
      };
      const updatedList = [...current];
      updatedList[index] = taskWithTimestamp;
      this.tasksSubject.next(updatedList);

      const author = this.authService.currentUser?.name || 'You';
      this.activityService.recordActivity({
        user: author,
        action: 'updated task details',
        target: updatedTask.title,
        type: 'task_updated',
        entityId: updatedTask.id,
        entityType: 'task'
      });

      return of(taskWithTimestamp);
    }

    return of(updatedTask);
  }

  /**
   * Quick update of task status (e.g. from Kanban drag/drop or status dropdown)
   */
  updateTaskStatus(id: string, status: TaskStatus): Observable<Task | null> {
    const current = this.currentTasks;
    const task = current.find(t => t.id === id);

    if (task) {
      const prevStatus = task.status;
      const isNowCompleted = status === 'Completed';
      const updatedTask: Task = {
        ...task,
        status,
        updatedAt: new Date().toISOString(),
        completedAt: isNowCompleted ? (task.completedAt || new Date().toISOString()) : undefined
      };
      const updatedList = current.map(t => t.id === id ? updatedTask : t);
      this.tasksSubject.next(updatedList);

      if (prevStatus !== status) {
        const author = this.authService.currentUser?.name || 'You';
        const isCompleted = status === 'Completed';

        this.activityService.recordActivity({
          user: author,
          action: isCompleted ? 'completed task' : `moved task to ${status}`,
          target: task.title,
          type: isCompleted ? 'task_completed' : 'task_status_changed',
          entityId: task.id,
          entityType: 'task'
        });

        this.notificationService.createNotification({
          title: isCompleted ? 'Task Completed' : 'Task Status Updated',
          message: isCompleted
            ? `Task "${task.title}" has been marked as Completed!`
            : `Task "${task.title}" status changed to ${status}.`,
          type: isCompleted ? 'task_completed' : 'task_status_changed',
          relatedEntityId: task.id,
          routeUrl: '/tasks'
        });
      }

      return of(updatedTask);
    }

    return of(null);
  }

  /**
   * Delete a task by ID
   */
  deleteTask(id: string): Observable<boolean> {
    const current = this.currentTasks;
    const taskToDelete = current.find(t => t.id === id);
    const filtered = current.filter(t => t.id !== id);

    if (filtered.length !== current.length) {
      this.tasksSubject.next(filtered);

      if (taskToDelete) {
        const author = this.authService.currentUser?.name || 'You';
        this.activityService.recordActivity({
          user: author,
          action: 'deleted task',
          target: taskToDelete.title,
          type: 'task_deleted',
          entityId: taskToDelete.id,
          entityType: 'task'
        });
      }

      return of(true);
    }

    return of(false);
  }

  /**
   * Delete all tasks belonging to a specific project (Cascade delete)
   */
  deleteTasksByProject(projectId: string): Observable<number> {
    const current = this.currentTasks;
    const filtered = current.filter(t => t.projectId !== projectId);
    const countDeleted = current.length - filtered.length;

    if (countDeleted > 0) {
      this.tasksSubject.next(filtered);
    }

    return of(countDeleted);
  }

  /**
   * Reorder tasks collection (e.g. from Kanban drag & drop sorting)
   */
  reorderTasks(reorderedTasks: Task[]): Observable<Task[]> {
    this.tasksSubject.next([...reorderedTasks]);
    return of(reorderedTasks);
  }

  /**
   * Filter and sort tasks based on search query, priority, and status
   */
  filterTasks(filterConfig: TaskFilter): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => {
        let result = [...tasks];

        if (filterConfig.searchTerm?.trim()) {
          const term = filterConfig.searchTerm.toLowerCase().trim();
          result = result.filter(t => 
            t.title.toLowerCase().includes(term) || 
            t.description.toLowerCase().includes(term) ||
            t.projectName?.toLowerCase().includes(term)
          );
        }

        if (filterConfig.projectId && filterConfig.projectId !== 'All') {
          result = result.filter(t => t.projectId === filterConfig.projectId);
        }

        if (filterConfig.priority && filterConfig.priority !== 'All') {
          result = result.filter(t => t.priority === filterConfig.priority);
        }

        if (filterConfig.status && filterConfig.status !== 'All') {
          result = result.filter(t => t.status === filterConfig.status);
        }

        // Advanced filter: Due date range
        if (filterConfig.dueDateFrom) {
          const fromTime = new Date(filterConfig.dueDateFrom).getTime();
          result = result.filter(t => new Date(t.dueDate).getTime() >= fromTime);
        }

        if (filterConfig.dueDateTo) {
          const toTime = new Date(filterConfig.dueDateTo).getTime() + 86399999;
          result = result.filter(t => new Date(t.dueDate).getTime() <= toTime);
        }

        // Advanced filter: Overdue tasks only
        if (filterConfig.onlyOverdue) {
          const now = Date.now();
          result = result.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < now);
        }

        // Advanced filter: Hide completed tasks
        if (filterConfig.hideCompleted) {
          result = result.filter(t => t.status !== 'Completed');
        }

        // Sorting
        if (filterConfig.sortBy) {
          result.sort((a, b) => {
            let comparison = 0;
            switch (filterConfig.sortBy) {
              case 'dueDate':
                comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                break;
              case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
              case 'priority': {
                const weight = { High: 3, Medium: 2, Low: 1 };
                comparison = (weight[a.priority] || 0) - (weight[b.priority] || 0);
                break;
              }
              case 'createdAt':
                comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                break;
              case 'status': {
                const statusWeight = { 'To Do': 1, 'In Progress': 2, 'Completed': 3 };
                comparison = (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0);
                break;
              }
            }
            return filterConfig.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        return result;
      })
    );
  }
}


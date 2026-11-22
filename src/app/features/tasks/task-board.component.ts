import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DragDropModule],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.css'
})
export class TaskBoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private dashboardService = inject(DashboardService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Core Data Streams
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  // Filter Signals
  searchTerm = signal<string>('');
  projectFilter = signal<string>('All');
  priorityFilter = signal<TaskPriority | 'All'>('All');

  // Modal Signals
  taskModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentEditingId = signal<string | null>(null);

  // Feedback Toast
  feedbackNotice = signal<string | null>(null);

  // Reactive Task Form
  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    projectId: ['', Validators.required],
    priority: ['Medium', Validators.required],
    status: ['To Do', Validators.required],
    dueDate: [new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], Validators.required]
  });

  // Filtered Tasks Stream
  filteredTasks = computed(() => {
    let list = [...this.tasks()];
    const term = this.searchTerm().toLowerCase().trim();
    const projId = this.projectFilter();
    const priority = this.priorityFilter();

    if (term) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.projectName?.toLowerCase().includes(term)
      );
    }

    if (projId !== 'All') {
      list = list.filter(t => t.projectId === projId);
    }

    if (priority !== 'All') {
      list = list.filter(t => t.priority === priority);
    }

    return list;
  });

  // 3 Kanban Columns derived reactively from filtered tasks
  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === 'To Do'));
  inProgressTasks = computed(() => this.filteredTasks().filter(t => t.status === 'In Progress'));
  completedTasks = computed(() => this.filteredTasks().filter(t => t.status === 'Completed'));

  // Summary counts
  totalFilteredCount = computed(() => this.filteredTasks().length);

  ngOnInit(): void {
    // Subscribe to tasks
    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tasksList => {
        this.tasks.set(tasksList);
        this.isLoading.set(false);
      });

    // Subscribe to projects for color dots and dropdown selection
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projectsList => {
        this.projects.set(projectsList);
      });
  }

  // Drag and Drop drop event handler
  onTaskDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    if (event.previousContainer === event.container || event.previousContainer?.id === event.container?.id) {
      // Reordering tasks within the same column
      const columnTasks = [...event.container.data];
      moveItemInArray(columnTasks, event.previousIndex, event.currentIndex);
      this.syncReorderedColumn(columnTasks, targetStatus);
    } else {
      // Moving task to a different workflow column
      const task = event.item.data as Task;
      if (task && task.status !== targetStatus) {
        this.taskService.updateTaskStatus(task.id, targetStatus).subscribe();
        this.dashboardService.addActivity(
          'John Doe',
          `moved task to ${targetStatus}`,
          task.title
        );
        this.showFeedback(`"${task.title}" moved to ${targetStatus}`);
      }
    }
  }

  private syncReorderedColumn(reorderedColumnTasks: Task[], status: TaskStatus): void {
    const allCurrent = this.tasks();
    // Keep other tasks as they are, replace this status's tasks in new sequence
    const otherTasks = allCurrent.filter(t => t.status !== status);
    const updatedAll = [...reorderedColumnTasks, ...otherTasks];
    this.tasks.set(updatedAll);
    this.taskService.reorderTasks(updatedAll).subscribe();
  }

  // Filter Handlers
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setProjectFilter(projectId: string): void {
    this.projectFilter.set(projectId);
  }

  setPriorityFilter(priority: TaskPriority | 'All'): void {
    this.priorityFilter.set(priority);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.projectFilter.set('All');
    this.priorityFilter.set('All');
  }

  // Create Task Modal (supports preselecting column status)
  openCreateModal(defaultStatus: TaskStatus = 'To Do'): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);

    const defaultProj = this.projects().length > 0 ? this.projects()[0].id : '';

    this.taskForm.reset({
      title: '',
      description: '',
      projectId: defaultProj,
      priority: 'Medium',
      status: defaultStatus,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });

    this.taskModalOpen.set(true);
  }

  // Edit Task Modal
  openEditModal(task: Task, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.isEditing.set(true);
    this.currentEditingId.set(task.id);

    this.taskForm.setValue({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate.split('T')[0]
    });

    this.taskModalOpen.set(true);
  }

  closeModal(): void {
    this.taskModalOpen.set(false);
    this.taskForm.markAsUntouched();
  }

  // Save Task (Create or Edit)
  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formVal = this.taskForm.value;
    const project = this.projects().find(p => p.id === formVal.projectId);
    const projectName = project ? project.name : 'Workspace';

    if (this.isEditing() && this.currentEditingId()) {
      const existing = this.tasks().find(t => t.id === this.currentEditingId());
      if (existing) {
        const updatedTask: Task = {
          ...existing,
          title: formVal.title,
          description: formVal.description,
          projectId: formVal.projectId,
          projectName,
          priority: formVal.priority,
          status: formVal.status,
          dueDate: formVal.dueDate
        };

        this.taskService.updateTask(updatedTask).subscribe();
        this.dashboardService.addActivity('John Doe', 'updated task on board', formVal.title);
        this.showFeedback(`Task "${formVal.title}" updated!`);
      }
    } else {
      this.taskService.addTask({
        title: formVal.title,
        description: formVal.description,
        projectId: formVal.projectId,
        projectName,
        priority: formVal.priority,
        status: formVal.status,
        dueDate: formVal.dueDate,
        assignee: {
          id: 'usr-1',
          name: 'John Doe'
        }
      }).subscribe();

      this.dashboardService.addActivity('John Doe', 'created task on Kanban board', formVal.title);
      this.showFeedback(`Task "${formVal.title}" added to ${formVal.status}!`);
    }

    this.closeModal();
  }

  // Overdue Check
  isOverdue(task: Task): boolean {
    if (task.status === 'Completed') return false;
    const due = new Date(task.dueDate).getTime();
    return due < Date.now();
  }

  getProjectColor(projectId: string): string {
    const p = this.projects().find(proj => proj.id === projectId);
    return p ? p.color : '#4f46e5';
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-danger';
      case 'Medium': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  showFeedback(msg: string): void {
    this.feedbackNotice.set(msg);
    setTimeout(() => {
      this.feedbackNotice.set(null);
    }, 3500);
  }
}

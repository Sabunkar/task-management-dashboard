import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private dashboardService = inject(DashboardService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Core Data Streams
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  // View Switcher (Table vs Cards)
  viewMode = signal<'table' | 'cards'>('table');

  // Search & Filter Signals
  searchTerm = signal<string>('');
  statusFilter = signal<TaskStatus | 'All'>('All');
  priorityFilter = signal<TaskPriority | 'All'>('All');
  projectFilter = signal<string>('All');
  dueDateFrom = signal<string>('');
  dueDateTo = signal<string>('');
  onlyOverdue = signal<boolean>(false);
  showAdvancedFilters = signal<boolean>(false);
  sortBy = signal<'dueDate' | 'priority' | 'title' | 'status'>('dueDate');
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Active Filters Count & Status
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchTerm().trim()) count++;
    if (this.statusFilter() !== 'All') count++;
    if (this.priorityFilter() !== 'All') count++;
    if (this.projectFilter() !== 'All') count++;
    if (this.dueDateFrom()) count++;
    if (this.dueDateTo()) count++;
    if (this.onlyOverdue()) count++;
    return count;
  });

  hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  // Modal Signals
  taskModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentEditingId = signal<string | null>(null);

  // Delete Confirmation Modal
  deleteModalOpen = signal<boolean>(false);
  taskToDelete = signal<Task | null>(null);

  // Success Feedback Notice
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

  // Dynamic Statistics
  totalTasksCount = computed(() => this.tasks().length);
  todoTasksCount = computed(() => this.tasks().filter(t => t.status === 'To Do').length);
  inProgressTasksCount = computed(() => this.tasks().filter(t => t.status === 'In Progress').length);
  completedTasksCount = computed(() => this.tasks().filter(t => t.status === 'Completed').length);
  completionPercentage = computed(() => {
    const total = this.totalTasksCount();
    return total > 0 ? Math.round((this.completedTasksCount() / total) * 100) : 0;
  });

  // Filtered and Sorted Tasks List
  filteredTasks = computed(() => {
    let list = [...this.tasks()];
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const projId = this.projectFilter();
    const sort = this.sortBy();
    const order = this.sortOrder();

    // 1. Text Search (title, description, project name)
    if (term) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.projectName?.toLowerCase().includes(term)
      );
    }

    // 2. Status Filter
    if (status !== 'All') {
      list = list.filter(t => t.status === status);
    }

    // 3. Priority Filter
    if (priority !== 'All') {
      list = list.filter(t => t.priority === priority);
    }

    // 4. Project Filter
    if (projId !== 'All') {
      list = list.filter(t => t.projectId === projId);
    }

    // 5. Due Date Range
    if (this.dueDateFrom()) {
      list = list.filter(t => t.dueDate >= this.dueDateFrom());
    }
    if (this.dueDateTo()) {
      list = list.filter(t => t.dueDate <= this.dueDateTo());
    }

    // 6. Overdue Only Filter
    if (this.onlyOverdue()) {
      const todayStr = new Date().toISOString().split('T')[0];
      list = list.filter(t => t.status !== 'Completed' && t.dueDate < todayStr);
    }

    // 5. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      switch (sort) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority': {
          const weights: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };
          comparison = (weights[a.priority] || 0) - (weights[b.priority] || 0);
          break;
        }
        case 'status': {
          const statusWeights: Record<TaskStatus, number> = { 'To Do': 1, 'In Progress': 2, 'Completed': 3 };
          comparison = (statusWeights[a.status] || 0) - (statusWeights[b.status] || 0);
          break;
        }
      }
      return order === 'desc' ? -comparison : comparison;
    });

    return list;
  });

  ngOnInit(): void {
    // 1. Subscribe to Tasks stream
    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tasksList => {
        this.tasks.set(tasksList);
        this.isLoading.set(false);
      });

    // 2. Subscribe to Projects stream to populate dropdowns dynamically
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projectsList => {
        this.projects.set(projectsList);
      });

    // 3. Read query parameter ?q=... from global topbar search or ?action=new if present
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['q']) {
          this.searchTerm.set(params['q']);
        }
        if (params['action'] === 'new' || params['create'] === 'true') {
          this.openCreateModal();
        }
      });
  }

  // View Mode Switcher
  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  // Filter controls
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setStatusFilter(status: TaskStatus | 'All'): void {
    this.statusFilter.set(status);
  }

  setPriorityFilter(priority: TaskPriority | 'All'): void {
    this.priorityFilter.set(priority);
  }

  setProjectFilter(projectId: string): void {
    this.projectFilter.set(projectId);
  }

  setDueDateFrom(date: string): void {
    this.dueDateFrom.set(date);
  }

  setDueDateTo(date: string): void {
    this.dueDateTo.set(date);
  }

  toggleOverdue(): void {
    this.onlyOverdue.update(val => !val);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(open => !open);
  }

  clearFilter(key: 'search' | 'status' | 'priority' | 'project' | 'dueDateFrom' | 'dueDateTo' | 'overdue'): void {
    switch (key) {
      case 'search': this.searchTerm.set(''); break;
      case 'status': this.statusFilter.set('All'); break;
      case 'priority': this.priorityFilter.set('All'); break;
      case 'project': this.projectFilter.set('All'); break;
      case 'dueDateFrom': this.dueDateFrom.set(''); break;
      case 'dueDateTo': this.dueDateTo.set(''); break;
      case 'overdue': this.onlyOverdue.set(false); break;
    }
  }

  getProjectName(projectId: string): string {
    const proj = this.projects().find(p => p.id === projectId);
    return proj ? proj.name : projectId;
  }

  setSortBy(sort: 'dueDate' | 'priority' | 'title' | 'status'): void {
    if (this.sortBy() === sort) {
      this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sort);
      this.sortOrder.set('asc');
    }
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('All');
    this.priorityFilter.set('All');
    this.projectFilter.set('All');
    this.dueDateFrom.set('');
    this.dueDateTo.set('');
    this.onlyOverdue.set(false);
    this.sortBy.set('dueDate');
    this.sortOrder.set('asc');
  }

  // Create Task Modal
  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);

    const defaultProjectId = this.projects().length > 0 ? this.projects()[0].id : '';

    this.taskForm.reset({
      title: '',
      description: '',
      projectId: defaultProjectId,
      priority: 'Medium',
      status: 'To Do',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });

    this.taskModalOpen.set(true);
  }

  // Edit Task Modal
  openEditModal(task: Task, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
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
        this.dashboardService.addActivity('John Doe', 'updated task details on', formVal.title);
        this.showFeedback(`Task "${formVal.title}" updated successfully!`);
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

      this.dashboardService.addActivity('John Doe', 'created new task', formVal.title);
      this.showFeedback(`Task "${formVal.title}" created successfully!`);
    }

    this.closeModal();
  }

  // Quick Inline Status Update
  updateTaskStatus(task: Task, newStatus: TaskStatus, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.taskService.updateTaskStatus(task.id, newStatus).subscribe();
    this.dashboardService.addActivity(
      'John Doe',
      `moved task to ${newStatus}`,
      task.title
    );
    this.showFeedback(`Task "${task.title}" updated to ${newStatus}.`);
  }

  // Delete Task Modal
  openDeleteModal(task: Task, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.taskToDelete.set(task);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.taskToDelete.set(null);
  }

  confirmDelete(): void {
    const task = this.taskToDelete();
    if (task) {
      this.taskService.deleteTask(task.id).subscribe();
      this.dashboardService.addActivity('John Doe', 'deleted task', task.title);
      this.showFeedback(`Task "${task.title}" deleted.`);
    }
    this.closeDeleteModal();
  }

  showFeedback(message: string): void {
    this.feedbackNotice.set(message);
    setTimeout(() => {
      this.feedbackNotice.set(null);
    }, 3500);
  }

  getProjectColor(projectId: string): string {
    const p = this.projects().find(proj => proj.id === projectId);
    return p ? p.color : '#4f46e5';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      default: return 'status-to-do';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-danger';
      case 'Medium': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}

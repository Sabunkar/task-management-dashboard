import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../core/services/project.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { Project, ProjectStatus } from '../../core/models/project.model';

// Custom validator ensuring due date is not before start date
export function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const due = control.get('dueDate')?.value;
  if (start && due && new Date(due).getTime() < new Date(start).getTime()) {
    return { dateRangeInvalid: true };
  }
  return null;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private dashboardService = inject(DashboardService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Projects stream from service
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  // Filter & Search Signals
  searchTerm = signal<string>('');
  selectedStatus = signal<ProjectStatus | 'All'>('All');
  progressRange = signal<'All' | '0-25' | '26-75' | '76-100'>('All');
  dueDateFrom = signal<string>('');
  dueDateTo = signal<string>('');
  showAdvancedFilters = signal<boolean>(false);
  sortBy = signal<'name' | 'dueDate' | 'progress'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Computed Active Filters Status
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchTerm().trim()) count++;
    if (this.selectedStatus() !== 'All') count++;
    if (this.progressRange() !== 'All') count++;
    if (this.dueDateFrom()) count++;
    if (this.dueDateTo()) count++;
    return count;
  });

  hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  // Modal Signals
  projectModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentEditingId = signal<string | null>(null);

  // Delete Confirmation Modal
  deleteModalOpen = signal<boolean>(false);
  projectToDelete = signal<Project | null>(null);

  // Success Feedback Notice
  feedbackNotice = signal<string | null>(null);

  // Predefined color palette for project identification
  colorPalette = [
    '#4f46e5', // Indigo
    '#0ea5e9', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899'  // Pink
  ];

  // Reactive Project Form
  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    status: ['Active', Validators.required],
    startDate: [new Date().toISOString().split('T')[0], Validators.required],
    dueDate: [new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], Validators.required],
    color: ['#4f46e5', Validators.required]
  }, { validators: dateRangeValidator });

  // Computed Dynamic Project Statistics
  totalProjectsCount = computed(() => this.projects().length);
  activeProjectsCount = computed(() => this.projects().filter(p => p.status === 'Active').length);
  completedProjectsCount = computed(() => this.projects().filter(p => p.status === 'Completed').length);
  onHoldProjectsCount = computed(() => this.projects().filter(p => p.status === 'On Hold').length);

  // Filtered and Sorted Projects List
  filteredProjects = computed(() => {
    let list = [...this.projects()];
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.selectedStatus();
    const sort = this.sortBy();
    const order = this.sortOrder();

    // 1. Text Search by name or description
    if (term) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }

    // 2. Status Filter
    if (status !== 'All') {
      list = list.filter(p => p.status === status);
    }

    // 3. Progress Range Filter
    const range = this.progressRange();
    if (range !== 'All') {
      list = list.filter(p => {
        const prog = p.progress ?? 0;
        if (range === '0-25') return prog <= 25;
        if (range === '26-75') return prog >= 26 && prog <= 75;
        if (range === '76-100') return prog >= 76;
        return true;
      });
    }

    // 4. Due Date Range Filter
    if (this.dueDateFrom()) {
      list = list.filter(p => p.dueDate >= this.dueDateFrom());
    }
    if (this.dueDateTo()) {
      list = list.filter(p => p.dueDate <= this.dueDateTo());
    }

    // 3. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'progress':
          comparison = (a.progress || 0) - (b.progress || 0);
          break;
      }
      return order === 'desc' ? -comparison : comparison;
    });

    return list;
  });

  ngOnInit(): void {
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projectsList => {
        this.projects.set(projectsList);
        this.isLoading.set(false);
      });
  }

  // Search & Filter controls
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setStatusFilter(status: ProjectStatus | 'All'): void {
    this.selectedStatus.set(status);
  }

  setProgressRange(range: 'All' | '0-25' | '26-75' | '76-100'): void {
    this.progressRange.set(range);
  }

  setDueDateFrom(date: string): void {
    this.dueDateFrom.set(date);
  }

  setDueDateTo(date: string): void {
    this.dueDateTo.set(date);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(open => !open);
  }

  clearFilter(key: 'search' | 'status' | 'progress' | 'dueDateFrom' | 'dueDateTo'): void {
    switch (key) {
      case 'search': this.searchTerm.set(''); break;
      case 'status': this.selectedStatus.set('All'); break;
      case 'progress': this.progressRange.set('All'); break;
      case 'dueDateFrom': this.dueDateFrom.set(''); break;
      case 'dueDateTo': this.dueDateTo.set(''); break;
    }
  }

  setSortBy(sort: 'name' | 'dueDate' | 'progress'): void {
    if (this.sortBy() === sort) {
      // Toggle sort direction
      this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sort);
      this.sortOrder.set('asc');
    }
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('All');
    this.progressRange.set('All');
    this.dueDateFrom.set('');
    this.dueDateTo.set('');
    this.sortBy.set('name');
    this.sortOrder.set('asc');
  }

  // Create Project Modal
  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.projectForm.reset({
      name: '',
      description: '',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      color: '#4f46e5'
    });
    this.projectModalOpen.set(true);
  }

  // Edit Project Modal
  openEditModal(project: Project, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.isEditing.set(true);
    this.currentEditingId.set(project.id);

    this.projectForm.setValue({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate.split('T')[0],
      dueDate: project.dueDate.split('T')[0],
      color: project.color || '#4f46e5'
    });

    this.projectModalOpen.set(true);
  }

  closeModal(): void {
    this.projectModalOpen.set(false);
    this.projectForm.markAsUntouched();
  }

  // Save Project (Create or Edit)
  saveProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const formValue = this.projectForm.value;

    if (this.isEditing() && this.currentEditingId()) {
      const existing = this.projects().find(p => p.id === this.currentEditingId());
      if (existing) {
        const updatedProject: Project = {
          ...existing,
          name: formValue.name,
          description: formValue.description,
          status: formValue.status,
          startDate: formValue.startDate,
          dueDate: formValue.dueDate,
          color: formValue.color
        };

        this.projectService.updateProject(updatedProject).subscribe();
        this.dashboardService.addActivity('John Doe', 'updated project details on', formValue.name);
        this.showFeedback(`Project "${formValue.name}" updated successfully!`);
      }
    } else {
      this.projectService.addProject({
        name: formValue.name,
        description: formValue.description,
        status: formValue.status,
        startDate: formValue.startDate,
        dueDate: formValue.dueDate,
        color: formValue.color
      }).subscribe();

      this.dashboardService.addActivity('John Doe', 'created new workspace', formValue.name);
      this.showFeedback(`Project "${formValue.name}" created successfully!`);
    }

    this.closeModal();
  }

  // Delete Project Confirmation
  openDeleteModal(project: Project, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.projectToDelete.set(project);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.projectToDelete.set(null);
  }

  confirmDelete(): void {
    const project = this.projectToDelete();
    if (project) {
      this.projectService.deleteProject(project.id).subscribe();
      this.dashboardService.addActivity('John Doe', 'deleted project workspace', project.name);
      this.showFeedback(`Project "${project.name}" and associated tasks removed.`);
    }
    this.closeDeleteModal();
  }

  showFeedback(message: string): void {
    this.feedbackNotice.set(message);
    setTimeout(() => {
      this.feedbackNotice.set(null);
    }, 3500);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'On Hold': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}

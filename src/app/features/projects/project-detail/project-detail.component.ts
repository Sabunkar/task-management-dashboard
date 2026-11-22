import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Project } from '../../../core/models/project.model';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);

  projectId = signal<string | null>(null);
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  isLoading = signal<boolean>(true);

  // Computed task statistics for this specific project
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'Completed').length);
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'In Progress').length);
  pendingTasks = computed(() => this.tasks().filter(t => t.status === 'To Do').length);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.projectId.set(id);
        if (id) {
          this.loadProjectDetails(id);
        } else {
          this.isLoading.set(false);
        }
      });
  }

  loadProjectDetails(id: string): void {
    this.isLoading.set(true);

    // Subscribe to project details
    this.projectService.getProjectById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(proj => {
        this.project.set(proj || null);
        this.isLoading.set(false);
      });

    // Subscribe to project tasks
    this.taskService.getTasksByProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tasksList => {
        this.tasks.set(tasksList);
      });
  }

  markTaskCompleted(task: Task, event: Event): void {
    event.stopPropagation();
    const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    this.taskService.updateTaskStatus(task.id, newStatus).subscribe();
    this.dashboardService.addActivity(
      'John Doe',
      `marked task ${newStatus.toLowerCase()}`,
      task.title
    );
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'On Hold': return 'badge-warning';
      default: return 'badge-info';
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


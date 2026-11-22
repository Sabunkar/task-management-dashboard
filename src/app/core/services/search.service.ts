import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';

export interface GlobalSearchResults {
  query: string;
  tasks: Task[];
  projects: Project[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  /**
   * Search across all tasks and projects with case-insensitive partial text matching
   */
  search(rawQuery: string): Observable<GlobalSearchResults> {
    const trimmed = (rawQuery || '').trim();

    if (!trimmed) {
      return of({
        query: '',
        tasks: [],
        projects: [],
        totalCount: 0
      });
    }

    const term = trimmed.toLowerCase();

    return combineLatest([
      this.taskService.tasks$,
      this.projectService.projectsWithProgress$
    ]).pipe(
      map(([tasks, projects]) => {
        // Filter tasks by title, description, or project name
        const matchedTasks = tasks.filter(t => 
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          (t.projectName && t.projectName.toLowerCase().includes(term))
        );

        // Filter projects by name or description
        const matchedProjects = projects.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        );

        return {
          query: trimmed,
          tasks: matchedTasks,
          projects: matchedProjects,
          totalCount: matchedTasks.length + matchedProjects.length
        };
      })
    );
  }
}


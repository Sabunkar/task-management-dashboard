export type ProjectStatus = 'Planning' | 'Active' | 'Completed' | 'On Hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  progress: number; // 0 - 100
  color: string;    // HEX code for UI tag/accent
  tasksCount?: number;
  completedTasksCount?: number;
  membersCount?: number;
}

export interface ProjectFilter {
  searchTerm?: string;
  status?: ProjectStatus | 'All';
  progressRange?: 'All' | '0-25' | '26-75' | '76-100';
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: 'name' | 'dueDate' | 'progress';
  sortOrder?: 'asc' | 'desc';
}

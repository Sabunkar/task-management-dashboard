export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface TaskFilter {
  searchTerm?: string;
  projectId?: string;
  priority?: TaskPriority | 'All';
  status?: TaskStatus | 'All';
  dueDateFrom?: string;
  dueDateTo?: string;
  onlyOverdue?: boolean;
  hideCompleted?: boolean;
  sortBy?: 'dueDate' | 'priority' | 'title' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

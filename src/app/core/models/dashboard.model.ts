import { Task } from './task.model';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
}

export type ActivityType = 
  | 'task_created' 
  | 'task_status_changed' 
  | 'task_completed' 
  | 'task_updated' 
  | 'task_deleted' 
  | 'project_created' 
  | 'project_updated' 
  | 'project_completed' 
  | 'project_deleted' 
  | 'general';

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type?: ActivityType;
  description?: string;
  entityId?: string;
  entityType?: 'task' | 'project' | 'workspace';
  avatarUrl?: string;
}

export interface UpcomingDeadline {
  task: Task;
  daysRemaining: number;
}

export type NotificationType = 
  | 'task_created' 
  | 'task_assigned' 
  | 'task_status_changed' 
  | 'task_completed' 
  | 'deadline_approaching' 
  | 'project_created' 
  | 'project_updated' 
  | 'project_completed' 
  | 'general';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  relatedEntityId?: string;
  routeUrl?: string;
  icon?: string;
  color?: string;
}

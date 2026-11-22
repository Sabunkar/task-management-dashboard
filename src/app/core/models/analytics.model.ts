import { ProjectStatus } from './project.model';
import { TaskPriority, TaskStatus } from './task.model';

export type DateRangePreset = 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'this_year' 
  | 'all_time' 
  | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface OverviewMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  taskCompletionRate: number; // 0 to 100 percentage
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  createdInPeriodCount: number;
  completedInPeriodCount: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProjectAnalyticsItem {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  needsAttention: boolean;
  attentionReason?: string;
  color: string;
  dueDate: string;
}

export interface TaskTrendPoint {
  date: string;       // Formatted for display e.g. "Nov 18"
  isoDate: string;    // "2026-11-18"
  createdCount: number;
  completedCount: number;
}

export interface TrendAnalysis {
  points: TaskTrendPoint[];
  hasSufficientData: boolean;
  totalCreated: number;
  totalCompleted: number;
  peakCompletionDay?: string;
}

export interface ProductivityInsights {
  mostProductivePeriod?: {
    period: string;
    completionsCount: number;
    detail: string;
  };
  topProjects: {
    id: string;
    name: string;
    completionRate: number;
    completedCount: number;
  }[];
  overdueCount: number;
  hasInsufficientData: boolean;
  workloadObservations: string[];
}


import { Project } from '../../core/models/project.model';
import { Task } from '../../core/models/task.model';
import { DashboardStats, ActivityItem } from '../../core/models/dashboard.model';

export interface DashboardMetricCard {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bgColor: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  trendSubtext: string;
}

export const MOCK_DASHBOARD_METRICS: DashboardMetricCard[] = [
  {
    id: 'projects',
    label: 'Total Projects',
    value: 12,
    icon: 'folder_open',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    trend: '+2 this month',
    trendDirection: 'up',
    trendSubtext: '3 active sprints'
  },
  {
    id: 'tasks',
    label: 'Total Tasks',
    value: 64,
    icon: 'task_alt',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    trend: '+12 this week',
    trendDirection: 'up',
    trendSubtext: '8 assigned to you'
  },
  {
    id: 'completed',
    label: 'Completed Tasks',
    value: 42,
    icon: 'check_circle',
    color: '#10b981',
    bgColor: '#ecfdf5',
    trend: '65.6%',
    trendDirection: 'up',
    trendSubtext: 'completion rate'
  },
  {
    id: 'pending',
    label: 'Pending Tasks',
    value: 22,
    icon: 'pending_actions',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    trend: '5 urgent',
    trendDirection: 'neutral',
    trendSubtext: 'due this week'
  }
];

export const MOCK_TASK_BREAKDOWN = {
  total: 64,
  completed: 42,
  inProgress: 14,
  todo: 8,
  completionPercentage: 65.6
};

export const MOCK_RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    user: 'Sarah Jenkins',
    action: 'uploaded wireframes for',
    target: 'Pulse SaaS Redesign',
    timestamp: '15 minutes ago',
    avatarUrl: ''
  },
  {
    id: 'act-2',
    user: 'Mike Chen',
    action: 'moved task to In Progress on',
    target: 'Auth0 JWT Migration',
    timestamp: '1 hour ago',
    avatarUrl: ''
  },
  {
    id: 'act-3',
    user: 'John Doe',
    action: 'completed milestone',
    target: 'Design System Tokens v2.0',
    timestamp: '3 hours ago',
    avatarUrl: ''
  },
  {
    id: 'act-4',
    user: 'Alex Rivera',
    action: 'commented on bug ticket',
    target: 'Mobile Navigation Flickering',
    timestamp: '5 hours ago',
    avatarUrl: ''
  },
  {
    id: 'act-5',
    user: 'Emily Watson',
    action: 'created new project workspace',
    target: 'AI Copilot Integration',
    timestamp: 'Yesterday at 4:30 PM',
    avatarUrl: ''
  }
];

export interface DashboardUpcomingTask {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  daysRemainingText: string;
  urgency: 'urgent' | 'warning' | 'normal';
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Completed';
}

export const MOCK_UPCOMING_TASKS: DashboardUpcomingTask[] = [
  {
    id: 'task-101',
    title: 'Finalize REST API Schema & Contracts',
    projectName: 'Pulse SaaS Redesign',
    dueDate: 'Today, 5:00 PM',
    daysRemainingText: 'Due Today',
    urgency: 'urgent',
    priority: 'High',
    status: 'In Progress'
  },
  {
    id: 'task-102',
    title: 'Implement Dark Mode CSS Tokens',
    projectName: 'Design System',
    dueDate: 'Tomorrow',
    daysRemainingText: 'Due in 1 day',
    urgency: 'warning',
    priority: 'Medium',
    status: 'To Do'
  },
  {
    id: 'task-103',
    title: 'Audit RBAC Route Guards & Interceptors',
    projectName: 'Security Compliance',
    dueDate: 'Nov 26, 2026',
    daysRemainingText: 'Due in 4 days',
    urgency: 'normal',
    priority: 'High',
    status: 'In Progress'
  },
  {
    id: 'task-104',
    title: 'Integrate Stripe Webhook Listeners',
    projectName: 'Billing Service',
    dueDate: 'Nov 29, 2026',
    daysRemainingText: 'Due in 7 days',
    urgency: 'normal',
    priority: 'Medium',
    status: 'To Do'
  }
];

export const MOCK_FEATURED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Pulse SaaS Redesign',
    description: 'Modernizing core dashboard views, sidebar UX, and real-time task board experience.',
    status: 'Active',
    startDate: '2026-11-01',
    dueDate: '2026-12-05',
    progress: 75,
    color: '#4f46e5',
    tasksCount: 24,
    completedTasksCount: 18,
    membersCount: 6
  },
  {
    id: 'proj-2',
    name: 'Mobile App Architecture v2',
    description: 'React Native & Angular hybrid mobile synchronization engine with offline persistence.',
    status: 'Active',
    startDate: '2026-11-10',
    dueDate: '2026-12-18',
    progress: 45,
    color: '#0ea5e9',
    tasksCount: 20,
    completedTasksCount: 9,
    membersCount: 4
  },
  {
    id: 'proj-3',
    name: 'API Gateway & Auth Service',
    description: 'High-throughput microservices routing, rate limiting, and SSO enterprise gateway.',
    status: 'Active',
    startDate: '2026-10-15',
    dueDate: '2026-11-28',
    progress: 90,
    color: '#10b981',
    tasksCount: 21,
    completedTasksCount: 19,
    membersCount: 5
  },
  {
    id: 'proj-4',
    name: 'Design System & Token Library',
    description: 'Comprehensive UI component kit with accessibility standards and KaTeX typography.',
    status: 'Completed',
    startDate: '2026-10-01',
    dueDate: '2026-11-15',
    progress: 100,
    color: '#8b5cf6',
    tasksCount: 15,
    completedTasksCount: 15,
    membersCount: 3
  }
];


import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { ActivityItem } from '../models/dashboard.model';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Current authenticated user
  private readonly currentUser: User = {
    id: 'usr-1',
    name: 'John Doe',
    email: 'john.doe@pulsetask.com',
    role: 'Project Manager',
    department: 'Engineering & Product',
    createdAt: '2026-01-15T09:00:00Z'
  };

  // Initial projects dataset
  private readonly initialProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Pulse SaaS Redesign',
      description: 'Modernizing core dashboard views, sidebar UX, and real-time task board experience.',
      status: 'Active',
      startDate: '2026-11-01',
      dueDate: '2026-12-05',
      progress: 0, // dynamically calculated
      color: '#4f46e5',
      membersCount: 6
    },
    {
      id: 'proj-2',
      name: 'Mobile App Architecture v2',
      description: 'React Native & Angular hybrid mobile synchronization engine with offline persistence.',
      status: 'Active',
      startDate: '2026-11-10',
      dueDate: '2026-12-18',
      progress: 0,
      color: '#0ea5e9',
      membersCount: 4
    },
    {
      id: 'proj-3',
      name: 'API Gateway & Auth Service',
      description: 'High-throughput microservices routing, rate limiting, and SSO enterprise gateway.',
      status: 'Active',
      startDate: '2026-10-15',
      dueDate: '2026-11-28',
      progress: 0,
      color: '#10b981',
      membersCount: 5
    },
    {
      id: 'proj-4',
      name: 'Design System & Token Library',
      description: 'Comprehensive UI component kit with accessibility standards and KaTeX typography.',
      status: 'Completed',
      startDate: '2026-10-01',
      dueDate: '2026-11-15',
      progress: 0,
      color: '#8b5cf6',
      membersCount: 3
    }
  ];

  // Initial tasks dataset with realistic distributions
  private readonly initialTasks: Task[] = [
    // Project 1 tasks (Pulse SaaS Redesign)
    {
      id: 'task-101',
      title: 'Finalize REST API Schema & Contracts',
      description: 'Define OpenAPI specifications and error response schemas for dashboard endpoints.',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-11-22T17:00:00Z',
      assignee: { id: 'usr-1', name: 'John Doe' },
      createdAt: '2026-11-18T10:00:00Z'
    },
    {
      id: 'task-102',
      title: 'Sidebar Collapsible Tooltips & Transitions',
      description: 'Implement floating tooltip pills when sidebar is collapsed.',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign',
      priority: 'Medium',
      status: 'Completed',
      dueDate: '2026-11-20T18:00:00Z',
      assignee: { id: 'usr-2', name: 'Sarah Jenkins' },
      createdAt: '2026-11-17T11:30:00Z',
      completedAt: '2026-11-19T16:00:00Z'
    },
    {
      id: 'task-103',
      title: 'Top Navigation Search & Profile Dropdowns',
      description: 'Interactive header with clearable search and user avatar menu.',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign',
      priority: 'Medium',
      status: 'Completed',
      dueDate: '2026-11-21T14:00:00Z',
      assignee: { id: 'usr-1', name: 'John Doe' },
      createdAt: '2026-11-18T09:15:00Z',
      completedAt: '2026-11-20T14:30:00Z'
    },
    {
      id: 'task-104',
      title: 'Kanban Drag-and-Drop Column Reordering',
      description: 'Enable smooth drag-and-drop between To Do, In Progress, and Completed columns.',
      projectId: 'proj-1',
      projectName: 'Pulse SaaS Redesign',
      priority: 'High',
      status: 'To Do',
      dueDate: '2026-11-25T17:00:00Z',
      assignee: { id: 'usr-3', name: 'Mike Chen' },
      createdAt: '2026-11-19T13:45:00Z'
    },

    // Project 2 tasks (Mobile App Architecture v2)
    {
      id: 'task-105',
      title: 'Offline SQLite Synchronization Adapter',
      description: 'Local caching of task mutations during intermittent network connectivity.',
      projectId: 'proj-2',
      projectName: 'Mobile App Architecture v2',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-11-27T18:00:00Z',
      assignee: { id: 'usr-3', name: 'Mike Chen' },
      createdAt: '2026-11-15T08:00:00Z'
    },
    {
      id: 'task-106',
      title: 'Push Notification Payload Handlers',
      description: 'Support background notification reception on iOS APNs and Android FCM.',
      projectId: 'proj-2',
      projectName: 'Mobile App Architecture v2',
      priority: 'Medium',
      status: 'To Do',
      dueDate: '2026-12-02T12:00:00Z',
      assignee: { id: 'usr-4', name: 'Alex Rivera' },
      createdAt: '2026-11-16T15:20:00Z'
    },
    {
      id: 'task-107',
      title: 'Mobile Navigation Flickering Fix',
      description: 'Eliminate layout shift when switching bottom navigation tabs.',
      projectId: 'proj-2',
      projectName: 'Mobile App Architecture v2',
      priority: 'Low',
      status: 'Completed',
      dueDate: '2026-11-19T17:00:00Z',
      assignee: { id: 'usr-4', name: 'Alex Rivera' },
      createdAt: '2026-11-14T11:00:00Z',
      completedAt: '2026-11-18T15:00:00Z'
    },

    // Project 3 tasks (API Gateway & Auth Service)
    {
      id: 'task-108',
      title: 'Audit RBAC Route Guards & Interceptors',
      description: 'Verify token expiration refresh flow and unauthorized redirection guards.',
      projectId: 'proj-3',
      projectName: 'API Gateway & Auth Service',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-11-26T17:00:00Z',
      assignee: { id: 'usr-1', name: 'John Doe' },
      createdAt: '2026-11-12T14:00:00Z'
    },
    {
      id: 'task-109',
      title: 'Integrate Stripe Webhook Listeners',
      description: 'Handle customer subscription renewal and downgrade webhook events.',
      projectId: 'proj-3',
      projectName: 'API Gateway & Auth Service',
      priority: 'Medium',
      status: 'To Do',
      dueDate: '2026-11-29T17:00:00Z',
      assignee: { id: 'usr-3', name: 'Mike Chen' },
      createdAt: '2026-11-13T16:45:00Z'
    },
    {
      id: 'task-110',
      title: 'Redis Rate Limiter Middleware',
      description: 'Throttle public API requests to 100 req/min per tenant IP.',
      projectId: 'proj-3',
      projectName: 'API Gateway & Auth Service',
      priority: 'High',
      status: 'Completed',
      dueDate: '2026-11-18T18:00:00Z',
      assignee: { id: 'usr-1', name: 'John Doe' },
      createdAt: '2026-11-10T09:00:00Z',
      completedAt: '2026-11-17T11:00:00Z'
    },
    {
      id: 'task-111',
      title: 'Zero-Trust JWT Signature Verification',
      description: 'Migrate RS256 public key caching to in-memory JWKS provider.',
      projectId: 'proj-3',
      projectName: 'API Gateway & Auth Service',
      priority: 'High',
      status: 'Completed',
      dueDate: '2026-11-16T18:00:00Z',
      assignee: { id: 'usr-1', name: 'John Doe' },
      createdAt: '2026-11-08T10:30:00Z',
      completedAt: '2026-11-15T16:00:00Z'
    },

    // Project 4 tasks (Design System & Token Library - Completed project)
    {
      id: 'task-112',
      title: 'Implement Dark Mode CSS Tokens',
      description: 'Define OKLCH color scale and high-contrast accessibility tokens.',
      projectId: 'proj-4',
      projectName: 'Design System & Token Library',
      priority: 'Medium',
      status: 'Completed',
      dueDate: '2026-11-14T17:00:00Z',
      assignee: { id: 'usr-2', name: 'Sarah Jenkins' },
      createdAt: '2026-10-26T12:00:00Z',
      completedAt: '2026-11-04T17:00:00Z'
    },
    {
      id: 'task-113',
      title: 'Publish Button & Badge Primitives',
      description: 'Export strict standalone UI components with KaTeX and icon bindings.',
      projectId: 'proj-4',
      projectName: 'Design System & Token Library',
      priority: 'High',
      status: 'Completed',
      dueDate: '2026-11-15T18:00:00Z',
      assignee: { id: 'usr-2', name: 'Sarah Jenkins' },
      createdAt: '2026-10-30T13:00:00Z',
      completedAt: '2026-11-08T18:00:00Z'
    }
  ];

  // Initial activities
  private readonly initialActivities: ActivityItem[] = [
    {
      id: 'act-1',
      user: 'Sarah Jenkins',
      action: 'uploaded wireframes for',
      target: 'Pulse SaaS Redesign',
      timestamp: '15 minutes ago'
    },
    {
      id: 'act-2',
      user: 'Mike Chen',
      action: 'moved task to In Progress on',
      target: 'Auth0 JWT Migration',
      timestamp: '1 hour ago'
    },
    {
      id: 'act-3',
      user: 'John Doe',
      action: 'completed milestone',
      target: 'Design System Tokens v2.0',
      timestamp: '3 hours ago'
    },
    {
      id: 'act-4',
      user: 'Alex Rivera',
      action: 'commented on bug ticket',
      target: 'Mobile Navigation Flickering',
      timestamp: '5 hours ago'
    },
    {
      id: 'act-5',
      user: 'Emily Watson',
      action: 'created new project workspace',
      target: 'AI Copilot Integration',
      timestamp: 'Yesterday at 4:30 PM'
    }
  ];

  // Deep clone getters to provide fresh initial state
  getCurrentUser(): User {
    return { ...this.currentUser };
  }

  getInitialProjects(): Project[] {
    return this.initialProjects.map(p => ({ ...p }));
  }

  getInitialTasks(): Task[] {
    return this.initialTasks.map(t => ({
      ...t,
      assignee: t.assignee ? { ...t.assignee } : undefined
    }));
  }

  getInitialActivities(): ActivityItem[] {
    return this.initialActivities.map(a => ({ ...a }));
  }
}


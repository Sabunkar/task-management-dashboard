import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivityItem, ActivityType } from '../models/dashboard.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly STORAGE_KEY = 'pulsetask_activities';
  private readonly mockDataService = inject(MockDataService);

  private readonly activitiesSubject = new BehaviorSubject<ActivityItem[]>([]);
  readonly activities$: Observable<ActivityItem[]> = this.activitiesSubject.asObservable();

  constructor() {
    this.initActivities();
  }

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Initialize activities from persistent browser storage or fallback to initial mock dataset
   */
  private initActivities(): void {
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed: ActivityItem[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.activitiesSubject.next(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not restore activities from localStorage', e);
      }
    }

    // Default to initial mock activities
    this.activitiesSubject.next(this.mockDataService.getInitialActivities());
  }

  /**
   * Snapshot of all recorded activities
   */
  get currentActivities(): ActivityItem[] {
    return this.activitiesSubject.getValue();
  }

  /**
   * Record a new audit activity event and persist
   */
  recordActivity(item: {
    user: string;
    action: string;
    target: string;
    type?: ActivityType;
    description?: string;
    entityId?: string;
    entityType?: 'task' | 'project' | 'workspace';
    timestamp?: string;
  }): ActivityItem {
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user: item.user || 'System',
      action: item.action,
      target: item.target,
      timestamp: item.timestamp || 'Just now',
      type: item.type || 'general',
      description: item.description || `${item.user} ${item.action} "${item.target}"`,
      entityId: item.entityId,
      entityType: item.entityType
    };

    const updated = [newActivity, ...this.currentActivities.slice(0, 49)];
    this.activitiesSubject.next(updated);
    this.saveToStorage(updated);
    return newActivity;
  }

  /**
   * Reset / clear activity history
   */
  clearActivities(): void {
    this.activitiesSubject.next([]);
    if (this.isBrowser) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        console.warn('Could not clear activities in storage', e);
      }
    }
  }

  private saveToStorage(activities: ActivityItem[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.warn('Could not persist activities to localStorage', e);
    }
  }
}


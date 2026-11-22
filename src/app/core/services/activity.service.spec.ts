import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ActivityService } from './activity.service';
import { MockDataService } from './mock-data.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let mockDataService: MockDataService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [MockDataService, ActivityService]
    });
    service = TestBed.inject(ActivityService);
    mockDataService = TestBed.inject(MockDataService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with mock activities when storage is empty', async () => {
    const activities = await firstValueFrom(service.activities$);
    const initial = mockDataService.getInitialActivities();
    expect(activities.length).toBe(initial.length);
  });

  it('should record an activity event with metadata and update stream', async () => {
    const initial = service.currentActivities.length;

    const recorded = service.recordActivity({
      user: 'Sarah Jenkins',
      action: 'completed task',
      target: 'Fix Nav Drawer',
      type: 'task_completed',
      entityId: 'task-99',
      entityType: 'task'
    });

    expect(recorded).toBeDefined();
    expect(recorded.id).toMatch(/^act-/);
    expect(recorded.user).toBe('Sarah Jenkins');
    expect(recorded.action).toBe('completed task');
    expect(recorded.target).toBe('Fix Nav Drawer');
    expect(recorded.type).toBe('task_completed');
    expect(recorded.entityId).toBe('task-99');

    const updated = await firstValueFrom(service.activities$);
    expect(updated.length).toBe(initial + 1);
    expect(updated[0].id).toBe(recorded.id);

    // Verify persisted in localStorage
    const stored = localStorage.getItem('pulsetask_activities');
    expect(stored).toBeTruthy();
    expect(stored).toContain('Fix Nav Drawer');
  });

  it('should clear all activities cleanly', () => {
    service.clearActivities();
    expect(service.currentActivities.length).toBe(0);
    expect(localStorage.getItem('pulsetask_activities')).toBeNull();
  });
});


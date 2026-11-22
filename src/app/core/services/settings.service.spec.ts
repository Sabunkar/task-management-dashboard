import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default light theme and default notifications', () => {
    expect(service.currentTheme).toBe('light');
    expect(service.currentNotifications.taskAssigned).toBe(true);
    expect(service.currentNotifications.workspaceAnnouncements).toBe(false);
  });

  it('should set theme and persist to localStorage', async () => {
    service.setTheme('dark');
    expect(service.currentTheme).toBe('dark');
    expect(localStorage.getItem('pulsetask_theme')).toBe('dark');

    const emitted = await firstValueFrom(service.theme$);
    expect(emitted).toBe('dark');
  });

  it('should toggle theme between light and dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.currentTheme).toBe('dark');
    expect(localStorage.getItem('pulsetask_theme')).toBe('dark');

    service.toggleTheme();
    expect(service.currentTheme).toBe('light');
    expect(localStorage.getItem('pulsetask_theme')).toBe('light');
  });

  it('should update notification preferences and persist to localStorage', async () => {
    service.updateNotificationPreferences({
      workspaceAnnouncements: true,
      deadlineReminders: false
    });

    const notifs = service.currentNotifications;
    expect(notifs.workspaceAnnouncements).toBe(true);
    expect(notifs.deadlineReminders).toBe(false);
    expect(notifs.taskAssigned).toBe(true); // Retains unchanged properties

    const stored = localStorage.getItem('pulsetask_notifications');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.workspaceAnnouncements).toBe(true);
    expect(parsed.deadlineReminders).toBe(false);
  });
});


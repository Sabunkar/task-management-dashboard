import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { User, UserNotificationPreferences } from '../../core/models/user.model';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  const mockUser: User = {
    id: 'usr-1',
    name: 'John Doe',
    email: 'john.doe@pulsetask.com',
    role: 'Project Manager',
    createdAt: '2026-01-15T09:00:00Z'
  };

  const mockNotifs: UserNotificationPreferences = {
    taskAssigned: true,
    deadlineReminders: true,
    projectUpdates: true,
    workspaceAnnouncements: false
  };

  let authServiceSpy: {
    currentUser$: BehaviorSubject<User | null>;
    currentUser: User | null;
    changePassword: ReturnType<typeof vi.fn>;
  };

  let settingsServiceSpy: {
    theme$: BehaviorSubject<'light' | 'dark'>;
    currentTheme: 'light' | 'dark';
    setTheme: ReturnType<typeof vi.fn>;
    notificationPreferences$: BehaviorSubject<UserNotificationPreferences>;
    currentNotifications: UserNotificationPreferences;
    updateNotificationPreferences: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceSpy = {
      currentUser$: new BehaviorSubject<User | null>(mockUser),
      currentUser: mockUser,
      changePassword: vi.fn()
    };

    settingsServiceSpy = {
      theme$: new BehaviorSubject<'light' | 'dark'>('light'),
      currentTheme: 'light',
      setTheme: vi.fn(),
      notificationPreferences$: new BehaviorSubject<UserNotificationPreferences>(mockNotifs),
      currentNotifications: mockNotifs,
      updateNotificationPreferences: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize on general settings tab by default', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('general');
    expect(component.currentUser()?.name).toBe('John Doe');
  });

  it('should allow switching between settings tabs', () => {
    component.activeTab.set('appearance');
    expect(component.activeTab()).toBe('appearance');

    component.activeTab.set('notifications');
    expect(component.activeTab()).toBe('notifications');

    component.activeTab.set('security');
    expect(component.activeTab()).toBe('security');
  });

  it('should delegate theme selection to SettingsService', () => {
    component.onSelectTheme('dark');
    expect(settingsServiceSpy.setTheme).toHaveBeenCalledWith('dark');
    expect(component.themeSuccessNotice()).toContain('Dark');
  });

  it('should delegate notification toggling to SettingsService', () => {
    const mockEvent = { target: { checked: true } } as unknown as Event;
    component.onToggleNotif('workspaceAnnouncements', mockEvent);

    expect(settingsServiceSpy.updateNotificationPreferences).toHaveBeenCalledWith({
      workspaceAnnouncements: true
    });
  });

  it('should validate change password form matching and minimum length', () => {
    component.passwordForm.patchValue({
      currentPassword: 'password123',
      newPassword: 'short',
      confirmNewPassword: 'differentPassword'
    });
    component.passwordForm.get('confirmNewPassword')?.markAsTouched();

    expect(component.passwordForm.get('newPassword')?.valid).toBe(false);
    expect(component.getNewPasswordErrorMessage()).toContain('at least 6 characters');
    expect(component.passwordForm.hasError('passwordMismatch')).toBe(true);
    expect(component.hasPasswordMismatch()).toBe(true);
  });

  it('should call authService.changePassword on valid submission and display success', () => {
    authServiceSpy.changePassword.mockReturnValue(of(true));

    component.passwordForm.patchValue({
      currentPassword: 'password123',
      newPassword: 'newValidPassword123',
      confirmNewPassword: 'newValidPassword123'
    });

    expect(component.passwordForm.valid).toBe(true);

    component.onChangePasswordSubmit();

    expect(authServiceSpy.changePassword).toHaveBeenCalledWith({
      currentPassword: 'password123',
      newPassword: 'newValidPassword123'
    });
    expect(component.passwordSuccessMessage()).toContain('Password successfully updated');
  });

  it('should display error message when authService.changePassword rejects current password', () => {
    authServiceSpy.changePassword.mockReturnValue(
      throwError(() => new Error('The current password entered is incorrect.'))
    );

    component.passwordForm.patchValue({
      currentPassword: 'wrongPassword',
      newPassword: 'newValidPassword123',
      confirmNewPassword: 'newValidPassword123'
    });

    component.onChangePasswordSubmit();

    expect(component.passwordErrorMessage()).toBe('The current password entered is incorrect.');
  });
});


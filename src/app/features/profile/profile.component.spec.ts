import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const mockUser: User = {
    id: 'usr-1',
    name: 'John Doe',
    email: 'john.doe@pulsetask.com',
    role: 'Project Manager',
    department: 'Engineering & Product',
    createdAt: '2026-01-15T09:00:00Z'
  };

  let currentUserSubject: BehaviorSubject<User | null>;
  let authServiceSpy: {
    currentUser$: BehaviorSubject<User | null>;
    currentUser: User | null;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);

    authServiceSpy = {
      currentUser$: currentUserSubject,
      get currentUser() {
        return currentUserSubject.value;
      },
      updateProfile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and render user details from AuthService', () => {
    expect(component).toBeTruthy();
    expect(component.currentUser()?.name).toBe('John Doe');
    expect(component.userInitials()).toBe('JD');
    expect(component.isEditing()).toBe(false);
  });

  it('should calculate profile completion percentage accurately', () => {
    // Has name, email, role, dept (80%), but no avatar photo
    expect(component.completionPercentage()).toBe(80);

    // Provide avatar preview -> should reach 100%
    component.previewAvatarUrl.set('https://example.com/photo.jpg');
    expect(component.completionPercentage()).toBe(100);
  });

  it('should enable edit mode and prefill reactive form with current user values', () => {
    component.enableEditing();
    expect(component.isEditing()).toBe(true);
    expect(component.profileForm.get('name')?.value).toBe('John Doe');
    expect(component.profileForm.get('email')?.value).toBe('john.doe@pulsetask.com');
    expect(component.profileForm.get('role')?.value).toBe('Project Manager');
    expect(component.profileForm.get('department')?.value).toBe('Engineering & Product');
  });

  it('should invalidate form when email is invalid', () => {
    component.enableEditing();
    component.profileForm.patchValue({ email: 'not-an-email' });
    expect(component.profileForm.get('email')?.valid).toBe(false);
    expect(component.getEmailErrorMessage()).toContain('valid email format');
  });

  it('should call authService.updateProfile on valid submission and display success notice', () => {
    const updatedUser: User = {
      ...mockUser,
      name: 'Johnathan Doe',
      department: 'Executive Leadership'
    };
    authServiceSpy.updateProfile.mockReturnValue(of(updatedUser));

    component.enableEditing();
    component.profileForm.patchValue({
      name: 'Johnathan Doe',
      department: 'Executive Leadership'
    });

    component.onSaveProfile();

    expect(authServiceSpy.updateProfile).toHaveBeenCalledWith({
      name: 'Johnathan Doe',
      email: 'john.doe@pulsetask.com',
      role: 'Project Manager',
      department: 'Executive Leadership',
      avatarUrl: undefined
    });
    expect(component.isEditing()).toBe(false);
    expect(component.successMessage()).toContain('Profile successfully updated');
  });

  it('should display error notice if updateProfile rejects with duplicate email error', () => {
    authServiceSpy.updateProfile.mockReturnValue(
      throwError(() => new Error('An account with this email address already exists.'))
    );

    component.enableEditing();
    component.profileForm.patchValue({ email: 'sarah.jenkins@pulsetask.com' });

    component.onSaveProfile();

    expect(component.isSaving()).toBe(false);
    expect(component.errorMessage()).toContain('already exists');
  });
});


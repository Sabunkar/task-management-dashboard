import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { User, AuthSession } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created and start unauthenticated if storage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser).toBeNull();
    expect(service.isAuthenticated).toBe(false);
  });

  it('should authenticate valid user credentials with rememberMe = true and persist in localStorage', async () => {
    const res = await firstValueFrom(service.login({
      email: 'john.doe@pulsetask.com',
      password: 'password123',
      rememberMe: true
    }));

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe('john.doe@pulsetask.com');
    expect(res.user.name).toBe('John Doe');
    expect(service.isAuthenticated).toBe(true);
    expect(service.currentUser?.id).toBe('usr-1');

    // Password must NEVER be exposed on the returned user
    expect((res.user as any).password).toBeUndefined();

    // Verify localStorage has the session
    const stored = localStorage.getItem('pulsetask_session');
    expect(stored).toBeTruthy();
    const session: AuthSession = JSON.parse(stored!);
    expect(session.user.email).toBe('john.doe@pulsetask.com');
    expect(session.rememberMe).toBe(true);
    expect((session.user as any).password).toBeUndefined();
  });

  it('should authenticate user with rememberMe = false and persist in sessionStorage', async () => {
    await firstValueFrom(service.login({
      email: 'sarah.jenkins@pulsetask.com',
      password: 'password123',
      rememberMe: false
    }));

    expect(service.isAuthenticated).toBe(true);
    expect(service.currentUser?.name).toBe('Sarah Jenkins');

    // Should NOT be in localStorage, but in sessionStorage
    expect(localStorage.getItem('pulsetask_session')).toBeNull();
    expect(sessionStorage.getItem('pulsetask_session')).toBeTruthy();
  });

  it('should reject invalid credentials and not authenticate', async () => {
    let errorReceived: Error | undefined;

    try {
      await firstValueFrom(service.login({
        email: 'john.doe@pulsetask.com',
        password: 'wrongpassword'
      }));
    } catch (err: any) {
      errorReceived = err;
    }

    expect(errorReceived).toBeDefined();
    expect(errorReceived?.message).toContain('Invalid email or password');
    expect(service.isAuthenticated).toBe(false);
    expect(service.currentUser).toBeNull();
  });

  it('should register a new user and automatically log them in', async () => {
    const res = await firstValueFrom(service.register({
      name: 'Elena Rostova',
      email: 'elena.rostova@pulsetask.com',
      password: 'password123',
      role: 'Designer',
      department: 'Creative Lab'
    }));

    expect(res.user).toBeDefined();
    expect(res.user.name).toBe('Elena Rostova');
    expect(res.user.role).toBe('Designer');
    expect(service.isAuthenticated).toBe(true);
    expect(service.currentUser?.email).toBe('elena.rostova@pulsetask.com');

    // Newly registered user can now sign in with their password
    service.logout();
    expect(service.isAuthenticated).toBe(false);

    const reLogin = await firstValueFrom(service.login({
      email: 'elena.rostova@pulsetask.com',
      password: 'password123'
    }));
    expect(reLogin.user.name).toBe('Elena Rostova');
  });

  it('should prevent registration with a duplicate email address', async () => {
    let errorReceived: Error | undefined;

    try {
      await firstValueFrom(service.register({
        name: 'Imposter John',
        email: 'john.doe@pulsetask.com',
        password: 'newpassword123',
        role: 'Developer'
      }));
    } catch (err: any) {
      errorReceived = err;
    }

    expect(errorReceived).toBeDefined();
    expect(errorReceived?.message).toContain('already exists');
  });

  it('should restore session from storage on page refresh', () => {
    const mockSession: AuthSession = {
      token: 'mock-token-xyz',
      user: {
        id: 'usr-10',
        name: 'David Kim',
        email: 'david@pulsetask.com',
        role: 'Admin',
        createdAt: '2026-01-01T00:00:00Z'
      },
      rememberMe: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('pulsetask_session', JSON.stringify(mockSession));

    const restored = service.restoreSession();
    expect(restored).toBe(true);
    expect(service.isAuthenticated).toBe(true);
    expect(service.currentUser?.name).toBe('David Kim');
  });

  it('should logout cleanly, wipe web storage, reset state, and navigate to login', async () => {
    // Populate session
    localStorage.setItem('pulsetask_session', JSON.stringify({ token: 'abc', user: {} }));
    sessionStorage.setItem('pulsetask_session', JSON.stringify({ token: 'abc', user: {} }));

    await firstValueFrom(service.logout());

    expect(service.currentUser).toBeNull();
    expect(service.isAuthenticated).toBe(false);
    expect(localStorage.getItem('pulsetask_session')).toBeNull();
    expect(sessionStorage.getItem('pulsetask_session')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  describe('Phase 8: User Profile & Security Operations', () => {
    beforeEach(async () => {
      // Authenticate as John Doe for profile tests
      await firstValueFrom(service.login({
        email: 'john.doe@pulsetask.com',
        password: 'password123',
        rememberMe: true
      }));
    });

    it('should update user profile details, broadcast to stream, and update storage without password', async () => {
      const updated = await firstValueFrom(service.updateProfile({
        name: 'Jonathan Doe',
        email: 'john.doe@pulsetask.com',
        role: 'Admin',
        department: 'Platform Architecture',
        avatarUrl: 'https://example.com/avatar.jpg'
      }));

      expect(updated.name).toBe('Jonathan Doe');
      expect(updated.role).toBe('Admin');
      expect(updated.department).toBe('Platform Architecture');
      expect(updated.avatarUrl).toBe('https://example.com/avatar.jpg');

      // AuthService state must reflect updated user
      expect(service.currentUser?.name).toBe('Jonathan Doe');
      expect(service.currentUser?.role).toBe('Admin');

      // Storage session must reflect updated user and NEVER include a password
      const stored = localStorage.getItem('pulsetask_session');
      expect(stored).toBeTruthy();
      const session: AuthSession = JSON.parse(stored!);
      expect(session.user.name).toBe('Jonathan Doe');
      expect((session.user as any).password).toBeUndefined();
    });

    it('should prevent updating email to one that is already registered by another user', async () => {
      let errorReceived: Error | undefined;

      try {
        await firstValueFrom(service.updateProfile({
          name: 'John Doe',
          email: 'sarah.jenkins@pulsetask.com', // Duplicate of Sarah
          role: 'Project Manager'
        }));
      } catch (err: any) {
        errorReceived = err;
      }

      expect(errorReceived).toBeDefined();
      expect(errorReceived?.message).toContain('already exists');
    });

    it('should change password successfully with in-memory credential update', async () => {
      const success = await firstValueFrom(service.changePassword({
        currentPassword: 'password123',
        newPassword: 'newSuperSecret99!'
      }));

      expect(success).toBe(true);

      // Verify password was NOT stored in Web Storage
      const stored = localStorage.getItem('pulsetask_session');
      expect(stored).not.toContain('newSuperSecret99!');
      expect(stored).not.toContain('password');

      // Logout and login with the new password
      await firstValueFrom(service.logout());

      const reLogin = await firstValueFrom(service.login({
        email: 'john.doe@pulsetask.com',
        password: 'newSuperSecret99!'
      }));

      expect(reLogin.user).toBeDefined();
      expect(service.isAuthenticated).toBe(true);
    });

    it('should reject password change when current password is wrong', async () => {
      let errorReceived: Error | undefined;

      try {
        await firstValueFrom(service.changePassword({
          currentPassword: 'wrongPassword123',
          newPassword: 'brandNewPassword'
        }));
      } catch (err: any) {
        errorReceived = err;
      }

      expect(errorReceived).toBeDefined();
      expect(errorReceived?.message).toContain('current password entered is incorrect');
    });

    it('should reject password change when new password is under 6 characters', async () => {
      let errorReceived: Error | undefined;

      try {
        await firstValueFrom(service.changePassword({
          currentPassword: 'password123',
          newPassword: '123'
        }));
      } catch (err: any) {
        errorReceived = err;
      }

      expect(errorReceived).toBeDefined();
      expect(errorReceived?.message).toContain('at least 6 characters');
    });
  });
});

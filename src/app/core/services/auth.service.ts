import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, AuthResponse, LoginCredentials, RegisterData, MockUserRecord, AuthSession, ProfileUpdateData, PasswordChangeData } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly STORAGE_KEY = 'pulsetask_session';

  // In-memory mock credential database (passwords are strictly kept in memory, never written to browser storage)
  private mockUsers: MockUserRecord[] = [
    {
      id: 'usr-1',
      name: 'John Doe',
      email: 'john.doe@pulsetask.com',
      password: 'password123',
      role: 'Project Manager',
      department: 'Engineering & Product',
      createdAt: '2026-01-15T09:00:00Z'
    },
    {
      id: 'usr-2',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@pulsetask.com',
      password: 'password123',
      role: 'Developer',
      department: 'Frontend Engineering',
      createdAt: '2026-02-10T11:30:00Z'
    },
    {
      id: 'usr-3',
      name: 'Mike Chen',
      email: 'mike.chen@pulsetask.com',
      password: 'password123',
      role: 'Designer',
      department: 'Product Design',
      createdAt: '2026-03-05T14:15:00Z'
    },
    {
      id: 'usr-4',
      name: 'Alex Morgan',
      email: 'alex.morgan@pulsetask.com',
      password: 'password123',
      role: 'Admin',
      department: 'Operations',
      createdAt: '2026-01-01T08:00:00Z'
    }
  ];

  // Reactive state management
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  /**
   * Current authenticated user snapshot
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Current authentication status snapshot
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Checks whether code is running in a browser environment with Web Storage API
   */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Restores user session from localStorage or sessionStorage after browser refresh.
   * Never stores or restores raw passwords.
   */
  restoreSession(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      // Check persistent localStorage first, then temporary sessionStorage
      const rawSession = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
      if (!rawSession) {
        return false;
      }

      const session: AuthSession = JSON.parse(rawSession);
      if (session && session.user && session.token) {
        this.currentUserSubject.next(session.user);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
    } catch {
      this.clearStorage();
    }

    return false;
  }

  /**
   * Authenticate user with mock credentials.
   * Simulates async network request with delay for realistic UI loading feedback.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const normalizedEmail = (credentials.email || '').trim().toLowerCase();
    const candidate = this.mockUsers.find(
      u => u.email.toLowerCase() === normalizedEmail && u.password === credentials.password
    );

    if (!candidate) {
      return throwError(() => new Error('Invalid email or password. Please verify your credentials and try again.'));
    }

    // Omit sensitive password before creating user session
    const { password, ...safeUser } = candidate;
    const token = `mock-jwt-${safeUser.id}-${Date.now()}`;
    const session: AuthSession = {
      token,
      user: safeUser,
      rememberMe: !!credentials.rememberMe,
      timestamp: new Date().toISOString()
    };

    return of({ user: safeUser, token }).pipe(
      delay(350),
      tap(() => {
        this.saveSession(session, !!credentials.rememberMe);
        this.currentUserSubject.next(safeUser);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Register a new user account with duplicate email validation.
   * Automatically signs the new user in upon successful registration.
   */
  register(data: RegisterData): Observable<AuthResponse> {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const existing = this.mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return throwError(() => new Error('An account with this email address already exists. Please sign in instead.'));
    }

    const newUserRecord: MockUserRecord = {
      id: `usr-${this.mockUsers.length + 1}`,
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: data.role || 'Developer',
      department: data.department || 'Product Team',
      createdAt: new Date().toISOString()
    };

    this.mockUsers.push(newUserRecord);

    const { password, ...safeUser } = newUserRecord;
    const token = `mock-jwt-${safeUser.id}-${Date.now()}`;
    const session: AuthSession = {
      token,
      user: safeUser,
      rememberMe: true,
      timestamp: new Date().toISOString()
    };

    return of({ user: safeUser, token }).pipe(
      delay(400),
      tap(() => {
        this.saveSession(session, true);
        this.currentUserSubject.next(safeUser);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Update profile details for the authenticated user.
   * Performs email uniqueness check, updates in-memory mock store, updates storage, and broadcasts change.
   */
  updateProfile(data: ProfileUpdateData): Observable<User> {
    const current = this.currentUser;
    if (!current) {
      return throwError(() => new Error('No authenticated user session found.'));
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();

    // Check if new email is already used by another user
    const duplicate = this.mockUsers.find(
      u => u.id !== current.id && u.email.toLowerCase() === normalizedEmail
    );
    if (duplicate) {
      return throwError(() => new Error('An account with this email address already exists. Please choose a different email.'));
    }

    // Update in-memory user record
    const userIndex = this.mockUsers.findIndex(u => u.id === current.id);
    if (userIndex !== -1) {
      this.mockUsers[userIndex] = {
        ...this.mockUsers[userIndex],
        name: data.name.trim(),
        email: normalizedEmail,
        role: data.role,
        department: data.department !== undefined ? data.department : this.mockUsers[userIndex].department,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : this.mockUsers[userIndex].avatarUrl
      };
    }

    const updatedUser: User = {
      ...current,
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role,
      department: data.department !== undefined ? data.department : current.department,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl
    };

    // Update session in storage (preserving token & rememberMe, but omitting password)
    this.updatePersistedUser(updatedUser);

    // Notify all application subscribers immediately
    this.currentUserSubject.next(updatedUser);

    return of(updatedUser).pipe(delay(250));
  }

  /**
   * Update password for the current user.
   * Validates current password against in-memory mock record.
   * Strictly keeps passwords in memory ONLY — never persisted to localStorage or sessionStorage.
   */
  changePassword(data: PasswordChangeData): Observable<boolean> {
    const current = this.currentUser;
    if (!current) {
      return throwError(() => new Error('No authenticated user session found.'));
    }

    const userRecord = this.mockUsers.find(u => u.id === current.id);
    if (!userRecord) {
      return throwError(() => new Error('User record not found in system.'));
    }

    if (userRecord.password !== data.currentPassword) {
      return throwError(() => new Error('The current password entered is incorrect.'));
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      return throwError(() => new Error('New password must be at least 6 characters long.'));
    }

    // Update password in memory ONLY. Never write to Web Storage.
    userRecord.password = data.newPassword;

    return of(true).pipe(delay(300));
  }

  /**
   * Updates persisted user profile in localStorage/sessionStorage without touching the auth token
   */
  private updatePersistedUser(updatedUser: User): void {
    if (!this.isBrowser) return;

    try {
      const inLocal = localStorage.getItem(this.STORAGE_KEY);
      const inSession = sessionStorage.getItem(this.STORAGE_KEY);

      if (inLocal) {
        const session: AuthSession = JSON.parse(inLocal);
        session.user = updatedUser;
        session.timestamp = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      } else if (inSession) {
        const session: AuthSession = JSON.parse(inSession);
        session.user = updatedUser;
        session.timestamp = new Date().toISOString();
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }
    } catch (e) {
      console.warn('Could not update user in storage', e);
    }
  }

  /**
   * Terminate current session, clear web storage, and redirect to login
   */
  logout(): Observable<boolean> {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
    return of(true);
  }

  /**
   * Persists the session in localStorage (if rememberMe is set) or sessionStorage.
   * Plaintext passwords are NEVER stored in Web Storage.
   */
  private saveSession(session: AuthSession, rememberMe: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const serialized = JSON.stringify(session);
      if (rememberMe) {
        localStorage.setItem(this.STORAGE_KEY, serialized);
        sessionStorage.removeItem(this.STORAGE_KEY);
      } else {
        sessionStorage.setItem(this.STORAGE_KEY, serialized);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist session to Web Storage', e);
    }
  }

  /**
   * Clears session from both storage providers
   */
  private clearStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear session storage', e);
    }
  }

  /**
   * Pre-configured demo accounts for quick testing and evaluation
   */
  getDemoUsers(): { name: string; email: string; role: string; password: string }[] {
    return this.mockUsers.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      password: u.password
    }));
  }
}


import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
  let authServiceMock: { isAuthenticated: boolean };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/projects' } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: false
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authServiceMock.isAuthenticated = true;

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect unauthenticated users to /auth/login with returnUrl parameter', () => {
      authServiceMock.isAuthenticated = false;

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result instanceof UrlTree).toBe(true);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/auth/login?returnUrl=%2Fprojects');
    });
  });

  describe('guestGuard', () => {
    it('should allow unauthenticated users to access guest routes (e.g. login, register)', () => {
      authServiceMock.isAuthenticated = false;

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect already authenticated users away from guest routes to /dashboard', () => {
      authServiceMock.isAuthenticated = true;

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result instanceof UrlTree).toBe(true);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/dashboard');
    });
  });
});


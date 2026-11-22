import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that prevents already authenticated users from visiting guest-only pages (e.g. login, register).
 * Redirects logged-in users directly to /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  // Already logged in, redirect to protected workspace
  return router.createUrlTree(['/dashboard']);
};


import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that requires the user to be authenticated.
 * Redirects unauthenticated users to /auth/login with the returnUrl query parameter.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  // Preserve the intended destination in returnUrl query parameter
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};


import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-box">
      <div class="auth-header">
        <h2 class="title">Welcome Back</h2>
        <p class="subtitle">Sign in to your PulseTask workspace to manage your projects and tasks.</p>
      </div>

      <!-- Error Alert Banner -->
      @if (errorMessage()) {
        <div class="alert alert-danger" role="alert">
          <span class="material-symbols-outlined alert-icon">error</span>
          <div class="alert-content">
            <span class="alert-message">{{ errorMessage() }}</span>
          </div>
          <button type="button" class="alert-close" (click)="errorMessage.set(null)" aria-label="Dismiss">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Informational Banner -->
      @if (infoMessage()) {
        <div class="alert alert-info" role="alert">
          <span class="material-symbols-outlined alert-icon">info</span>
          <div class="alert-content">
            <span class="alert-message">{{ infoMessage() }}</span>
          </div>
          <button type="button" class="alert-close" (click)="infoMessage.set(null)" aria-label="Dismiss">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Login Reactive Form -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
        <!-- Email Field -->
        <div class="form-group">
          <label class="form-label" for="login-email">
            Email Address <span class="required">*</span>
          </label>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('email')">
            <span class="material-symbols-outlined input-icon">mail</span>
            <input 
              id="login-email"
              type="email" 
              class="form-control" 
              formControlName="email"
              placeholder="name@company.com" 
              autocomplete="email"
              [class.invalid-control]="isFieldInvalid('email')"
            />
          </div>
          @if (isFieldInvalid('email')) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ getEmailErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <div class="field-label-row">
            <label class="form-label" for="login-password">
              Password <span class="required">*</span>
            </label>
            <button 
              type="button" 
              class="btn-text-link" 
              (click)="onForgotPassword()"
              tabindex="-1"
            >
              Forgot password?
            </button>
          </div>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('password')">
            <span class="material-symbols-outlined input-icon">lock</span>
            <input 
              id="login-password"
              [type]="showPassword() ? 'text' : 'password'" 
              class="form-control" 
              formControlName="password"
              placeholder="••••••••" 
              autocomplete="current-password"
              [class.invalid-control]="isFieldInvalid('password')"
            />
            <button 
              type="button" 
              class="password-toggle-btn" 
              (click)="togglePasswordVisibility()" 
              [title]="showPassword() ? 'Hide password' : 'Show password'"
              aria-label="Toggle password visibility"
              tabindex="-1"
            >
              <span class="material-symbols-outlined">
                {{ showPassword() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          @if (isFieldInvalid('password')) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ getPasswordErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Remember Me Checkbox -->
        <div class="form-row-remember">
          <label class="checkbox-container">
            <input type="checkbox" formControlName="rememberMe" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">Keep me signed in on this device</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="btn btn-primary btn-submit" 
          [disabled]="isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            <span>Signing in...</span>
          } @else {
            <span>Sign In to Dashboard</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          }
        </button>
      </form>

      <!-- Quick Demo Credentials Section -->
      <div class="demo-section">
        <div class="demo-header">
          <span class="demo-badge">QUICK DEMO</span>
          <span class="demo-hint">Click any profile to test instant sign-in:</span>
        </div>
        <div class="demo-accounts-grid">
          @for (demo of demoUsers; track demo.email) {
            <button 
              type="button" 
              class="demo-account-pill" 
              (click)="useDemoAccount(demo.email, demo.password)"
              [title]="'Sign in as ' + demo.name + ' (' + demo.role + ')'"
            >
              <span class="demo-name">{{ demo.name }}</span>
              <span class="demo-role">{{ demo.role }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Footer Registration Link -->
      <div class="auth-footer">
        <span>Don't have an account? </span>
        <a routerLink="/auth/register" class="register-link">Create an account</a>
      </div>
    </div>
  `,
  styles: [`
    .login-box {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .auth-header {
      margin-bottom: 4px;
    }

    .title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-main);
      letter-spacing: -0.01em;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    .alert-danger {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-info {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .alert-icon {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-content {
      flex: 1;
      line-height: 1.4;
    }

    .alert-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
    }

    .alert-close:hover {
      opacity: 1;
    }

    .alert-close .material-symbols-outlined {
      font-size: 16px;
    }

    /* Form Styles */
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .required {
      color: #ef4444;
    }

    .btn-text-link {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }

    .btn-text-link:hover {
      text-decoration: underline;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      color: var(--color-text-muted);
      pointer-events: none;
      transition: color 0.15s ease;
    }

    .form-control {
      width: 100%;
      height: 42px;
      padding: 0 40px 0 38px;
      font-size: 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      color: var(--color-text-main);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
    }

    .input-wrapper.is-invalid .form-control {
      border-color: #ef4444;
    }

    .input-wrapper.is-invalid .input-icon {
      color: #ef4444;
    }

    .input-wrapper.is-invalid .form-control:focus {
      box-shadow: 0 0 0 3px rgb(239 68 68 / 0.15);
    }

    .password-toggle-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: var(--radius-sm);
    }

    .password-toggle-btn:hover {
      color: var(--color-text-main);
    }

    .password-toggle-btn .material-symbols-outlined {
      font-size: 18px;
    }

    .field-error {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 2px;
    }

    .field-error .material-symbols-outlined {
      font-size: 14px;
    }

    /* Checkbox */
    .form-row-remember {
      display: flex;
      align-items: center;
      margin-top: -2px;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      user-select: none;
    }

    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkbox-custom {
      height: 16px;
      width: 16px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .checkbox-container:hover input ~ .checkbox-custom {
      border-color: var(--color-primary);
    }

    .checkbox-container input:checked ~ .checkbox-custom {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox-container input:checked ~ .checkbox-custom::after {
      content: "";
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 2px;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      border-radius: var(--radius-md);
      margin-top: 4px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Demo Section */
    .demo-section {
      background-color: var(--color-bg-subtle, #f8fafc);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .demo-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .demo-badge {
      background-color: rgb(79 70 229 / 0.1);
      color: var(--color-primary);
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .demo-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .demo-accounts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .demo-account-pill {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 6px 10px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .demo-account-pill:hover {
      border-color: var(--color-primary);
      background-color: rgb(79 70 229 / 0.04);
      transform: translateY(-1px);
    }

    .demo-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .demo-role {
      font-size: 0.6875rem;
      color: var(--color-text-secondary);
    }

    /* Footer */
    .auth-footer {
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      border-top: 1px solid var(--color-border-subtle, #f1f5f9);
      padding-top: 14px;
    }

    .register-link {
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
    }

    .register-link:hover {
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);

  // Demo accounts for rapid evaluation
  demoUsers = this.authService.getDemoUsers();

  private returnUrl = '/dashboard';

  ngOnInit(): void {
    // Capture returnUrl from route query parameters if redirected by authGuard
    const queryUrl = this.route.snapshot.queryParams['returnUrl'];
    if (queryUrl) {
      this.returnUrl = queryUrl;
    }

    this.loginForm = this.fb.group({
      email: ['john.doe@pulsetask.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(val => !val);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getEmailErrorMessage(): string {
    const control = this.loginForm.get('email');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Email address is required.';
    if (control.errors['email']) return 'Please enter a valid email format (e.g. name@company.com).';
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('password');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Password is required.';
    if (control.errors['minlength']) return 'Password must be at least 6 characters.';
    return '';
  }

  useDemoAccount(email: string, password: string): void {
    this.loginForm.patchValue({ email, password });
    this.errorMessage.set(null);
    this.infoMessage.set(`Loaded demo credentials for ${email}. Click Sign In to enter.`);
  }

  onForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (email) {
      this.infoMessage.set(`Mock reset link has been dispatched to ${email}. For testing, use password 'password123'.`);
    } else {
      this.infoMessage.set('Enter your email address above to receive password reset instructions.');
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Login failed. Please verify your credentials.');
      }
    });
  }
}

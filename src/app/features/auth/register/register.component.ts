import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Custom cross-field validator to ensure password and confirmPassword match
 */
export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-box">
      <div class="auth-header">
        <h2 class="title">Create an Account</h2>
        <p class="subtitle">Join PulseTask today and collaborate seamlessly with your team.</p>
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

      <!-- Registration Reactive Form -->
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
        <!-- Full Name -->
        <div class="form-group">
          <label class="form-label" for="reg-name">
            Full Name <span class="required">*</span>
          </label>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('name')">
            <span class="material-symbols-outlined input-icon">badge</span>
            <input 
              id="reg-name"
              type="text" 
              class="form-control" 
              formControlName="name"
              placeholder="e.g. Alex Morgan" 
              autocomplete="name"
            />
          </div>
          @if (isFieldInvalid('name')) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ getNameErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Email Address -->
        <div class="form-group">
          <label class="form-label" for="reg-email">
            Work Email <span class="required">*</span>
          </label>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('email')">
            <span class="material-symbols-outlined input-icon">mail</span>
            <input 
              id="reg-email"
              type="email" 
              class="form-control" 
              formControlName="email"
              placeholder="alex@company.com" 
              autocomplete="email"
            />
          </div>
          @if (isFieldInvalid('email')) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ getEmailErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Role Selection -->
        <div class="form-group">
          <label class="form-label" for="reg-role">
            Workspace Role <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <span class="material-symbols-outlined input-icon">groups</span>
            <select id="reg-role" class="form-control form-select" formControlName="role">
              <option value="Developer">Developer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Designer">UI/UX Designer</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label" for="reg-password">
            Password <span class="required">*</span>
          </label>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('password')">
            <span class="material-symbols-outlined input-icon">lock</span>
            <input 
              id="reg-password"
              [type]="showPassword() ? 'text' : 'password'" 
              class="form-control" 
              formControlName="password"
              placeholder="At least 6 characters" 
              autocomplete="new-password"
            />
            <button 
              type="button" 
              class="password-toggle-btn" 
              (click)="showPassword.set(!showPassword())" 
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

        <!-- Confirm Password -->
        <div class="form-group">
          <label class="form-label" for="reg-confirm">
            Confirm Password <span class="required">*</span>
          </label>
          <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('confirmPassword') || hasPasswordMismatch()">
            <span class="material-symbols-outlined input-icon">check_circle</span>
            <input 
              id="reg-confirm"
              [type]="showConfirmPassword() ? 'text' : 'password'" 
              class="form-control" 
              formControlName="confirmPassword"
              placeholder="Re-enter password" 
              autocomplete="new-password"
            />
            <button 
              type="button" 
              class="password-toggle-btn" 
              (click)="showConfirmPassword.set(!showConfirmPassword())" 
              [title]="showConfirmPassword() ? 'Hide password' : 'Show password'"
              aria-label="Toggle confirm password visibility"
              tabindex="-1"
            >
              <span class="material-symbols-outlined">
                {{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          @if (isFieldInvalid('confirmPassword') || hasPasswordMismatch()) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ getConfirmPasswordErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Terms & Conditions Checkbox -->
        <div class="form-group">
          <label class="checkbox-container">
            <input type="checkbox" formControlName="terms" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">
              I agree to the <a href="javascript:void(0)" class="terms-link">Terms of Service</a> and <a href="javascript:void(0)" class="terms-link">Privacy Policy</a>.
            </span>
          </label>
          @if (isFieldInvalid('terms')) {
            <div class="field-error">
              <span class="material-symbols-outlined">warning</span>
              <span>You must accept the terms of service to create an account.</span>
            </div>
          }
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="btn btn-primary btn-submit" 
          [disabled]="isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            <span>Creating account...</span>
          } @else {
            <span>Create Free Account</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          }
        </button>
      </form>

      <!-- Footer Login Link -->
      <div class="auth-footer">
        <span>Already have an account? </span>
        <a routerLink="/auth/login" class="login-link">Sign in</a>
      </div>
    </div>
  `,
  styles: [`
    .register-box {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .auth-header {
      margin-bottom: 2px;
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

    /* Forms */
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .required {
      color: #ef4444;
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

    .form-select {
      appearance: auto;
      cursor: pointer;
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
    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      user-select: none;
      margin-top: 2px;
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
      flex-shrink: 0;
      margin-top: 2px;
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

    .terms-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .terms-link:hover {
      text-decoration: underline;
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

    /* Footer */
    .auth-footer {
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      border-top: 1px solid var(--color-border-subtle, #f1f5f9);
      padding-top: 14px;
    }

    .login-link {
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm!: FormGroup;
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['Developer', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, {
      validators: [passwordMatchValidator]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasPasswordMismatch(): boolean {
    const confirmControl = this.registerForm.get('confirmPassword');
    const isTouched = confirmControl && (confirmControl.dirty || confirmControl.touched);
    return !!(isTouched && this.registerForm.hasError('passwordMismatch'));
  }

  getNameErrorMessage(): string {
    const control = this.registerForm.get('name');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Full name is required.';
    if (control.errors['minlength']) return 'Name must be at least 2 characters.';
    return '';
  }

  getEmailErrorMessage(): string {
    const control = this.registerForm.get('email');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Work email address is required.';
    if (control.errors['email']) return 'Please enter a valid email format (e.g. name@company.com).';
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.registerForm.get('password');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Password is required.';
    if (control.errors['minlength']) return 'Password must be at least 6 characters.';
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.errors?.['required']) return 'Please confirm your password.';
    if (this.registerForm.hasError('passwordMismatch')) return 'Passwords do not match.';
    return '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password, role } = this.registerForm.value;

    this.authService.register({ name, email, password, role }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Registration failed. Please try again.');
      }
    });
  }
}

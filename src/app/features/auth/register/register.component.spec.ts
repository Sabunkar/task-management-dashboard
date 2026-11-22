import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: { register: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      register: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create and initialize an invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.registerForm.valid).toBe(false);
  });

  it('should enforce password matching validation', () => {
    component.registerForm.patchValue({
      name: 'Maya Lin',
      email: 'maya@example.com',
      role: 'Designer',
      password: 'password123',
      confirmPassword: 'mismatchedPassword',
      terms: true
    });

    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    expect(component.registerForm.valid).toBe(false);
  });

  it('should require acceptance of terms and conditions', () => {
    component.registerForm.patchValue({
      name: 'Maya Lin',
      email: 'maya@example.com',
      role: 'Designer',
      password: 'password123',
      confirmPassword: 'password123',
      terms: false
    });

    expect(component.registerForm.get('terms')?.valid).toBe(false);
    expect(component.registerForm.valid).toBe(false);
  });

  it('should call authService.register and navigate to /dashboard on valid submission', () => {
    authServiceSpy.register.mockReturnValue(of({
      user: { id: 'usr-9', name: 'Maya Lin', email: 'maya@example.com' },
      token: 'mock-token-xyz'
    }));

    component.registerForm.patchValue({
      name: 'Maya Lin',
      email: 'maya@example.com',
      role: 'Designer',
      password: 'password123',
      confirmPassword: 'password123',
      terms: true
    });

    expect(component.registerForm.valid).toBe(true);

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Maya Lin',
      email: 'maya@example.com',
      password: 'password123',
      role: 'Designer'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should display error message when registration fails', () => {
    authServiceSpy.register.mockReturnValue(throwError(() => new Error('An account with this email address already exists.')));

    component.registerForm.patchValue({
      name: 'Maya Lin',
      email: 'maya@example.com',
      role: 'Designer',
      password: 'password123',
      confirmPassword: 'password123',
      terms: true
    });

    component.onSubmit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('An account with this email address already exists.');
  });
});


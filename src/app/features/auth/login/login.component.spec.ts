import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: { login: ReturnType<typeof vi.fn>; getDemoUsers: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn(),
      getDemoUsers: vi.fn().mockReturnValue([
        { name: 'John Doe', email: 'john.doe@pulsetask.com', role: 'Project Manager', password: 'password123' },
        { name: 'Sarah Jenkins', email: 'sarah.jenkins@pulsetask.com', role: 'Developer', password: 'password123' }
      ])
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { returnUrl: '/projects' }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should initialize form with default demo values and capture returnUrl', () => {
    expect(component).toBeTruthy();
    expect(component.loginForm.valid).toBe(true);
    expect(component.loginForm.get('email')?.value).toBe('john.doe@pulsetask.com');
  });

  it('should invalidate form when email format is invalid', () => {
    component.loginForm.patchValue({ email: 'invalid-email' });
    expect(component.loginForm.get('email')?.valid).toBe(false);
    expect(component.getEmailErrorMessage()).toContain('valid email format');
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });

  it('should prefill credentials when demo account is clicked', () => {
    component.useDemoAccount('sarah.jenkins@pulsetask.com', 'password123');
    expect(component.loginForm.get('email')?.value).toBe('sarah.jenkins@pulsetask.com');
    expect(component.infoMessage()).toContain('sarah.jenkins@pulsetask.com');
  });

  it('should call authService.login and navigate to returnUrl on successful submission', async () => {
    authServiceSpy.login.mockReturnValue(of({ user: { id: 'usr-1', name: 'John' }, token: 'mock-token' }));

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'john.doe@pulsetask.com',
      password: 'password123',
      rememberMe: true
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/projects');
  });

  it('should display error message on failed login attempt', () => {
    authServiceSpy.login.mockReturnValue(throwError(() => new Error('Invalid email or password.')));

    component.onSubmit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Invalid email or password.');
  });
});


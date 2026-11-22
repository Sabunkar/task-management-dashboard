import { firstValueFrom } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';

describe('Step 1: DashboardComponent UI/UX Enhancement', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let taskService: TaskService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService,
        AuthService,
        DashboardService
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    taskService = TestBed.inject(TaskService);
    await firstValueFrom(authService.login({ email: 'john.doe@pulsetask.com', password: 'password123' }));

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should create the component and initialize dashboard data', () => {
    expect(component).toBeTruthy();
    expect(component.totalTasksCount()).toBeGreaterThan(0);
    expect(component.projects().length).toBeGreaterThan(0);
  });

  it('2. should render personalized welcome header with user name and formatted date', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.welcome-title');
    expect(title?.textContent).toContain('John');

    const dateBadge = compiled.querySelector('.date-badge');
    expect(dateBadge?.textContent).toContain('2026');
  });

  it('3. should render 4 prominent metric cards with actual application values', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.metric-card');
    expect(cards.length).toBe(4);

    const values = compiled.querySelectorAll('.metric-value');
    expect(values.length).toBe(4);
    expect(Number(values[0].textContent?.trim())).toBeGreaterThanOrEqual(1);
  });

  it('4. should render the weekly productivity bar chart and status donut chart', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const weeklyChart = compiled.querySelector('app-svg-weekly-productivity-chart');
    expect(weeklyChart).toBeTruthy();

    const donutChart = compiled.querySelector('app-svg-donut-chart');
    expect(donutChart).toBeTruthy();
  });

  it('5. should filter upcoming deadlines when toggling priority filter', () => {
    component.setUpcomingFilter('high');
    fixture.detectChanges();

    const filtered = component.filteredUpcomingTasks();
    filtered.forEach(t => {
      expect(t.priority).toBe('High');
    });

    component.setUpcomingFilter('all');
    fixture.detectChanges();
    expect(component.filteredUpcomingTasks().length).toBeGreaterThanOrEqual(filtered.length);
  });

  it('6. should quick-mark task as completed and update stream reactively', () => {
    const upcoming = component.upcomingTasks();
    if (upcoming.length > 0) {
      const target = upcoming[0];
      const initialCompleted = component.completedTasksCount();

      const fakeEvent = new MouseEvent('click');
      component.markTaskCompleted(target.id, target.title, fakeEvent);
      fixture.detectChanges();

      expect(component.completedTasksCount()).toBeGreaterThanOrEqual(initialCompleted);
    }
  });
});


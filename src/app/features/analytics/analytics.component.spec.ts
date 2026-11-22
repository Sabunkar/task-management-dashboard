import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsComponent } from './analytics.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { MockDataService } from '../../core/services/mock-data.service';

describe('Phase 11: AnalyticsComponent', () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService,
        AnalyticsService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    analyticsService = TestBed.inject(AnalyticsService);
    fixture.detectChanges();
  });

  it('1. should create the component and initialize overview metrics', () => {
    expect(component).toBeTruthy();
    expect(component.overviewMetrics().totalTasks).toBeGreaterThan(0);
    expect(component.overviewMetrics().totalProjects).toBeGreaterThan(0);
  });

  it('2. should render the page title and intelligence badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.page-title');
    expect(title?.textContent).toContain('Reports & Analytics');

    const badge = compiled.querySelector('.badge-primary');
    expect(badge?.textContent).toContain('Pulse Intelligence');
  });

  it('3. should switch date range presets when buttons are clicked', () => {
    component.setPreset('last_7_days');
    fixture.detectChanges();

    expect(component.selectedPreset()).toBe('last_7_days');
    expect(analyticsService.currentDateFilter.preset).toBe('last_7_days');

    component.setPreset('this_year');
    fixture.detectChanges();
    expect(component.selectedPreset()).toBe('this_year');
  });

  it('4. should render overview metric values in the DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const metricValues = compiled.querySelectorAll('.metric-value');
    expect(metricValues.length).toBeGreaterThanOrEqual(4);
  });

  it('5. should trigger custom date range application', () => {
    component.setPreset('custom');
    component.customStartDate.set('2026-11-01');
    component.customEndDate.set('2026-11-20');
    component.applyCustomRange();

    expect(analyticsService.currentDateFilter.preset).toBe('custom');
    expect(analyticsService.currentDateFilter.startDate).toBe('2026-11-01');
    expect(analyticsService.currentDateFilter.endDate).toBe('2026-11-20');
  });

  it('6. should execute task and project CSV exports gracefully', () => {
    expect(() => component.exportTasksCsv()).not.toThrow();
    expect(component.exportToast()).toContain('Tasks CSV report exported');

    expect(() => component.exportProjectsCsv()).not.toThrow();
    expect(component.exportToast()).toContain('Projects CSV report exported');
  });

  it('7. should handle window.print call without throwing', () => {
    const originalPrint = window.print;
    let printCalled = false;
    window.print = () => { printCalled = true; };

    try {
      component.printReport();
      expect(printCalled).toBe(true);
    } finally {
      window.print = originalPrint;
    }
  });
});


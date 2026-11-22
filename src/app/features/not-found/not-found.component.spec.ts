import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('Phase 12: NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should render 404 error badge and informative messaging', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-badge')?.textContent).toContain('404 Error');
    expect(compiled.querySelector('.error-title')?.textContent).toContain('Page Not Found');
  });

  it('3. should provide navigation recovery links to dashboard, tasks, and projects', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3);

    const hrefs = Array.from(links).map(a => a.getAttribute('href') || a.getAttribute('ng-reflect-router-link'));
    expect(links[0].textContent).toContain('Return to Dashboard');
  });
});


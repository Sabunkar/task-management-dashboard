import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-container">
      <div class="card not-found-card">
        <div class="error-badge">404 Error</div>
        <div class="icon-circle">
          <span class="material-symbols-outlined">search_off</span>
        </div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-description">
          The requested route does not exist or has been moved to a different workspace location.
        </p>
        
        <div class="action-buttons">
          <a routerLink="/dashboard" class="btn btn-primary">
            <span class="material-symbols-outlined">dashboard</span>
            <span>Return to Dashboard</span>
          </a>
          <a routerLink="/tasks" class="btn btn-secondary">
            <span class="material-symbols-outlined">task_alt</span>
            <span>Browse All Tasks</span>
          </a>
          <a routerLink="/projects" class="btn btn-secondary">
            <span class="material-symbols-outlined">folder_open</span>
            <span>View Projects</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 180px);
      padding: 40px 20px;
    }

    .not-found-card {
      max-width: 520px;
      width: 100%;
      padding: 48px 36px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius-xl);
      animation: fadeInScale 250ms ease;
    }

    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .error-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      border: 1px solid var(--color-danger-border);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .icon-circle .material-symbols-outlined {
      font-size: 40px;
    }

    .error-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-text-main);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .error-description {
      font-size: 0.9375rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin-bottom: 32px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .action-buttons .btn {
      width: 100%;
      padding: 10px 18px;
    }
  `]
})
export class NotFoundComponent {}


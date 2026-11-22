import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartItem {
  label: string;
  value: number;
  total?: number;
  color?: string;
  sublabel?: string;
}

@Component({
  selector: 'app-svg-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart-container">
      @if (!items || items.length === 0) {
        <div class="chart-empty-state">
          <span class="material-symbols-outlined empty-icon">bar_chart</span>
          <p>No project data available</p>
        </div>
      } @else {
        <div class="bars-list">
          @for (bar of items; track bar.label) {
            <div class="bar-row">
              <div class="bar-label-group">
                <span class="bar-label" [title]="bar.label">{{ bar.label }}</span>
                @if (bar.sublabel) {
                  <span class="bar-sublabel">{{ bar.sublabel }}</span>
                }
              </div>

              <div class="bar-track">
                <div 
                  class="bar-fill" 
                  [style.width.%]="getPercentage(bar)"
                  [style.background-color]="bar.color || 'var(--color-primary)'"
                ></div>
              </div>

              <div class="bar-value-badge">
                <strong>{{ bar.value }}%</strong>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .bar-chart-container {
      width: 100%;
    }

    .bars-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.8125rem;
    }

    .bar-label-group {
      width: 150px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .bar-label {
      font-weight: 700;
      color: var(--color-text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-sublabel {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin-top: 1px;
    }

    .bar-track {
      flex: 1;
      height: 10px;
      background-color: var(--color-surface-hover);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--color-border);
    }

    .bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 400ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bar-value-badge {
      width: 44px;
      text-align: right;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }

    .chart-empty-state {
      padding: 30px;
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }

    .chart-empty-state .empty-icon {
      font-size: 36px;
      margin-bottom: 6px;
      opacity: 0.4;
    }
  `]
})
export class SvgBarChartComponent {
  @Input() items: BarChartItem[] = [];

  getPercentage(bar: BarChartItem): number {
    if (bar.total && bar.total > 0) {
      return Math.min(100, Math.round((bar.value / bar.total) * 100));
    }
    return Math.min(100, Math.max(0, bar.value));
  }
}


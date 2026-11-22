import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DistributionItem } from '../../../core/models/analytics.model';

interface DonutSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

@Component({
  selector: 'app-svg-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-chart-container">
      @if (totalCount() === 0) {
        <div class="chart-empty-state">
          <span class="material-symbols-outlined empty-icon">pie_chart</span>
          <p>No distribution data available</p>
        </div>
      } @else {
        <div class="svg-wrapper">
          <svg viewBox="0 0 200 200" class="donut-svg" role="img" [attr.aria-label]="centerTitle">
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="transparent"
              stroke="var(--color-surface-active)"
              stroke-width="26"
            />
            
            @for (seg of segments(); track seg.label) {
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="transparent"
                [attr.stroke]="seg.color"
                stroke-width="26"
                [attr.stroke-dasharray]="seg.strokeDasharray"
                [attr.stroke-dashoffset]="seg.strokeDashoffset"
                stroke-linecap="round"
                class="donut-segment"
                [class.hovered]="hoveredItem()?.label === seg.label"
                (mouseenter)="onHover(seg)"
                (mouseleave)="onLeave()"
              />
            }

            <!-- Center Text -->
            <text x="100" y="93" text-anchor="middle" class="donut-center-value">
              {{ centerValue ? centerValue : totalCount() }}
            </text>
            <text x="100" y="115" text-anchor="middle" class="donut-center-title">
              {{ centerTitle }}
            </text>
          </svg>

          <!-- Interactive Tooltip Pill -->
          @if (hoveredItem()) {
            <div class="donut-tooltip">
              <span class="tooltip-dot" [style.background-color]="hoveredItem()!.color"></span>
              <span class="tooltip-label">{{ hoveredItem()!.label }}:</span>
              <strong>{{ hoveredItem()!.count }}</strong>
              <span class="tooltip-perc">({{ hoveredItem()!.percentage }}%)</span>
            </div>
          }
        </div>

        <!-- Legend Below -->
        <div class="donut-legend">
          @for (item of items; track item.label) {
            <div 
              class="legend-item" 
              [class.active]="hoveredItem()?.label === item.label"
              (mouseenter)="onHover(item)"
              (mouseleave)="onLeave()"
            >
              <span class="legend-color-dot" [style.background-color]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.count }}</span>
              <span class="legend-perc">{{ item.percentage }}%</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .donut-chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .svg-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
      margin: 8px 0;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      overflow: visible;
    }

    .donut-segment {
      transition: stroke-width var(--transition-fast), opacity var(--transition-fast);
      cursor: pointer;
    }

    .donut-segment:hover,
    .donut-segment.hovered {
      stroke-width: 30;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
    }

    .donut-center-value {
      transform: rotate(90deg);
      transform-origin: 100px 100px;
      font-size: 1.5rem;
      font-weight: 800;
      fill: var(--color-text-main);
      font-family: inherit;
    }

    .donut-center-title {
      transform: rotate(90deg);
      transform-origin: 100px 100px;
      font-size: 0.75rem;
      font-weight: 600;
      fill: var(--color-text-muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-family: inherit;
    }

    .donut-tooltip {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-text-main);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.6875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      box-shadow: var(--shadow-md);
      z-index: 10;
      pointer-events: none;
      animation: fadeIn 150ms ease;
    }

    .tooltip-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .tooltip-perc {
      opacity: 0.85;
      font-weight: 500;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-top: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }

    .legend-item:hover,
    .legend-item.active {
      background-color: var(--color-surface-hover);
    }

    .legend-color-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .legend-value {
      font-weight: 700;
      color: var(--color-text-main);
      margin-right: 8px;
    }

    .legend-perc {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      min-width: 36px;
      text-align: right;
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

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, 4px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class SvgDonutChartComponent {
  @Input() items: DistributionItem[] = [];
  @Input() centerTitle: string = 'Total';
  @Input() centerValue?: string | number;

  hoveredItem = signal<DistributionItem | null>(null);

  totalCount = computed(() => {
    return this.items.reduce((sum, item) => sum + item.count, 0);
  });

  segments = computed<DonutSegment[]>(() => {
    const total = this.totalCount();
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 70; // ~439.82
    let accumulatedOffset = 0;

    return this.items.map(item => {
      const segmentRatio = item.count / total;
      const strokeLength = segmentRatio * circumference;
      const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        label: item.label,
        count: item.count,
        percentage: item.percentage,
        color: item.color,
        strokeDasharray,
        strokeDashoffset
      };
    });
  });

  onHover(item: DistributionItem): void {
    this.hoveredItem.set(item);
  }

  onLeave(): void {
    this.hoveredItem.set(null);
  }
}


import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WeekDayProductivity {
  day: string;          // e.g. "Mon"
  dateLabel: string;    // e.g. "Nov 17"
  completedCount: number;
  createdCount: number;
}

@Component({
  selector: 'app-svg-weekly-productivity-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weekly-chart-wrapper">
      <!-- Chart Summary / Subtitle -->
      <div class="chart-top-bar">
        <div class="velocity-summary">
          <span class="velocity-number">{{ totalCompleted }}</span>
          <span class="velocity-label">Deliverables completed this week</span>
        </div>

        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-pill bg-completed"></span>
            <span>Completed</span>
          </div>
          <div class="legend-item">
            <span class="legend-pill bg-created"></span>
            <span>Created</span>
          </div>
        </div>
      </div>

      <!-- SVG Container -->
      <div class="chart-svg-box">
        <svg viewBox="0 0 520 180" class="weekly-svg" role="img" aria-label="Weekly productivity bar chart">
          <!-- Horizontal Subtle Gridlines -->
          <line x1="30" y1="20" x2="500" y2="20" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" />
          <line x1="30" y1="60" x2="500" y2="60" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" />
          <line x1="30" y1="100" x2="500" y2="100" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" />
          <line x1="30" y1="140" x2="500" y2="140" stroke="var(--color-border)" stroke-width="1.5" />

          <!-- Y-Axis Labels -->
          <text x="22" y="24" text-anchor="end" class="y-axis-label">{{ maxCount() }}</text>
          <text x="22" y="84" text-anchor="end" class="y-axis-label">{{ Math.round(maxCount() / 2) }}</text>
          <text x="22" y="144" text-anchor="end" class="y-axis-label">0</text>

          <!-- Day Columns -->
          @for (col of columnLayouts(); track col.raw.day) {
            <g class="day-group" (mouseenter)="onHover(col)" (mouseleave)="onLeave()">
              <!-- Hover Background Highlight -->
              <rect
                [attr.x]="col.colX - 8"
                y="15"
                width="64"
                height="130"
                rx="6"
                fill="transparent"
                class="hover-bg"
                [class.active]="activeCol()?.raw?.day === col.raw.day"
              />

              <!-- Created Bar (Indigo) -->
              <rect
                [attr.x]="col.colX"
                [attr.y]="col.createdY"
                width="20"
                [attr.height]="col.createdH"
                rx="4"
                fill="#4f46e5"
                class="bar-rect bar-created"
              />

              <!-- Completed Bar (Emerald) -->
              <rect
                [attr.x]="col.colX + 24"
                [attr.y]="col.completedY"
                width="20"
                [attr.height]="col.completedH"
                rx="4"
                fill="#10b981"
                class="bar-rect bar-completed"
              />

              <!-- Weekday Label -->
              <text
                [attr.x]="col.colX + 22"
                y="160"
                text-anchor="middle"
                class="day-axis-label"
                [class.active]="activeCol()?.raw?.day === col.raw.day"
              >
                {{ col.raw.day }}
              </text>
              <text
                [attr.x]="col.colX + 22"
                y="173"
                text-anchor="middle"
                class="date-sub-label"
              >
                {{ col.raw.dateLabel }}
              </text>
            </g>
          }
        </svg>

        <!-- Tooltip Popover -->
        @if (activeCol()) {
          <div 
            class="chart-tooltip"
            [class.align-left]="activeCol()!.percentX < 24"
            [class.align-right]="activeCol()!.percentX > 76"
            [style.left.%]="activeCol()!.percentX"
            [style.top.px]="activeCol()!.pixelY"
          >
            <div class="tooltip-header">{{ activeCol()!.raw.day }}, {{ activeCol()!.raw.dateLabel }}</div>
            <div class="tooltip-metric text-success">
              <span class="tooltip-dot bg-success"></span>
              <span>Completed:</span>
              <strong>{{ activeCol()!.raw.completedCount }} tasks</strong>
            </div>
            <div class="tooltip-metric text-primary">
              <span class="tooltip-dot bg-primary"></span>
              <span>Created:</span>
              <strong>{{ activeCol()!.raw.createdCount }} tasks</strong>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .weekly-chart-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .chart-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .velocity-summary {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .velocity-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      line-height: 1;
    }

    .velocity-label {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-pill {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    .bg-completed { background-color: #10b981; }
    .bg-created { background-color: #4f46e5; }

    .chart-svg-box {
      position: relative;
      width: 100%;
      height: 180px;
    }

    .weekly-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .y-axis-label {
      font-size: 10px;
      font-weight: 600;
      fill: var(--color-text-muted);
      font-family: inherit;
    }

    .day-axis-label {
      font-size: 11px;
      font-weight: 700;
      fill: var(--color-text-secondary);
      font-family: inherit;
      transition: fill var(--transition-fast);
    }

    .day-axis-label.active {
      fill: var(--color-primary);
    }

    .date-sub-label {
      font-size: 9px;
      font-weight: 500;
      fill: var(--color-text-muted);
      font-family: inherit;
    }

    .day-group {
      cursor: pointer;
    }

    .hover-bg {
      transition: fill var(--transition-fast);
    }

    .hover-bg:hover,
    .hover-bg.active {
      fill: var(--color-surface-hover);
      opacity: 0.8;
    }

    .bar-rect {
      transition: height 350ms cubic-bezier(0.16, 1, 0.3, 1), y 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity var(--transition-fast);
    }

    .bar-rect:hover {
      opacity: 0.85;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }

    .chart-tooltip {
      position: absolute;
      transform: translate(-50%, -100%);
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 30;
      min-width: 150px;
      margin-top: -10px;
      animation: fadeIn 150ms ease;
      white-space: nowrap;
    }

    .chart-tooltip.align-left {
      transform: translate(0, -100%);
    }

    .chart-tooltip.align-right {
      transform: translate(-100%, -100%);
    }

    .tooltip-header {
      font-size: 0.75rem;
      font-weight: 700;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 4px;
      margin-bottom: 4px;
    }

    .tooltip-metric {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      margin-top: 2px;
    }

    .tooltip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .text-success { color: #34d399; }
    .text-primary { color: #a5b4fc; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -90%); }
      to { opacity: 1; transform: translate(-50%, -100%); }
    }
  `]
})
export class SvgWeeklyProductivityChartComponent {
  @Input() weekData: WeekDayProductivity[] = [];
  @Input() totalCompleted: number = 0;

  activeCol = signal<{ raw: WeekDayProductivity; percentX: number; pixelY: number } | null>(null);
  protected readonly Math = Math;

  maxCount = computed(() => {
    let max = 4;
    this.weekData.forEach(d => {
      if (d.completedCount > max) max = d.completedCount;
      if (d.createdCount > max) max = d.createdCount;
    });
    return Math.ceil(max);
  });

  columnLayouts = computed(() => {
    const data = this.weekData;
    if (data.length === 0) return [];

    const startX = 40;
    const chartWidth = 460;
    const colSpacing = chartWidth / data.length;
    const baselineY = 140;
    const maxHeight = 115;
    const max = this.maxCount() || 1;

    return data.map((d, i) => {
      const colX = startX + i * colSpacing + (colSpacing - 44) / 2;

      // Heights (minimum 3px so 0 values remain visible)
      const createdH = Math.max(3, (d.createdCount / max) * maxHeight);
      const completedH = Math.max(3, (d.completedCount / max) * maxHeight);

      const createdY = baselineY - createdH;
      const completedY = baselineY - completedH;

      return {
        colX,
        createdH,
        createdY,
        completedH,
        completedY,
        raw: d
      };
    });
  });

  onHover(col: any): void {
    const svgBoxWidth = 520;
    const xRatio = (col.colX + 22) / svgBoxWidth;
    
    this.activeCol.set({
      raw: col.raw,
      percentX: Math.round(xRatio * 100), // as percentage of container width
      pixelY: Math.max(30, Math.min(col.createdY, col.completedY))
    });
  }

  onLeave(): void {
    this.activeCol.set(null);
  }
}


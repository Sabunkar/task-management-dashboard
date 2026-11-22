import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTrendPoint } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-svg-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trend-chart-container">
      @if (!hasSufficientData || points.length === 0) {
        <div class="chart-empty-state">
          <span class="material-symbols-outlined empty-icon">show_chart</span>
          <h4>Insufficient historical activity</h4>
          <p>No task creation or completion events were recorded in this timeframe. Try selecting "Last 30 Days" or "All Time".</p>
        </div>
      } @else {
        <!-- Chart Header Legend -->
        <div class="chart-legend-row">
          <div class="legend-badge">
            <span class="legend-indicator bg-primary"></span>
            <span>Tasks Created</span>
          </div>
          <div class="legend-badge">
            <span class="legend-indicator bg-success"></span>
            <span>Tasks Completed</span>
          </div>
        </div>

        <div class="svg-container">
          <svg viewBox="0 0 800 220" class="trend-svg" role="img" aria-label="Task completion trends over time">
            <defs>
              <!-- Created Gradient -->
              <linearGradient id="createdGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.0" />
              </linearGradient>

              <!-- Completed Gradient -->
              <linearGradient id="completedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Subtle Gridlines -->
            <line x1="50" y1="35" x2="760" y2="35" stroke="var(--color-border-subtle)" stroke-dasharray="4,4" />
            <line x1="50" y1="80" x2="760" y2="80" stroke="var(--color-border-subtle)" stroke-dasharray="4,4" />
            <line x1="50" y1="125" x2="760" y2="125" stroke="var(--color-border-subtle)" stroke-dasharray="4,4" />
            <line x1="50" y1="170" x2="760" y2="170" stroke="var(--color-border)" stroke-width="1.5" />

            <!-- Y-Axis Value Labels -->
            <text x="42" y="39" text-anchor="end" class="y-axis-label">{{ maxVal() }}</text>
            <text x="42" y="105" text-anchor="end" class="y-axis-label">{{ Math.round(maxVal() / 2) }}</text>
            <text x="42" y="174" text-anchor="end" class="y-axis-label">0</text>

            <!-- Created Tasks Area & Smooth Bezier Curve -->
            @if (createdAreaPath()) {
              <path [attr.d]="createdAreaPath()" fill="url(#createdGrad)" />
              <path [attr.d]="createdLinePath()" fill="none" stroke="#4f46e5" stroke-width="2.5" vector-effect="non-scaling-stroke" />
            }

            <!-- Completed Tasks Area & Smooth Bezier Curve -->
            @if (completedAreaPath()) {
              <path [attr.d]="completedAreaPath()" fill="url(#completedGrad)" />
              <path [attr.d]="completedLinePath()" fill="none" stroke="#10b981" stroke-width="2.5" vector-effect="non-scaling-stroke" />
            }

            <!-- Active Point Vertical Guide Line -->
            @if (activePoint()) {
              <line 
                [attr.x1]="activePoint()!.x" 
                y1="30" 
                [attr.x2]="activePoint()!.x" 
                y2="170" 
                stroke="#6366f1" 
                stroke-dasharray="3,3" 
                stroke-width="1.5"
                opacity="0.7"
              />
              <!-- Created Active Dot -->
              <circle
                [attr.cx]="activePoint()!.x"
                [attr.cy]="activePoint()!.createdY"
                r="6"
                fill="#4f46e5"
                stroke="#ffffff"
                stroke-width="2.5"
                class="active-dot"
              />
              <!-- Completed Active Dot -->
              <circle
                [attr.cx]="activePoint()!.x"
                [attr.cy]="activePoint()!.completedY"
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                stroke-width="2.5"
                class="active-dot"
              />
            }

            <!-- Milestone X-Axis Labels (Evenly Spaced, Non-Overlapping) -->
            @for (pt of computedPoints(); track pt.raw.isoDate; let idx = $index) {
              @if (isLabelVisible(idx)) {
                <!-- Tick Mark -->
                <line [attr.x1]="pt.x" y1="170" [attr.x2]="pt.x" y2="176" stroke="var(--color-border-strong)" stroke-width="1.2" />
                <!-- Milestone Label -->
                <text [attr.x]="pt.x" y="196" text-anchor="middle" class="axis-label">
                  {{ pt.raw.date }}
                </text>
              }
            }

            <!-- Hover Interaction Slices -->
            @for (pt of computedPoints(); track pt.raw.isoDate) {
              <rect
                [attr.x]="pt.x - (stepX() / 2)"
                y="20"
                [attr.width]="stepX()"
                height="155"
                fill="transparent"
                class="hover-slice"
                (mouseenter)="onHover(pt)"
                (mouseleave)="onLeave()"
              />
            }
          </svg>

          <!-- Interactive Tooltip Overlay (Clamped to prevent clipping) -->
          @if (activePoint()) {
            <div 
              class="trend-tooltip"
              [class.align-left]="activePoint()!.percentX < 20"
              [class.align-right]="activePoint()!.percentX > 80"
              [style.left.%]="activePoint()!.percentX"
              [style.top.px]="activePoint()!.yPixel"
            >
              <div class="tooltip-title">{{ activePoint()!.raw.date }}</div>
              <div class="tooltip-row text-primary">
                <span class="tooltip-dot bg-primary"></span>
                <span>Created:</span>
                <strong>{{ activePoint()!.raw.createdCount }} tasks</strong>
              </div>
              <div class="tooltip-row text-success">
                <span class="tooltip-dot bg-success"></span>
                <span>Completed:</span>
                <strong>{{ activePoint()!.raw.completedCount }} tasks</strong>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .trend-chart-container {
      width: 100%;
      position: relative;
    }

    .chart-legend-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 14px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .legend-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-indicator {
      width: 14px;
      height: 4px;
      border-radius: var(--radius-full);
    }

    .bg-primary { background-color: #4f46e5; }
    .bg-success { background-color: #10b981; }

    .svg-container {
      position: relative;
      width: 100%;
      height: 220px;
    }

    .trend-svg {
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

    .axis-label {
      font-size: 11px;
      font-weight: 600;
      fill: var(--color-text-secondary);
      font-family: inherit;
    }

    .hover-slice {
      cursor: crosshair;
    }

    .hover-slice:hover {
      fill: rgba(99, 102, 241, 0.04);
    }

    .active-dot {
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));
      transition: all 150ms ease;
    }

    .trend-tooltip {
      position: absolute;
      transform: translate(-50%, -100%);
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 30;
      min-width: 155px;
      margin-top: -10px;
      animation: fadeIn 150ms ease;
      white-space: nowrap;
    }

    .trend-tooltip.align-left {
      transform: translate(0, -100%);
    }

    .trend-tooltip.align-right {
      transform: translate(-100%, -100%);
    }

    .tooltip-title {
      font-weight: 700;
      margin-bottom: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 3px;
      font-size: 0.75rem;
    }

    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      margin-top: 3px;
    }

    .tooltip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .text-primary { color: #a5b4fc; }
    .text-success { color: #34d399; }

    .chart-empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--color-text-muted);
    }

    .chart-empty-state .empty-icon {
      font-size: 40px;
      margin-bottom: 8px;
      opacity: 0.4;
    }

    .chart-empty-state h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }

    .chart-empty-state p {
      font-size: 0.8125rem;
      max-width: 380px;
      margin: 0 auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -90%); }
      to { opacity: 1; transform: translate(-50%, -100%); }
    }
  `]
})
export class SvgTrendChartComponent {
  @Input() points: TaskTrendPoint[] = [];
  @Input() hasSufficientData: boolean = true;

  activePoint = signal<{ 
    raw: TaskTrendPoint; 
    x: number; 
    createdY: number; 
    completedY: number; 
    percentX: number; 
    yPixel: number 
  } | null>(null);

  protected readonly Math = Math;

  maxVal = computed(() => {
    let max = 1;
    this.points.forEach(p => {
      if (p.createdCount > max) max = p.createdCount;
      if (p.completedCount > max) max = p.completedCount;
    });
    return max + 1;
  });

  stepX = computed(() => {
    const pts = this.points;
    if (pts.length <= 1) return 100;
    const rangeX = 710; // 760 - 50
    return rangeX / (pts.length - 1);
  });

  computedPoints = computed(() => {
    const pts = this.points;
    if (pts.length === 0) return [];

    const startX = 50;
    const endX = 760;
    const rangeX = endX - startX;
    const stepX = pts.length > 1 ? rangeX / (pts.length - 1) : 0;

    const topY = 35;
    const bottomY = 170;
    const heightY = bottomY - topY;
    const max = this.maxVal();

    return pts.map((pt, i) => {
      const x = startX + i * stepX;
      const createdRatio = pt.createdCount / max;
      const completedRatio = pt.completedCount / max;

      const createdY = bottomY - createdRatio * heightY;
      const completedY = bottomY - completedRatio * heightY;

      return {
        x,
        createdY,
        completedY,
        raw: pt
      };
    });
  });

  isLabelVisible(index: number): boolean {
    const pts = this.points;
    if (pts.length <= 7) return true;
    const step = Math.ceil(pts.length / 5);
    // Show first, last, and every 'step' point
    return index === 0 || index === pts.length - 1 || index % step === 0;
  }

  // Smooth Catmull-Rom cubic bezier curve generator
  private buildSmoothCurve(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Cubic control points with 0.16 smoothing factor
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }

  createdLinePath = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    return this.buildSmoothCurve(pts.map(p => ({ x: p.x, y: p.createdY })));
  });

  createdAreaPath = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    const line = this.createdLinePath();
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    return `${line} L ${lastX.toFixed(1)} 170 L ${firstX.toFixed(1)} 170 Z`;
  });

  completedLinePath = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    return this.buildSmoothCurve(pts.map(p => ({ x: p.x, y: p.completedY })));
  });

  completedAreaPath = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    const line = this.completedLinePath();
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    return `${line} L ${lastX.toFixed(1)} 170 L ${firstX.toFixed(1)} 170 Z`;
  });

  onHover(pt: { x: number; createdY: number; completedY: number; raw: TaskTrendPoint }): void {
    const totalSvgWidth = 800;
    const xRatio = pt.x / totalSvgWidth;

    this.activePoint.set({
      raw: pt.raw,
      x: pt.x,
      createdY: pt.createdY,
      completedY: pt.completedY,
      percentX: Math.round(xRatio * 100),
      yPixel: Math.max(35, Math.min(pt.createdY, pt.completedY))
    });
  }

  onLeave(): void {
    this.activePoint.set(null);
  }
}

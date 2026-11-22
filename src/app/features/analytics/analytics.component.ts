import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import {
  DateRangeFilter,
  DateRangePreset,
  DistributionItem,
  OverviewMetrics,
  ProductivityInsights,
  ProjectAnalyticsItem,
  TrendAnalysis
} from '../../core/models/analytics.model';
import { SvgDonutChartComponent } from '../../shared/components/charts/svg-donut-chart.component';
import { SvgBarChartComponent, BarChartItem } from '../../shared/components/charts/svg-bar-chart.component';
import { SvgTrendChartComponent } from '../../shared/components/charts/svg-trend-chart.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SvgDonutChartComponent,
    SvgBarChartComponent,
    SvgTrendChartComponent
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly destroyRef = inject(DestroyRef);

  // Active filter state
  selectedPreset = signal<DateRangePreset>('last_30_days');
  customStartDate = signal<string>(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  customEndDate = signal<string>(new Date().toISOString().split('T')[0]);
  reportGeneratedDate = signal<string>(new Date().toLocaleString());

  // Reactive analytics streams
  overviewMetrics = signal<OverviewMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    taskCompletionRate: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    createdInPeriodCount: 0,
    completedInPeriodCount: 0
  });

  statusDistribution = signal<DistributionItem[]>([]);
  priorityDistribution = signal<DistributionItem[]>([]);
  projectAnalytics = signal<ProjectAnalyticsItem[]>([]);
  trendAnalysis = signal<TrendAnalysis>({
    points: [],
    hasSufficientData: false,
    totalCreated: 0,
    totalCompleted: 0
  });
  productivityInsights = signal<ProductivityInsights>({
    topProjects: [],
    overdueCount: 0,
    hasInsufficientData: true,
    workloadObservations: []
  });

  isLoading = signal<boolean>(true);
  exportToast = signal<string | null>(null);

  // Formatted bar chart items for Project Progress
  projectBarItems = computed<BarChartItem[]>(() => {
    return this.projectAnalytics().map(p => ({
      label: p.name,
      value: p.progress,
      color: p.color,
      sublabel: `${p.completedTasks}/${p.totalTasks} tasks completed`
    }));
  });

  // Projects needing attention
  projectsNeedingAttention = computed(() => {
    return this.projectAnalytics().filter(p => p.needsAttention);
  });

  // Current active date range label
  activeRangeLabel = computed(() => {
    return this.analyticsService.resolveDateBounds({
      preset: this.selectedPreset(),
      startDate: this.customStartDate(),
      endDate: this.customEndDate()
    }).label;
  });

  ngOnInit(): void {
    // 1. Subscribe to Overview Metrics
    this.analyticsService.getOverviewMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(metrics => {
        this.overviewMetrics.set(metrics);
        this.isLoading.set(false);
      });

    // 2. Subscribe to Status Distribution
    this.analyticsService.getStatusDistribution()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(dist => this.statusDistribution.set(dist));

    // 3. Subscribe to Priority Distribution
    this.analyticsService.getPriorityDistribution()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(dist => this.priorityDistribution.set(dist));

    // 4. Subscribe to Project Analytics
    this.analyticsService.getProjectAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projects => this.projectAnalytics.set(projects));

    // 5. Subscribe to Task Trends
    this.analyticsService.getTaskTrends()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(trends => this.trendAnalysis.set(trends));

    // 6. Subscribe to Productivity Insights
    this.analyticsService.getProductivityInsights()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(insights => this.productivityInsights.set(insights));
  }

  // Date Filter Selection
  setPreset(preset: DateRangePreset): void {
    this.selectedPreset.set(preset);
    if (preset !== 'custom') {
      this.analyticsService.setDateFilter(preset);
      this.reportGeneratedDate.set(new Date().toLocaleString());
    }
  }

  applyCustomRange(): void {
    if (this.customStartDate() && this.customEndDate()) {
      this.analyticsService.setDateFilter('custom', this.customStartDate(), this.customEndDate());
      this.reportGeneratedDate.set(new Date().toLocaleString());
    }
  }

  // Print Functionality
  printReport(): void {
    this.reportGeneratedDate.set(new Date().toLocaleString());
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // Export CSV Handlers
  exportTasksCsv(): void {
    const tasks = this.taskService.currentTasks;
    const csvContent = this.analyticsService.generateTasksCsv(tasks);
    this.downloadFile(csvContent, `pulsetask-tasks-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    this.showToast('Tasks CSV report exported successfully!');
  }

  exportProjectsCsv(): void {
    const projects = this.projectAnalytics();
    const csvContent = this.analyticsService.generateProjectsCsv(projects);
    this.downloadFile(csvContent, `pulsetask-projects-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    this.showToast('Projects CSV report exported successfully!');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private showToast(msg: string): void {
    this.exportToast.set(msg);
    setTimeout(() => {
      this.exportToast.set(null);
    }, 3500);
  }
}


import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { UserNotificationPreferences } from '../../core/models/user.model';

/**
 * Cross-field validator ensuring newPassword and confirmNewPassword match
 */
export function changePasswordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmNewPassword = group.get('confirmNewPassword')?.value;

  if (!newPassword || !confirmNewPassword) {
    return null;
  }

  return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="settings-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Workspace Settings</h1>
          <p class="page-subtitle">Configure your personal preferences, theme appearance, notifications, and security credentials.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/profile" class="btn btn-secondary">
            <span class="material-symbols-outlined">account_circle</span>
            <span>View User Profile</span>
          </a>
        </div>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="settings-nav-tabs">
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'general'"
          (click)="activeTab.set('general')"
        >
          <span class="material-symbols-outlined">tune</span>
          <span>General</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'appearance'"
          (click)="activeTab.set('appearance')"
        >
          <span class="material-symbols-outlined">palette</span>
          <span>Appearance</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'notifications'"
          (click)="activeTab.set('notifications')"
        >
          <span class="material-symbols-outlined">notifications</span>
          <span>Notifications</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'security'"
          (click)="activeTab.set('security')"
        >
          <span class="material-symbols-outlined">lock</span>
          <span>Security & Password</span>
        </button>
      </div>

      <!-- TAB 1: GENERAL SETTINGS -->
      @if (activeTab() === 'general') {
        <div class="card settings-section-card">
          <div class="section-header">
            <div class="section-title-icon">
              <span class="material-symbols-outlined">tune</span>
            </div>
            <div>
              <h2 class="section-title">General Account Settings</h2>
              <p class="section-desc">Basic information associated with your PulseTask workspace account.</p>
            </div>
          </div>

          <div class="general-info-grid">
            <div class="info-item">
              <span class="info-label">Display Name</span>
              <span class="info-val">{{ currentUser()?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Account Email</span>
              <span class="info-val">{{ currentUser()?.email || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Workspace Role</span>
              <div class="info-val">
                <span class="badge badge-primary">{{ currentUser()?.role || 'Member' }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">Department</span>
              <span class="info-val">{{ currentUser()?.department || 'Not specified' }}</span>
            </div>
          </div>

          <div class="section-footer-banner">
            <div class="footer-banner-text">
              <span class="footer-banner-title">Need to update your personal details?</span>
              <span class="footer-banner-subtitle">You can modify your full name, email, workspace role, and avatar from your profile page.</span>
            </div>
            <a routerLink="/profile" class="btn btn-outline-primary btn-sm">
              <span class="material-symbols-outlined">edit</span>
              <span>Edit in Profile</span>
            </a>
          </div>
        </div>
      }

      <!-- TAB 2: APPEARANCE & THEME SETTINGS -->
      @if (activeTab() === 'appearance') {
        <div class="card settings-section-card">
          <div class="section-header">
            <div class="section-title-icon">
              <span class="material-symbols-outlined">palette</span>
            </div>
            <div>
              <h2 class="section-title">Appearance & Theme</h2>
              <p class="section-desc">Choose how PulseTask looks to you. Your theme selection persists across browser refreshes.</p>
            </div>
          </div>

          @if (themeSuccessNotice()) {
            <div class="alert alert-success" role="alert">
              <span class="material-symbols-outlined alert-icon">check_circle</span>
              <div class="alert-content">
                <span class="alert-message">{{ themeSuccessNotice() }}</span>
              </div>
              <button type="button" class="alert-close" (click)="themeSuccessNotice.set(null)" aria-label="Dismiss">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }

          <div class="theme-options-grid">
            <!-- Light Theme Card -->
            <button 
              type="button" 
              class="theme-card" 
              [class.active]="currentTheme() === 'light'"
              (click)="onSelectTheme('light')"
            >
              <div class="theme-card-preview light-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-header"></div>
                  <div class="preview-block"></div>
                </div>
              </div>
              <div class="theme-card-body">
                <div class="theme-title-row">
                  <span class="material-symbols-outlined theme-icon">light_mode</span>
                  <span class="theme-name">Light Theme</span>
                </div>
                <p class="theme-desc">Crisp white and clean slate design optimized for daylight work.</p>
                @if (currentTheme() === 'light') {
                  <span class="theme-active-tag">
                    <span class="material-symbols-outlined">check</span>
                    <span>Active Theme</span>
                  </span>
                }
              </div>
            </button>

            <!-- Dark Theme Card -->
            <button 
              type="button" 
              class="theme-card" 
              [class.active]="currentTheme() === 'dark'"
              (click)="onSelectTheme('dark')"
            >
              <div class="theme-card-preview dark-preview">
                <div class="preview-sidebar dark-sidebar"></div>
                <div class="preview-content dark-content">
                  <div class="preview-header dark-header"></div>
                  <div class="preview-block dark-block"></div>
                </div>
              </div>
              <div class="theme-card-body">
                <div class="theme-title-row">
                  <span class="material-symbols-outlined theme-icon">dark_mode</span>
                  <span class="theme-name">Dark Theme</span>
                </div>
                <p class="theme-desc">High-contrast dark slate palette designed to reduce eye strain in low-light environments.</p>
                @if (currentTheme() === 'dark') {
                  <span class="theme-active-tag">
                    <span class="material-symbols-outlined">check</span>
                    <span>Active Theme</span>
                  </span>
                }
              </div>
            </button>
          </div>
        </div>
      }

      <!-- TAB 3: NOTIFICATION PREFERENCES -->
      @if (activeTab() === 'notifications') {
        <div class="card settings-section-card">
          <div class="section-header">
            <div class="section-title-icon">
              <span class="material-symbols-outlined">notifications</span>
            </div>
            <div>
              <h2 class="section-title">Notification Preferences</h2>
              <p class="section-desc">Choose which workspace events trigger alerts. Preferences are persisted in browser storage.</p>
            </div>
          </div>

          @if (notifSuccessNotice()) {
            <div class="alert alert-success" role="alert">
              <span class="material-symbols-outlined alert-icon">check_circle</span>
              <div class="alert-content">
                <span class="alert-message">{{ notifSuccessNotice() }}</span>
              </div>
              <button type="button" class="alert-close" (click)="notifSuccessNotice.set(null)" aria-label="Dismiss">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }

          <div class="notification-options-list">
            <!-- 1. Task Assigned -->
            <div class="notif-toggle-row">
              <div class="notif-text">
                <span class="notif-title">Task Assignment Alerts</span>
                <p class="notif-description">Receive immediate notifications when team members assign tasks or subtasks to you.</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="notifications().taskAssigned"
                  (change)="onToggleNotif('taskAssigned', $event)" 
                />
                <span class="slider"></span>
              </label>
            </div>

            <!-- 2. Deadline Reminders -->
            <div class="notif-toggle-row">
              <div class="notif-text">
                <span class="notif-title">Upcoming Deadline Reminders</span>
                <p class="notif-description">Get alert notifications 24 hours and 2 hours before a high-priority task due date arrives.</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="notifications().deadlineReminders"
                  (change)="onToggleNotif('deadlineReminders', $event)" 
                />
                <span class="slider"></span>
              </label>
            </div>

            <!-- 3. Project Updates -->
            <div class="notif-toggle-row">
              <div class="notif-text">
                <span class="notif-title">Project Milestone & Status Updates</span>
                <p class="notif-description">Notify me when active projects change milestone completion, status, or member rosters.</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="notifications().projectUpdates"
                  (change)="onToggleNotif('projectUpdates', $event)" 
                />
                <span class="slider"></span>
              </label>
            </div>

            <!-- 4. Workspace Announcements -->
            <div class="notif-toggle-row">
              <div class="notif-text">
                <span class="notif-title">Workspace Activity Digest</span>
                <p class="notif-description">Receive weekly digest summaries of overall workspace productivity and sprint completion.</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [checked]="notifications().workspaceAnnouncements"
                  (change)="onToggleNotif('workspaceAnnouncements', $event)" 
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: SECURITY & CHANGE PASSWORD -->
      @if (activeTab() === 'security') {
        <div class="card settings-section-card">
          <div class="section-header">
            <div class="section-title-icon">
              <span class="material-symbols-outlined">lock</span>
            </div>
            <div>
              <h2 class="section-title">Change Password</h2>
              <p class="section-desc">Update your login password. Passwords are kept securely in memory and never written to Web Storage.</p>
            </div>
          </div>

          <!-- Password Success Alert -->
          @if (passwordSuccessMessage()) {
            <div class="alert alert-success" role="alert">
              <span class="material-symbols-outlined alert-icon">check_circle</span>
              <div class="alert-content">
                <span class="alert-message">{{ passwordSuccessMessage() }}</span>
              </div>
              <button type="button" class="alert-close" (click)="passwordSuccessMessage.set(null)" aria-label="Dismiss">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }

          <!-- Password Error Alert -->
          @if (passwordErrorMessage()) {
            <div class="alert alert-danger" role="alert">
              <span class="material-symbols-outlined alert-icon">error</span>
              <div class="alert-content">
                <span class="alert-message">{{ passwordErrorMessage() }}</span>
              </div>
              <button type="button" class="alert-close" (click)="passwordErrorMessage.set(null)" aria-label="Dismiss">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }

          <form [formGroup]="passwordForm" (ngSubmit)="onChangePasswordSubmit()" class="password-form" novalidate>
            <!-- Current Password -->
            <div class="form-group">
              <label class="form-label" for="current-pwd">
                Current Password <span class="required">*</span>
              </label>
              <div class="input-wrapper" [class.is-invalid]="isPasswordFieldInvalid('currentPassword')">
                <span class="material-symbols-outlined input-icon">lock</span>
                <input 
                  id="current-pwd"
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  formControlName="currentPassword" 
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  (click)="showCurrentPassword.set(!showCurrentPassword())" 
                  [title]="showCurrentPassword() ? 'Hide password' : 'Show password'"
                  tabindex="-1"
                >
                  <span class="material-symbols-outlined">
                    {{ showCurrentPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (isPasswordFieldInvalid('currentPassword')) {
                <div class="field-error">
                  <span class="material-symbols-outlined">warning</span>
                  <span>Current password is required.</span>
                </div>
              }
              <span class="form-hint">For default mock demo accounts, the initial password is <code>password123</code>.</span>
            </div>

            <!-- New Password -->
            <div class="form-group">
              <label class="form-label" for="new-pwd">
                New Password <span class="required">*</span>
              </label>
              <div class="input-wrapper" [class.is-invalid]="isPasswordFieldInvalid('newPassword')">
                <span class="material-symbols-outlined input-icon">key</span>
                <input 
                  id="new-pwd"
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  formControlName="newPassword" 
                  placeholder="At least 6 characters"
                  autocomplete="new-password"
                />
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  (click)="showNewPassword.set(!showNewPassword())" 
                  [title]="showNewPassword() ? 'Hide password' : 'Show password'"
                  tabindex="-1"
                >
                  <span class="material-symbols-outlined">
                    {{ showNewPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (isPasswordFieldInvalid('newPassword')) {
                <div class="field-error">
                  <span class="material-symbols-outlined">warning</span>
                  <span>{{ getNewPasswordErrorMessage() }}</span>
                </div>
              }
            </div>

            <!-- Confirm New Password -->
            <div class="form-group">
              <label class="form-label" for="confirm-new-pwd">
                Confirm New Password <span class="required">*</span>
              </label>
              <div class="input-wrapper" [class.is-invalid]="isPasswordFieldInvalid('confirmNewPassword') || hasPasswordMismatch()">
                <span class="material-symbols-outlined input-icon">check_circle</span>
                <input 
                  id="confirm-new-pwd"
                  [type]="showConfirmPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  formControlName="confirmNewPassword" 
                  placeholder="Re-enter new password"
                  autocomplete="new-password"
                />
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  (click)="showConfirmPassword.set(!showConfirmPassword())" 
                  [title]="showConfirmPassword() ? 'Hide password' : 'Show password'"
                  tabindex="-1"
                >
                  <span class="material-symbols-outlined">
                    {{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (isPasswordFieldInvalid('confirmNewPassword') || hasPasswordMismatch()) {
                <div class="field-error">
                  <span class="material-symbols-outlined">warning</span>
                  <span>{{ getConfirmPasswordErrorMessage() }}</span>
                </div>
              }
            </div>

            <!-- Submit Button -->
            <div class="form-actions-row">
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="isSavingPassword()"
              >
                @if (isSavingPassword()) {
                  <span class="spinner"></span>
                  <span>Updating Password...</span>
                } @else {
                  <span class="material-symbols-outlined">lock_reset</span>
                  <span>Update Password</span>
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 4px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-main);
      letter-spacing: -0.025em;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 4px 0 0 0;
    }

    /* Tabs Bar */
    .settings-nav-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 2px;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      background: none;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--color-text-main);
    }

    .tab-btn.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }

    .tab-btn .material-symbols-outlined {
      font-size: 18px;
    }

    /* Settings Card */
    .settings-section-card {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 28px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 18px;
    }

    .section-title-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-title-icon .material-symbols-outlined {
      font-size: 22px;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-top: 3px;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    .alert-success {
      background-color: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-text);
    }

    .alert-danger {
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger-text);
    }

    .alert-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-content {
      flex: 1;
      line-height: 1.4;
    }

    .alert-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0;
    }

    /* General Tab */
    .general-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px 32px;
      padding: 8px 0;
    }

    @media (max-width: 640px) {
      .general-info-grid {
        grid-template-columns: 1fr;
        gap: 18px;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .info-val {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-main);
      min-height: 28px;
      display: flex;
      align-items: center;
    }

    .section-footer-banner {
      background-color: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 18px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .footer-banner-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .footer-banner-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .footer-banner-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }

    /* Appearance / Theme Cards */
    .theme-options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 640px) {
      .theme-options-grid {
        grid-template-columns: 1fr;
      }
    }

    .theme-card {
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
      padding: 16px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.2s ease;
    }

    .theme-card:hover {
      border-color: var(--color-primary-border);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .theme-card.active {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.15);
    }

    .theme-card-preview {
      height: 100px;
      border-radius: var(--radius-md);
      display: flex;
      overflow: hidden;
      border: 1px solid var(--color-border);
    }

    .light-preview {
      background-color: #f8fafc;
    }

    .light-preview .preview-sidebar {
      width: 32px;
      background-color: #ffffff;
      border-right: 1px solid #e2e8f0;
    }

    .light-preview .preview-content {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .light-preview .preview-header {
      height: 12px;
      background-color: #e2e8f0;
      border-radius: 3px;
    }

    .light-preview .preview-block {
      height: 48px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }

    .dark-preview {
      background-color: #0f172a;
    }

    .dark-sidebar {
      width: 32px;
      background-color: #1e293b;
      border-right: 1px solid #334155;
    }

    .dark-content {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .dark-header {
      height: 12px;
      background-color: #334155;
      border-radius: 3px;
    }

    .dark-block {
      height: 48px;
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 4px;
    }

    .theme-card-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .theme-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .theme-icon {
      font-size: 20px;
      color: var(--color-primary);
    }

    .theme-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .theme-desc {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    .theme-active-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary);
      margin-top: 4px;
    }

    .theme-active-tag .material-symbols-outlined {
      font-size: 16px;
    }

    /* Notification Preferences */
    .notification-options-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notif-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .notif-toggle-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .notif-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .notif-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .notif-description {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    /* Switch Component */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-border-strong, #cbd5e1);
      transition: 0.2s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    input:checked + .slider {
      background-color: var(--color-primary);
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    /* Password Form */
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 520px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .required {
      color: var(--color-danger);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      color: var(--color-text-muted);
      pointer-events: none;
    }

    .form-control {
      width: 100%;
      height: 42px;
      padding: 0 40px 0 38px;
      font-size: 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      color: var(--color-text-main);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
    }

    .input-wrapper.is-invalid .form-control {
      border-color: var(--color-danger);
    }

    .input-wrapper.is-invalid .input-icon {
      color: var(--color-danger);
    }

    .password-toggle-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: var(--radius-sm);
    }

    .password-toggle-btn:hover {
      color: var(--color-text-main);
    }

    .password-toggle-btn .material-symbols-outlined {
      font-size: 18px;
    }

    .field-error {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: var(--color-danger);
    }

    .field-error .material-symbols-outlined {
      font-size: 14px;
    }

    .form-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .form-hint code {
      font-family: var(--font-family-mono);
      background-color: var(--color-surface-hover);
      padding: 2px 4px;
      border-radius: 4px;
    }

    .form-actions-row {
      margin-top: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
    }

    .btn-outline-primary {
      background-color: transparent;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
    }

    .btn-outline-primary:hover {
      background-color: var(--color-primary-light);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);

  // Authenticated user state
  currentUser = toSignal(this.authService.currentUser$, { initialValue: this.authService.currentUser });

  // Settings active section tab
  activeTab = signal<'general' | 'appearance' | 'notifications' | 'security'>('general');

  // Appearance theme state
  currentTheme = toSignal(this.settingsService.theme$, { initialValue: this.settingsService.currentTheme });
  themeSuccessNotice = signal<string | null>(null);

  // Notification preferences state
  notifications = toSignal(this.settingsService.notificationPreferences$, { initialValue: this.settingsService.currentNotifications });
  notifSuccessNotice = signal<string | null>(null);

  // Change Password reactive form state
  passwordForm!: FormGroup;
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isSavingPassword = signal<boolean>(false);
  passwordSuccessMessage = signal<string | null>(null);
  passwordErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: [changePasswordMatchValidator]
    });
  }

  onSelectTheme(theme: 'light' | 'dark'): void {
    this.settingsService.setTheme(theme);
    this.themeSuccessNotice.set(`Workspace theme updated to ${theme === 'dark' ? 'Dark' : 'Light'} mode.`);
    setTimeout(() => this.themeSuccessNotice.set(null), 3000);
  }

  onToggleNotif(key: keyof UserNotificationPreferences, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.updateNotificationPreferences({ [key]: checked });
    this.notifSuccessNotice.set('Notification preferences updated and saved.');
    setTimeout(() => this.notifSuccessNotice.set(null), 3000);
  }

  isPasswordFieldInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasPasswordMismatch(): boolean {
    const confirmControl = this.passwordForm.get('confirmNewPassword');
    const isTouched = confirmControl && (confirmControl.dirty || confirmControl.touched);
    return !!(isTouched && this.passwordForm.hasError('passwordMismatch'));
  }

  getNewPasswordErrorMessage(): string {
    const control = this.passwordForm.get('newPassword');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'New password is required.';
    if (control.errors['minlength']) return 'Password must be at least 6 characters.';
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.passwordForm.get('confirmNewPassword');
    if (control?.errors?.['required']) return 'Please confirm your new password.';
    if (this.passwordForm.hasError('passwordMismatch')) return 'New passwords do not match.';
    return '';
  }

  onChangePasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    this.passwordSuccessMessage.set(null);
    this.passwordErrorMessage.set(null);

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.passwordSuccessMessage.set('Password successfully updated! Your new password is now active in this session.');
        this.passwordForm.reset();
      },
      error: (err: Error) => {
        this.isSavingPassword.set(false);
        this.passwordErrorMessage.set(err.message || 'Could not update password. Please check your credentials.');
      }
    });
  }
}

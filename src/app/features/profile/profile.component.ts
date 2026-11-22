import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { User, ProfileUpdateData } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="profile-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">User Profile</h1>
          <p class="page-subtitle">Manage your personal identity, workspace role, and account credentials.</p>
        </div>
        <div class="header-actions">
          @if (!isEditing()) {
            <button type="button" class="btn btn-primary" (click)="enableEditing()">
              <span class="material-symbols-outlined">edit</span>
              <span>Edit Profile</span>
            </button>
          } @else {
            <button type="button" class="btn btn-secondary" (click)="cancelEditing()" [disabled]="isSaving()">
              <span class="material-symbols-outlined">close</span>
              <span>Cancel</span>
            </button>
          }
          <a routerLink="/settings" class="btn btn-secondary">
            <span class="material-symbols-outlined">settings</span>
            <span>Account Settings</span>
          </a>
        </div>
      </div>

      <!-- Success Notification Banner -->
      @if (successMessage()) {
        <div class="alert alert-success" role="alert">
          <span class="material-symbols-outlined alert-icon">check_circle</span>
          <div class="alert-content">
            <span class="alert-message">{{ successMessage() }}</span>
          </div>
          <button type="button" class="alert-close" (click)="successMessage.set(null)" aria-label="Dismiss">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Error Notification Banner -->
      @if (errorMessage()) {
        <div class="alert alert-danger" role="alert">
          <span class="material-symbols-outlined alert-icon">error</span>
          <div class="alert-content">
            <span class="alert-message">{{ errorMessage() }}</span>
          </div>
          <button type="button" class="alert-close" (click)="errorMessage.set(null)" aria-label="Dismiss">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Profile Grid Layout -->
      <div class="profile-layout-grid">
        <!-- Left Sidebar: Profile Identity Card & Completion -->
        <div class="profile-side-column">
          <!-- Identity Summary Card -->
          <div class="card identity-card">
            <div class="identity-card-cover"></div>
            <div class="identity-avatar-container">
              @if (previewAvatarUrl() || currentUser()?.avatarUrl) {
                <img 
                  [src]="previewAvatarUrl() || currentUser()?.avatarUrl" 
                  alt="Profile Avatar" 
                  class="profile-avatar-img"
                />
              } @else {
                <div class="profile-avatar-initials">
                  {{ userInitials() }}
                </div>
              }
              @if (isEditing()) {
                <label class="avatar-upload-badge" title="Change photo" for="avatar-file-input">
                  <span class="material-symbols-outlined">photo_camera</span>
                  <input 
                    id="avatar-file-input"
                    type="file" 
                    accept="image/*" 
                    (change)="onPhotoSelected($event)" 
                    class="d-none" 
                  />
                </label>
              }
            </div>

            <div class="identity-body">
              <h2 class="identity-name">{{ currentUser()?.name || 'User' }}</h2>
              <p class="identity-email">{{ currentUser()?.email || 'user@pulsetask.com' }}</p>
              
              <div class="identity-badges">
                <span class="badge badge-primary">
                  {{ currentUser()?.role || 'Member' }}
                </span>
                @if (currentUser()?.department) {
                  <span class="badge badge-secondary">
                    {{ currentUser()?.department }}
                  </span>
                }
              </div>

              <div class="identity-meta-list">
                <div class="identity-meta-item">
                  <span class="material-symbols-outlined">calendar_today</span>
                  <span>Joined {{ formattedCreationDate() }}</span>
                </div>
                <div class="identity-meta-item">
                  <span class="material-symbols-outlined">verified_user</span>
                  <span>Authenticated Mock Session</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Completion Indicator Card -->
          <div class="card completion-card">
            <div class="completion-header">
              <div class="completion-title-group">
                <span class="completion-title">Profile Completion</span>
                <span class="completion-percentage">{{ completionPercentage() }}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill" 
                  [style.width.%]="completionPercentage()"
                  [class.is-complete]="completionPercentage() === 100"
                ></div>
              </div>
            </div>

            <div class="completion-checklist">
              <div class="checklist-item" [class.done]="hasName()">
                <span class="material-symbols-outlined check-icon">
                  {{ hasName() ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span>Full Name added</span>
              </div>
              <div class="checklist-item" [class.done]="hasEmail()">
                <span class="material-symbols-outlined check-icon">
                  {{ hasEmail() ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span>Valid work email address</span>
              </div>
              <div class="checklist-item" [class.done]="hasRole()">
                <span class="material-symbols-outlined check-icon">
                  {{ hasRole() ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span>Workspace role defined</span>
              </div>
              <div class="checklist-item" [class.done]="hasDepartment()">
                <span class="material-symbols-outlined check-icon">
                  {{ hasDepartment() ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span>Department specified</span>
              </div>
              <div class="checklist-item" [class.done]="hasAvatar()">
                <span class="material-symbols-outlined check-icon">
                  {{ hasAvatar() ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span>Profile photo uploaded</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Main Column: View / Edit Profile Information -->
        <div class="profile-main-column">
          <!-- View Profile Details Card -->
          @if (!isEditing()) {
            <div class="card details-card">
              <div class="card-header-row">
                <div>
                  <h3 class="section-title">Personal Information</h3>
                  <p class="section-subtitle">Your personal contact and workplace credentials within PulseTask.</p>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="enableEditing()">
                  <span class="material-symbols-outlined">edit</span>
                  <span>Edit Details</span>
                </button>
              </div>

              <div class="details-grid">
                <div class="detail-field">
                  <span class="detail-label">Full Name</span>
                  <span class="detail-value">{{ currentUser()?.name || '—' }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Email Address</span>
                  <span class="detail-value">{{ currentUser()?.email || '—' }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Workspace Role</span>
                  <div class="detail-value">
                    <span class="badge badge-primary">{{ currentUser()?.role || 'Member' }}</span>
                  </div>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Department / Team</span>
                  <span class="detail-value">{{ currentUser()?.department || 'Not specified' }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">User ID</span>
                  <span class="detail-value mono-text">{{ currentUser()?.id || '—' }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Member Since</span>
                  <span class="detail-value">{{ formattedCreationDate() }}</span>
                </div>
              </div>

              <!-- Quick Links & Account Security Shortcuts -->
              <div class="account-shortcuts-banner">
                <div class="shortcut-info">
                  <span class="material-symbols-outlined shortcut-icon">security</span>
                  <div>
                    <span class="shortcut-title">Security & Password</span>
                    <p class="shortcut-desc">Update your login password and manage session settings in Workspace Settings.</p>
                  </div>
                </div>
                <a routerLink="/settings" class="btn btn-secondary btn-sm">
                  <span>Go to Security</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
          } @else {
            <!-- Edit Profile Reactive Form Card -->
            <div class="card edit-card">
              <div class="card-header-row">
                <div>
                  <h3 class="section-title">Edit Profile Information</h3>
                  <p class="section-subtitle">Update your personal identity and workspace role. Changes take effect across the dashboard immediately.</p>
                </div>
              </div>

              <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="profile-form" novalidate>
                <!-- Full Name -->
                <div class="form-group">
                  <label class="form-label" for="profile-name">
                    Full Name <span class="required">*</span>
                  </label>
                  <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('name')">
                    <span class="material-symbols-outlined input-icon">badge</span>
                    <input 
                      id="profile-name"
                      type="text" 
                      class="form-control" 
                      formControlName="name" 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  @if (isFieldInvalid('name')) {
                    <div class="field-error">
                      <span class="material-symbols-outlined">warning</span>
                      <span>{{ getNameErrorMessage() }}</span>
                    </div>
                  }
                </div>

                <!-- Email Address -->
                <div class="form-group">
                  <label class="form-label" for="profile-email">
                    Email Address <span class="required">*</span>
                  </label>
                  <div class="input-wrapper" [class.is-invalid]="isFieldInvalid('email')">
                    <span class="material-symbols-outlined input-icon">mail</span>
                    <input 
                      id="profile-email"
                      type="email" 
                      class="form-control" 
                      formControlName="email" 
                      placeholder="name@company.com"
                    />
                  </div>
                  @if (isFieldInvalid('email')) {
                    <div class="field-error">
                      <span class="material-symbols-outlined">warning</span>
                      <span>{{ getEmailErrorMessage() }}</span>
                    </div>
                  }
                </div>

                <!-- Form Row: Role & Department -->
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="profile-role">
                      Workspace Role <span class="required">*</span>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined input-icon">groups</span>
                      <select id="profile-role" class="form-control form-select" formControlName="role">
                        <option value="Project Manager">Project Manager</option>
                        <option value="Developer">Developer</option>
                        <option value="Designer">UI/UX Designer</option>
                        <option value="Admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="profile-dept">
                      Department / Team
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined input-icon">business</span>
                      <input 
                        id="profile-dept"
                        type="text" 
                        class="form-control" 
                        formControlName="department" 
                        placeholder="e.g. Engineering & Product"
                      />
                    </div>
                  </div>
                </div>

                <!-- Custom Photo / Avatar URL -->
                <div class="form-group">
                  <label class="form-label" for="profile-avatar-url">
                    Avatar Image URL (Optional)
                  </label>
                  <div class="input-wrapper">
                    <span class="material-symbols-outlined input-icon">image</span>
                    <input 
                      id="profile-avatar-url"
                      type="url" 
                      class="form-control" 
                      formControlName="avatarUrl" 
                      placeholder="https://example.com/avatar.jpg"
                      (input)="onAvatarUrlInput($event)"
                    />
                  </div>
                  <span class="form-hint">Paste an image link or click the camera icon on your avatar to upload a local photo.</span>
                </div>

                <!-- Form Action Buttons -->
                <div class="form-actions-row">
                  <button 
                    type="submit" 
                    class="btn btn-primary" 
                    [disabled]="isSaving()"
                  >
                    @if (isSaving()) {
                      <span class="spinner"></span>
                      <span>Saving Changes...</span>
                    } @else {
                      <span class="material-symbols-outlined">check</span>
                      <span>Save Profile Changes</span>
                    }
                  </button>

                  <button 
                    type="button" 
                    class="btn btn-secondary" 
                    (click)="cancelEditing()"
                    [disabled]="isSaving()"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-main);
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
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

    .alert-close:hover {
      opacity: 1;
    }

    /* Grid Layout */
    .profile-layout-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: stretch;
    }

    @media (max-width: 992px) {
      .profile-layout-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-side-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-main-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
    }

    /* Identity Card */
    .identity-card {
      position: relative;
      overflow: hidden;
      padding: 0 24px 24px 24px;
    }

    .identity-card-cover {
      height: 96px;
      margin: 0 -24px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    }

    .identity-avatar-container {
      position: relative;
      margin: -48px auto 14px auto;
      width: 96px;
      height: 96px;
    }

    .profile-avatar-img {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-full);
      object-fit: cover;
      border: 4px solid var(--color-surface);
      box-shadow: var(--shadow-md);
      background-color: var(--color-surface);
    }

    .profile-avatar-initials {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff;
      font-size: 2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid var(--color-surface);
      box-shadow: var(--shadow-md);
    }

    .avatar-upload-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      border: 2px solid var(--color-surface);
      transition: background-color 0.15s ease;
    }

    .avatar-upload-badge:hover {
      background-color: var(--color-primary-hover);
    }

    .avatar-upload-badge .material-symbols-outlined {
      font-size: 16px;
    }

    .identity-body {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .identity-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .identity-email {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin: 0 0 4px 0;
    }

    .identity-badges {
      display: flex;
      gap: 8px;
      margin: 4px 0 12px 0;
      flex-wrap: wrap;
      justify-content: center;
    }

    .identity-meta-list {
      width: 100%;
      border-top: 1px solid var(--color-border);
      margin-top: 8px;
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
    }

    .identity-meta-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .identity-meta-item .material-symbols-outlined {
      font-size: 18px;
      color: var(--color-primary);
    }

    /* Completion Card */
    .completion-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
    }

    .completion-title-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .completion-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .completion-percentage {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background-color: var(--color-surface-hover);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%);
      border-radius: var(--radius-full);
      transition: width 0.4s ease;
    }

    .progress-bar-fill.is-complete {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    .completion-checklist {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 2px;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      transition: color 0.15s ease;
    }

    .checklist-item.done {
      color: var(--color-text-main);
      font-weight: 500;
    }

    .check-icon {
      font-size: 18px;
      color: var(--color-text-muted);
    }

    .checklist-item.done .check-icon {
      color: var(--color-success);
    }

    /* Main Details Card */
    .details-card,
    .edit-card {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 28px;
      height: 100%;
      box-sizing: border-box;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 18px;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-top: 3px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px 32px;
      padding: 10px 0;
      flex: 1;
    }

    @media (max-width: 640px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
    }

    .detail-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .detail-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-main);
      min-height: 28px;
      display: flex;
      align-items: center;
    }

    .mono-text {
      font-family: var(--font-family-mono);
      font-size: 0.8125rem;
    }

    .account-shortcuts-banner {
      background-color: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: auto;
    }

    .shortcut-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .shortcut-icon {
      font-size: 26px;
      color: var(--color-primary);
      background-color: var(--color-primary-light);
      padding: 8px;
      border-radius: var(--radius-md);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shortcut-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .shortcut-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }

    /* Edit Form */
    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .form-row-2 {
        grid-template-columns: 1fr;
      }
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
      padding: 0 16px 0 38px;
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

    .form-select {
      appearance: auto;
      cursor: pointer;
    }

    .input-wrapper.is-invalid .form-control {
      border-color: var(--color-danger);
    }

    .input-wrapper.is-invalid .input-icon {
      color: var(--color-danger);
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

    .form-actions-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
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

    .d-none {
      display: none;
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
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  // Authenticated user state reactively bound to AuthService
  currentUser = toSignal(this.authService.currentUser$, { initialValue: this.authService.currentUser });

  // View vs Edit UI state
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Local Avatar preview for immediate visual feedback
  previewAvatarUrl = signal<string | null>(null);

  profileForm!: FormGroup;

  // Computed user initials
  userInitials = computed(() => {
    const name = this.currentUser()?.name || 'User';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'PT').toUpperCase();
  });

  // Formatted date string
  formattedCreationDate = computed(() => {
    const raw = this.currentUser()?.createdAt;
    if (!raw) return 'January 2026';
    try {
      const date = new Date(raw);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'January 2026';
    }
  });

  // Profile completion indicator metrics
  hasName = computed(() => !!this.currentUser()?.name?.trim());
  hasEmail = computed(() => !!this.currentUser()?.email?.trim());
  hasRole = computed(() => !!this.currentUser()?.role);
  hasDepartment = computed(() => !!this.currentUser()?.department?.trim());
  hasAvatar = computed(() => !!(this.previewAvatarUrl() || this.currentUser()?.avatarUrl));

  completionPercentage = computed(() => {
    let completed = 0;
    if (this.hasName()) completed += 20;
    if (this.hasEmail()) completed += 20;
    if (this.hasRole()) completed += 20;
    if (this.hasDepartment()) completed += 20;
    if (this.hasAvatar()) completed += 20;
    return completed;
  });

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const user = this.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      role: [user?.role || 'Developer', [Validators.required]],
      department: [user?.department || ''],
      avatarUrl: [user?.avatarUrl || '']
    });

    if (user?.avatarUrl) {
      this.previewAvatarUrl.set(user.avatarUrl);
    }
  }

  enableEditing(): void {
    this.initForm();
    this.isEditing.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.errorMessage.set(null);
    this.previewAvatarUrl.set(this.currentUser()?.avatarUrl || null);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getNameErrorMessage(): string {
    const control = this.profileForm.get('name');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Full name is required.';
    if (control.errors['minlength']) return 'Name must be at least 2 characters long.';
    return '';
  }

  getEmailErrorMessage(): string {
    const control = this.profileForm.get('email');
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Email address is required.';
    if (control.errors['email']) return 'Please enter a valid email format (e.g. name@company.com).';
    return '';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.previewAvatarUrl.set(dataUrl);
      this.profileForm.patchValue({ avatarUrl: dataUrl });
    };

    reader.readAsDataURL(file);
  }

  onAvatarUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.trim();
    if (val) {
      this.previewAvatarUrl.set(val);
    } else {
      this.previewAvatarUrl.set(null);
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formData: ProfileUpdateData = {
      name: this.profileForm.value.name,
      email: this.profileForm.value.email,
      role: this.profileForm.value.role,
      department: this.profileForm.value.department,
      avatarUrl: this.profileForm.value.avatarUrl || this.previewAvatarUrl() || undefined
    };

    this.authService.updateProfile(formData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.successMessage.set('Profile successfully updated! Your changes are reflected across the workspace.');
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.message || 'Could not update profile. Please try again.');
      }
    });
  }
}

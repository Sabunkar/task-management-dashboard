# PulseTask – Professional Task Management Dashboard

PulseTask is a modern, responsive, enterprise-grade Task Management and Analytics Dashboard built with **Angular 22**, **TypeScript**, **RxJS**, and **Angular Signals**. Designed as a portfolio-grade project, PulseTask adheres to clean architecture principles, feature-based modularity, reactive state streams, and WCAG 2.1 accessibility standards.

---

## 1. Project Overview

PulseTask delivers an end-to-end digital workspace experience for distributed engineering and product teams. It combines project milestone planning, granular deliverable tracking, interactive Kanban workflows, notification auditing, cross-entity search, and vector data visualizations—all powered by a responsive CSS design token system supporting both Light and Dark modes.

---

## 2. Key Features

### 🏢 Workspace & Project Management
- **Full Project CRUD:** Create, edit, inspect, and delete project workspaces with color-coded branding and milestone date ranges.
- **Dynamic Progress Derivation:** Automatically calculates workspace completion velocity in real-time based on associated task deliverables.
- **Cascade Cleanup:** Deleting a project safely purges associated tasks to prevent orphan backlog items.
- **Detailed Project View (`/projects/:id`):** Dedicated workspace audit page with milestone progress circles, timeline dates, and direct task status updates.

### 📋 Deliverable & Task Management
- **Dual View Modes:** Seamlessly switch between a dense Table View and responsive Card Grid.
- **Granular Task CRUD:** Create, update, quick-status toggle, and delete deliverables with priority risk flags (`High`, `Medium`, `Low`).
- **Advanced Multi-Condition Filtering:** Instant filtering combining search text, status, priority, project assignment, due-date boundaries (`dueDateFrom` / `dueDateTo`), and overdue checks.
- **Active Filter Chips:** One-click dismissible filter tags with a global "Clear All" reset action.

### 📊 Interactive Kanban Board (`/board`)
- **Drag-and-Drop Workflow:** Powered by `@angular/cdk/drag-drop` across `To Do`, `In Progress`, and `Completed` lanes.
- **Automatic Milestone Updates:** Dragging a task to `Completed` updates project progress metrics and timestamps the deliverable.
- **Search & Filter Controls:** Filter Kanban cards on-the-fly without leaving the board.

### 🔍 Global Cross-Entity Search
- **Topbar Universal Search:** Debounced (`200ms`) search querying Tasks (title, description, project) and Projects (name, description) simultaneously.
- **Categorized Results Dropdown:** Displays metadata badges, color tags, empty states, and keyboard navigation shortcuts (`Enter` to submit, `Esc` to close).

### 📈 Reports, Analytics & Data Visualization (`/analytics`)
- **Native SVG Data Visualization:** Custom zero-dependency, 100% SSR-safe SVG Donut, Horizontal Bar, and Trend Area Charts with interactive tooltips and gradients.
- **Flexible Date Range Filtering:** Filter reports by `Last 7 Days`, `Last 30 Days`, `Last 90 Days`, `This Year`, `All Time`, or `Custom Date Range`.
- **Productivity Observations:** Derives peak completion days and workload distributions grounded in recorded activity without synthetic assumptions.
- **Export Capabilities:** One-click CSV export for tasks and projects, alongside a dedicated `@media print` stylesheet for clean browser printing and PDF generation.

### 🔔 Notifications Center & Audit Log (`/notifications`)
- **Event-Driven Alerts:** Real-time notifications for task creation, status transitions, milestone completions, and workspace removals.
- **Preference Controls:** User-configurable notification toggles with persistent browser storage.
- **Top Navigation Dropdown:** Unread badge counter with one-click "Mark All as Read" action.

### 👤 User Profile & Workspace Settings (`/profile`, `/settings`)
- **Profile Management:** View workspace credentials, edit personal details, and observe completion indicators.
- **Security & Password Management:** Update mock passwords with minimum complexity validation.
- **Theme Switcher:** Instant toggle between Light and Dark themes, seamlessly applied via CSS custom properties.

---

## 3. Technology Stack

- **Framework:** Angular 22 (Standalone Architecture, `@angular/ssr`)
- **Language:** TypeScript 6.0+
- **Reactive State Management:** RxJS 7.8 (BehaviorSubjects, `combineLatest`, `switchMap`, `debounceTime`) & Angular Signals (`signal()`, `computed()`)
- **UI Components & Drag/Drop:** `@angular/cdk`
- **Styling:** CSS3 Design Tokens, Custom Properties, Flexbox & CSS Grid (Zero third-party CSS dependencies)
- **Forms:** Angular Reactive Forms with custom cross-field validators
- **Routing:** Angular Router with functional guards (`authGuard`, `guestGuard`)
- **Testing:** Vitest & Angular Build Tools (122 passing unit tests)

---

## 4. Project Architecture

PulseTask follows a clean, layered architectural pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│   Standalone Components, Reactive Templates, SVG Charts │
└────────────────────────────┬────────────────────────────┘
                             │ (Signals & Observables)
┌────────────────────────────▼────────────────────────────┐
│                      Service Layer                      │
│   TaskService, ProjectService, AnalyticsService, etc.   │
└────────────────────────────┬────────────────────────────┘
                             │ (RxJS BehaviorSubjects)
┌────────────────────────────▼────────────────────────────┐
│                    Data & Storage Layer                 │
│   MockDataService, Browser LocalStorage / SessionStorage│
└─────────────────────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
task-management-dashboard/
├── public/
│   ├── _redirects              # Netlify SPA routing rules
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         # authGuard, guestGuard
│   │   │   ├── layout/         # MainLayout, AuthLayout
│   │   │   ├── models/         # User, Project, Task, Analytics, Notification
│   │   │   └── services/       # TaskService, ProjectService, AnalyticsService, etc.
│   │   ├── features/
│   │   │   ├── analytics/      # Reports, metrics, print layout
│   │   │   ├── auth/           # Login & Registration views
│   │   │   ├── dashboard/      # Executive summary dashboard
│   │   │   ├── not-found/      # 404 error page
│   │   │   ├── notifications/  # Notifications center
│   │   │   ├── profile/        # User profile view & edit
│   │   │   ├── projects/       # Projects list & Project detail
│   │   │   ├── settings/       # Theme & notification preferences
│   │   │   └── tasks/          # Backlog list & Kanban board
│   │   ├── shared/
│   │   │   └── components/     # Reusable SVG chart components
│   │   ├── app.config.ts       # Application providers & hydration
│   │   └── app.routes.ts       # Central route registry & lazy imports
│   ├── styles.css              # Global design tokens & CSS resets
│   └── main.ts                 # Client bootstrap
├── angular.json                # Angular CLI configuration
├── package.json                # Dependencies & script definitions
├── netlify.toml                # Netlify deployment configuration
├── vercel.json                 # Vercel deployment configuration
└── README.md
```

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js (v20.x or v22.x recommended)
- npm (v10+ or v11+)

### Clone & Install
```bash
# 1. Clone the repository
git clone https://github.com/your-username/task-management-dashboard.git

# 2. Navigate to project root
cd task-management-dashboard

# 3. Install dependencies
npm install
```

---

## 7. Development Commands

```bash
# Start local development server with hot-reload
npm start
# or
npx ng serve

# Navigate to http://localhost:4200/ in your browser
```

---

## 8. Testing Instructions

PulseTask includes comprehensive unit tests across services, guards, and components:

```bash
# Run all unit tests once
npx ng test --watch=false

# Run unit tests in interactive watch mode
npx ng test
```

---

## 9. Production Build

```bash
# Generate optimized production build
npm run build

# Output artifacts will be placed in:
# dist/task-management-dashboard/browser (Client bundles)
# dist/task-management-dashboard/server  (SSR server bundles)
```

---

## 10. Demo Login Credentials

The application is pre-configured with active demo accounts:

| Role | Email | Password |
|---|---|---|
| **Project Manager (Default)** | `john.doe@pulsetask.com` | `password123` |
| **Demo User** | `demo@pulsetask.com` | `password123` |

*Note: You can also register a brand-new user via the Registration page (`/auth/register`), which will automatically log you in.*

---

## 11. Mock Authentication & Security Limitations

> **Important Security Notice:**  
> PulseTask utilizes a **client-side mock authentication architecture** designed for demonstration and portfolio showcase purposes.
> - Authentication state and credentials persist in browser `localStorage` and `sessionStorage`.
> - Route guards (`authGuard`, `guestGuard`) operate strictly on client-side state.
> - Passwords are validated locally in-memory and are not hashed using a production cryptosystem.
> - **Do not use real, sensitive, or personal passwords.** Production deployments require pairing with a secure backend API (e.g. Node/Express, Spring Boot, Firebase Auth, or Auth0) with secure HTTP-only cookies and JWT signature verification.

---

## 12. Deployment Instructions

### A. Deploy to Vercel
1. Install the Vercel CLI: `npm install -g vercel`
2. Run `vercel` from the project root.
3. Configure the build settings:
   - **Framework Preset:** Angular
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/task-management-dashboard/browser`
4. The included `vercel.json` ensures all client-side routes redirect seamlessly to `index.html`.

### B. Deploy to Netlify
1. Connect your repository to Netlify.
2. Configure build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist/task-management-dashboard/browser`
3. The included `netlify.toml` and `public/_redirects` file handle SPA routing rewrites automatically.

### C. Deploy to Firebase Hosting
1. Install Firebase Tools: `npm install -g firebase-tools`
2. Run `firebase init hosting` and select `dist/task-management-dashboard/browser` as the public directory.
3. Configure as a single-page app (rewrite all URLs to `/index.html`).
4. Run `firebase deploy`.

---

## 13. Screenshots Section

*(Placeholders for portfolio documentation)*

| Executive Dashboard | Kanban Task Board |
|---|---|
| ![Dashboard Screenshot](https://via.placeholder.com/600x340?text=PulseTask+Executive+Dashboard) | ![Kanban Board Screenshot](https://via.placeholder.com/600x340?text=Interactive+Kanban+Board) |

| Reports & Data Visualization | Project Milestone Management |
|---|---|
| ![Analytics Screenshot](https://via.placeholder.com/600x340?text=Reports+%26+Data+Visualization) | ![Projects Screenshot](https://via.placeholder.com/600x340?text=Project+Workspaces) |

---

## 14. Future Enhancement Possibilities

- **Live Backend Integration:** Connect services to a NestJS or Spring Boot REST API with PostgreSQL/MongoDB persistence.
- **Real-Time Collaboration:** Integrate WebSocket or Firebase Firestore for multi-user live task updates and board cursor synchronization.
- **OAuth2 / SSO Social Logins:** Add Google Workspace and GitHub OAuth login providers.
- **Automated Server PDF Generation:** Generate downloadable executive PDFs via Puppeteer on the server.
- **File Attachments & S3 Uploads:** Support uploading asset mockups, wireframes, and documents directly to task deliverables.

---

## License

This project is licensed under the MIT License.

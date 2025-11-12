# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a task management application ("Intentionality") built with Next.js 15 that supports **dual storage modes**:
- **Local mode** (default): Client-side localStorage persistence
- **Remote mode**: PostgreSQL database persistence via API routes

The app supports multiple views (Inbox, Next Steps, Daily Tasks, Projects) with drag-and-drop task organization.

**Storage Configuration**: Set `NEXT_PUBLIC_STORAGE_TYPE` in `.env` to `'local'` or `'remote'` to switch between modes.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack at localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run preview          # Build + start together

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting errors
npm run format:check     # Check Prettier formatting
npm run format:write     # Fix formatting
npm run typecheck        # TypeScript type checking

# Testing
npm run test             # Run Jest unit tests
npm run test:watch       # Jest watch mode
npm run e2e              # Run Playwright e2e tests
npm run e2e:ui           # Playwright with UI

# Setup
npm run prepare          # Install Husky (required for git hooks)

# Database (Remote mode only)
# Run migrations from migrations/ folder using psql or a migration tool
psql $DATABASE_URL -f migrations/000_migration_tracking.sql
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

## Architecture

### Data Flow & State Management

The app uses a centralized hook pattern with a storage abstraction layer:

- **[src/hooks/use-tasks.ts](src/hooks/use-tasks.ts)**: Single source of truth for all task/project state
  - Manages both `tasks` and `projects` in React state
  - Uses storage layer (async operations) via [src/lib/storage.ts](src/lib/storage.ts)
  - **Multi-tab sync**: Listens to `storage` events to sync state across browser tabs (local mode only)
  - Provides all CRUD operations and filtering methods

- **[src/lib/storage.ts](src/lib/storage.ts)**: Storage abstraction layer
  - Checks `NEXT_PUBLIC_STORAGE_TYPE` environment variable
  - Routes to either local storage or database storage
  - Provides unified async interface: `getTasks()`, `saveTasks()`, `getProjects()`, `saveProjects()`

- **[src/lib/db-storage.ts](src/lib/db-storage.ts)**: Database storage adapter
  - Makes fetch calls to API routes for remote storage
  - Endpoints: `/api/tasks`, `/api/projects` with CRUD operations
  - **Note**: API routes need to be implemented to complete remote mode

### View System

The app uses a view-based routing system (not Next.js routes):
- **[src/app/[locale]/page.tsx](src/app/[locale]/page.tsx)**: Main page component that renders different views based on `currentView` state
- Views are switched via the [Sidebar](src/components/sidebar.tsx) component
- View types:
  - `inbox`: Tasks without a project (filtered by `!task.projectId && !task.isDaily`)
  - `next-steps`: Incomplete tasks with due dates
  - `daily-tasks`: Recurring tasks (filtered by `task.isDaily` and completion date)
  - `{projectId}`: Project-specific tasks

### Component Structure

- **View components**: `inbox-view.tsx`, `next-steps-view.tsx`, `daily-tasks-view.tsx`, `project-view.tsx`
  - Each renders a filtered list of tasks
  - Handles task creation with view-specific defaults
  - Delegates to `task-item.tsx` for rendering
- **[task-item.tsx](src/components/task-item.tsx)**: Displays individual tasks with drag-and-drop support
- **[task-detail-sidebar.tsx](src/components/task-detail-sidebar.tsx)**: Right sidebar for editing task details
- **[sidebar.tsx](src/components/sidebar.tsx)**: Left navigation with projects list and drag-to-reorder

### Data Models

From [src/lib/types.ts](src/lib/types.ts):
- **Task**: `id`, `title`, `description`, `completed`, `dueDate`, `projectId`, `order`, `isDaily`, `timePeriod`, `lastCompleted`, `createdAt`
- **Project**: `id`, `name`, `order`, `createdAt`

### Database Schema

PostgreSQL migrations are in [migrations/](migrations/):
- `000_migration_tracking.sql` - Creates `schema_migrations` table
- `001_initial_schema.sql` - Creates `tasks` and `projects` tables with indexes

**Key details**:
- Uses UUID primary keys with `gen_random_uuid()`
- `tasks.project_id` foreign key with `ON DELETE CASCADE`
- Automatic `updated_at` timestamp triggers
- Indexes on `project_id`, `completed`, `due_date`, `is_daily`, `order`
- Snake_case column names in DB, camelCase in TypeScript

### Key Patterns

1. **Dual storage modes**: App works in both local and remote mode via storage abstraction layer
2. **Drag-and-drop ordering**: Tasks and projects use `order` field for sorting, updated via `reorderTasks()` and `reorderProjects()`
3. **Daily tasks**: Use `isDaily: true` flag and track `lastCompleted` date to show tasks that need to be done again
4. **Path aliases**: Use `@/` prefix for imports (e.g., `@/components`, `@/lib`)
5. **Environment variables**: Managed via `@t3-oss/env-nextjs` in [src/env.mjs](src/env.mjs) with Zod validation
   - `NEXT_PUBLIC_STORAGE_TYPE`: `'local'` or `'remote'`
   - `DATABASE_URL`: PostgreSQL connection string (required for remote mode)

## Technology Stack

- **Next.js 15** with App Router
- **React 19** (client-side only, no server components for main app logic)
- **TypeScript** (strict mode enabled)
- **Tailwind CSS 4** with `shadcn/ui` components
- **next-intl** for i18n (locale in URL path: `/[locale]/page.tsx`)
- **next-themes** for dark mode
- **Testing**: Jest + React Testing Library (unit), Playwright (e2e)

## Important Notes

- **Dual storage architecture**: App supports both local (localStorage) and remote (PostgreSQL) storage modes
  - Switch via `NEXT_PUBLIC_STORAGE_TYPE` in `.env`
  - **Remote mode incomplete**: API routes in `src/app/api/tasks/` and `src/app/api/projects/` need to be implemented
- **Multi-tab behavior**: The storage event listener in `use-tasks.ts` syncs changes across tabs (local mode only)
- **No authentication**: All Stripe, NextAuth references are legacy from the original template
- **Locale routing**: All pages are under `[locale]` dynamic route for i18n support
- **Git hooks**: Husky runs lint-staged on pre-commit (ESLint + Prettier on staged files)

## Implementing Remote Storage (TODO)

To complete remote storage support, create API routes:

1. **`src/app/api/tasks/route.ts`**: GET (list), POST (create)
2. **`src/app/api/tasks/[id]/route.ts`**: PATCH (update), DELETE
3. **`src/app/api/tasks/reorder/route.ts`**: POST (bulk update order)
4. **`src/app/api/projects/route.ts`**: GET (list), POST (create)
5. **`src/app/api/projects/[id]/route.ts`**: PATCH (update), DELETE
6. **`src/app/api/projects/reorder/route.ts`**: POST (bulk update order)

Use `@neondatabase/serverless` with `DATABASE_URL` from env to query the PostgreSQL database.
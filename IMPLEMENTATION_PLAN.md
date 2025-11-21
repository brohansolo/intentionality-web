# Implementation Plan: Local-First Sync Queue Architecture

This document outlines the step-by-step implementation plan for refactoring the task management system to use a unified local-first storage architecture with background sync queue.

## Overview

Replace the current dual-mode architecture (local-only OR remote-only) with a unified local-first approach that:
- Updates localStorage immediately for instant UI feedback
- Queues operations for background sync to remote server
- Works offline and syncs when connection is restored
- Provides a single unified API for all components

---

## Procedure

Mark tasks as done as you complete them and commit at regular/logical points to save progress.

## Phase 1: Foundation - Create Core Types & Interfaces

### Step 1.1: Create sync types file
- [ ] Create directory `src/lib/sync/`
- [ ] Create file `src/lib/sync/types.ts`
- [ ] Define `OperationType` enum with all operation types:
  - `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `REORDER_TASKS`
  - `ADD_PROJECT`, `UPDATE_PROJECT`, `DELETE_PROJECT`, `REORDER_PROJECTS`
  - `ADD_TAG`, `UPDATE_TAG`, `DELETE_TAG`
  - `ADD_TASK_TAG`, `REMOVE_TASK_TAG`
  - `ADD_PROJECT_TAG`, `REMOVE_PROJECT_TAG`
  - `ADD_TODAY_TASK`, `REMOVE_TODAY_TASK`, `REORDER_TODAY_TASKS`
- [ ] Define `QueuedOperation` interface with fields:
  - `id: string`
  - `type: OperationType`
  - `payload: unknown`
  - `timestamp: number`
  - `retries: number`
  - `status: 'pending' | 'processing' | 'failed'`
- [ ] Define `IStorageAdapter` interface with all CRUD methods:
  - Task methods: `getTasks()`, `addTask()`, `updateTask()`, `deleteTask()`, `reorderTasks()`
  - Project methods: `getProjects()`, `addProject()`, `updateProject()`, `deleteProject()`, `reorderProjects()`
  - Tag methods: `getTags()`, `addTag()`, `updateTag()`, `deleteTag()`
  - TaskTag methods: `getTaskTags()`, `addTaskTag()`, `removeTaskTag()`
  - ProjectTag methods: `getProjectTags()`, `addProjectTag()`, `removeProjectTag()`
  - TodayTask methods: `getTodayTasks()`, `saveTodayTasks()`
- [ ] Export all types and interfaces

---

## Phase 2: Local Storage Adapter

### Step 2.1: Create LocalStorageAdapter class
- [ ] Create file `src/lib/sync/local-storage-adapter.ts`
- [ ] Import `IStorageAdapter` and all data types
- [ ] Define localStorage key constants:
  - `TASKS_KEY = 'tasks'`
  - `PROJECTS_KEY = 'projects'`
  - `TODAY_KEY = 'today'`
  - `TAGS_KEY = 'tags'`
  - `TASK_TAGS_KEY = 'task_tags'`
  - `PROJECT_TAGS_KEY = 'project_tags'`
- [ ] Create `LocalStorageAdapter` class implementing `IStorageAdapter`

### Step 2.2: Implement Task methods
- [ ] Implement `getTasks(): Promise<Task[]>`
  - Read from localStorage, parse JSON, return array
  - Handle SSR case (return empty array if window undefined)
- [ ] Implement `addTask(task: Task): Promise<void>`
  - Read current tasks, append new task, save back to localStorage
- [ ] Implement `updateTask(id: string, updates: Partial<Task>): Promise<void>`
  - Read tasks, find by id, merge updates, save back
- [ ] Implement `deleteTask(id: string): Promise<void>`
  - Read tasks, filter out task by id, save back
- [ ] Implement `reorderTasks(tasks: Task[]): Promise<void>`
  - Read all tasks, merge with reordered tasks, save back

### Step 2.3: Implement Project methods
- [ ] Implement `getProjects(): Promise<Project[]>`
- [ ] Implement `addProject(project: Project): Promise<void>`
- [ ] Implement `updateProject(id: string, updates: Partial<Project>): Promise<void>`
- [ ] Implement `deleteProject(id: string): Promise<void>`
- [ ] Implement `reorderProjects(projects: Project[]): Promise<void>`

### Step 2.4: Implement Tag methods
- [ ] Implement `getTags(): Promise<Tag[]>`
- [ ] Implement `addTag(tag: Tag): Promise<void>`
- [ ] Implement `updateTag(id: string, updates: Partial<Tag>): Promise<void>`
- [ ] Implement `deleteTag(id: string): Promise<void>`

### Step 2.5: Implement TaskTag relationship methods
- [ ] Implement `getTaskTags(): Promise<TaskTag[]>`
- [ ] Implement `addTaskTag(taskId: string, tagId: string): Promise<void>`
  - Check for existing relationship before adding
- [ ] Implement `removeTaskTag(taskId: string, tagId: string): Promise<void>`

### Step 2.6: Implement ProjectTag relationship methods
- [ ] Implement `getProjectTags(): Promise<ProjectTag[]>`
- [ ] Implement `addProjectTag(projectId: string, tagId: string): Promise<void>`
- [ ] Implement `removeProjectTag(projectId: string, tagId: string): Promise<void>`

### Step 2.7: Implement TodayTask methods
- [ ] Implement `getTodayTasks(): Promise<TodayTask[]>`
- [ ] Implement `saveTodayTasks(todayTasks: TodayTask[]): Promise<void>`

### Step 2.8: Add helper methods
- [ ] Create private `readFromStorage<T>(key: string, defaultValue: T): T` helper
- [ ] Create private `writeToStorage<T>(key: string, value: T): void` helper
- [ ] Refactor all methods to use helpers

---

## Phase 3: Remote Storage Adapter

### Step 3.1: Create RemoteStorageAdapter class
- [ ] Create file `src/lib/sync/remote-storage-adapter.ts`
- [ ] Import `IStorageAdapter` and all data types
- [ ] Define API base URL constant
- [ ] Create `RemoteStorageAdapter` class implementing `IStorageAdapter`

### Step 3.2: Implement Task API methods
- [ ] Implement `getTasks(): Promise<Task[]>`
  - Fetch from `/api/tasks`
  - Parse response, handle errors
- [ ] Implement `addTask(task: Task): Promise<void>`
  - POST to `/api/tasks`
  - Handle response and errors
- [ ] Implement `updateTask(id: string, updates: Partial<Task>): Promise<void>`
  - PATCH to `/api/tasks/${id}`
- [ ] Implement `deleteTask(id: string): Promise<void>`
  - DELETE to `/api/tasks/${id}`
- [ ] Implement `reorderTasks(tasks: Task[]): Promise<void>`
  - POST to `/api/tasks/reorder`

### Step 3.3: Implement Project API methods
- [ ] Implement `getProjects(): Promise<Project[]>`
- [ ] Implement `addProject(project: Project): Promise<void>`
- [ ] Implement `updateProject(id: string, updates: Partial<Project>): Promise<void>`
- [ ] Implement `deleteProject(id: string): Promise<void>`
- [ ] Implement `reorderProjects(projects: Project[]): Promise<void>`

### Step 3.4: Implement Tag API methods
- [ ] Implement `getTags(): Promise<Tag[]>`
- [ ] Implement `addTag(tag: Tag): Promise<void>`
- [ ] Implement `updateTag(id: string, updates: Partial<Tag>): Promise<void>`
- [ ] Implement `deleteTag(id: string): Promise<void>`

### Step 3.5: Implement relationship API methods
- [ ] Implement `getTaskTags(): Promise<TaskTag[]>`
- [ ] Implement `addTaskTag(taskId: string, tagId: string): Promise<void>`
- [ ] Implement `removeTaskTag(taskId: string, tagId: string): Promise<void>`
- [ ] Implement `getProjectTags(): Promise<ProjectTag[]>`
- [ ] Implement `addProjectTag(projectId: string, tagId: string): Promise<void>`
- [ ] Implement `removeProjectTag(projectId: string, tagId: string): Promise<void>`

### Step 3.6: Implement TodayTask API methods
- [ ] Implement `getTodayTasks(): Promise<TodayTask[]>` (stub for now)
- [ ] Implement `saveTodayTasks(todayTasks: TodayTask[]): Promise<void>` (stub for now)

### Step 3.7: Add error handling
- [ ] Create private `handleResponse<T>(response: Response): Promise<T>` helper
- [ ] Add try-catch blocks in all methods
- [ ] Throw descriptive errors with status codes

---

## Phase 4: Sync Queue Manager

### Step 4.1: Create SyncQueue class
- [ ] Create file `src/lib/sync/sync-queue.ts`
- [ ] Import `QueuedOperation` and `OperationType` from types
- [ ] Define `QUEUE_KEY = 'sync_queue'` constant
- [ ] Create `SyncQueue` class with private `queue: QueuedOperation[]` field

### Step 4.2: Implement queue initialization
- [ ] Implement constructor that calls `loadQueue()`
- [ ] Implement private `loadQueue(): void`
  - Read from localStorage
  - Parse JSON or initialize empty array
  - Store in `this.queue`

### Step 4.3: Implement queue persistence
- [ ] Implement private `persistQueue(): void`
  - Serialize `this.queue` to JSON
  - Save to localStorage at `QUEUE_KEY`

### Step 4.4: Implement queue operations
- [ ] Implement `enqueue(type: OperationType, payload: unknown): void`
  - Create new `QueuedOperation` with:
    - Generated UUID
    - Provided type and payload
    - Current timestamp
    - `retries: 0`
    - `status: 'pending'`
  - Add to queue array
  - Call `persistQueue()`
- [ ] Implement `getNextBatch(batchSize: number = 10): QueuedOperation[]`
  - Filter queue for `status === 'pending'`
  - Sort by timestamp (oldest first)
  - Return first `batchSize` items
- [ ] Implement `markComplete(operationId: string): void`
  - Remove operation from queue by id
  - Call `persistQueue()`
- [ ] Implement `markFailed(operationId: string): void`
  - Find operation by id
  - Set `status: 'failed'`
  - Increment `retries`
  - Call `persistQueue()`
- [ ] Implement `retryFailed(): void`
  - Find all failed operations with `retries < 3`
  - Set their status back to `'pending'`
  - Call `persistQueue()`

### Step 4.5: Add queue inspection methods
- [ ] Implement `getPendingCount(): number`
  - Return count of pending operations
- [ ] Implement `getFailedCount(): number`
  - Return count of failed operations
- [ ] Implement `getAllOperations(): QueuedOperation[]`
  - Return copy of queue for debugging
- [ ] Implement `clearQueue(): void`
  - Clear all operations (for testing/reset)

---

## Phase 5: Sync Worker

### Step 5.1: Create SyncWorker class
- [ ] Create file `src/lib/sync/sync-worker.ts`
- [ ] Import `SyncQueue`, `RemoteStorageAdapter`, `QueuedOperation`, `OperationType`
- [ ] Create `SyncWorker` class with fields:
  - `private queue: SyncQueue`
  - `private remoteAdapter: RemoteStorageAdapter`
  - `private intervalId: number | null = null`
  - `private isProcessing = false`
  - `private syncIntervalMs: number`

### Step 5.2: Implement constructor and lifecycle
- [ ] Implement constructor accepting:
  - `queue: SyncQueue`
  - `remoteAdapter: RemoteStorageAdapter`
  - `syncIntervalMs: number = 5000`
- [ ] Implement `start(): void`
  - Check if already running (return early if `intervalId` exists)
  - Create interval with `setInterval(() => this.processQueue(), this.syncIntervalMs)`
  - Store interval ID
- [ ] Implement `stop(): void`
  - Check if running
  - Clear interval with `clearInterval()`
  - Set `intervalId` to null

### Step 5.3: Implement queue processing
- [ ] Implement `async processQueue(): Promise<void>`
  - Check if already processing (return early if true)
  - Check if online (return early if offline)
  - Set `isProcessing = true`
  - Wrap in try-finally block
  - Get next batch from queue
  - Loop through batch and execute each operation
  - Catch errors per operation, mark as failed or complete
  - Set `isProcessing = false` in finally block

### Step 5.4: Implement operation execution
- [ ] Implement private `async executeOperation(operation: QueuedOperation): Promise<void>`
  - Switch on `operation.type`
  - Handle all operation types:
    - `ADD_TASK`: call `remoteAdapter.addTask(operation.payload)`
    - `UPDATE_TASK`: call `remoteAdapter.updateTask(payload.id, payload.updates)`
    - `DELETE_TASK`: call `remoteAdapter.deleteTask(payload.id)`
    - `REORDER_TASKS`: call `remoteAdapter.reorderTasks(payload)`
    - `ADD_PROJECT`: call `remoteAdapter.addProject(operation.payload)`
    - `UPDATE_PROJECT`: call `remoteAdapter.updateProject(payload.id, payload.updates)`
    - `DELETE_PROJECT`: call `remoteAdapter.deleteProject(payload.id)`
    - `REORDER_PROJECTS`: call `remoteAdapter.reorderProjects(payload)`
    - `ADD_TAG`: call `remoteAdapter.addTag(operation.payload)`
    - `UPDATE_TAG`: call `remoteAdapter.updateTag(payload.id, payload.updates)`
    - `DELETE_TAG`: call `remoteAdapter.deleteTag(payload.id)`
    - `ADD_TASK_TAG`: call `remoteAdapter.addTaskTag(payload.taskId, payload.tagId)`
    - `REMOVE_TASK_TAG`: call `remoteAdapter.removeTaskTag(payload.taskId, payload.tagId)`
    - `ADD_PROJECT_TAG`: call `remoteAdapter.addProjectTag(payload.projectId, payload.tagId)`
    - `REMOVE_PROJECT_TAG`: call `remoteAdapter.removeProjectTag(payload.projectId, payload.tagId)`
    - Default: throw error for unknown operation type

### Step 5.5: Add manual sync and status methods
- [ ] Implement `async syncNow(): Promise<void>`
  - Immediately call `processQueue()`
- [ ] Implement `isRunning(): boolean`
  - Return whether worker is active
- [ ] Implement `isSyncing(): boolean`
  - Return `isProcessing` flag

---

## Phase 6: Storage Manager (Orchestrator)

### Step 6.1: Create StorageManager class
- [ ] Create file `src/lib/sync/storage-manager.ts`
- [ ] Import all adapters, queue, worker, and types
- [ ] Create `StorageManager` class with fields:
  - `private localAdapter: LocalStorageAdapter`
  - `private queue: SyncQueue`
  - `private worker?: SyncWorker`
  - `private enableRemoteSync: boolean`

### Step 6.2: Implement constructor and initialization
- [ ] Implement constructor accepting:
  - `enableRemoteSync: boolean = false`
  - `remoteAdapter?: RemoteStorageAdapter`
  - `syncIntervalMs: number = 5000`
- [ ] Initialize `localAdapter = new LocalStorageAdapter()`
- [ ] Initialize `queue = new SyncQueue()`
- [ ] If `enableRemoteSync && remoteAdapter`:
  - Initialize `worker = new SyncWorker(queue, remoteAdapter, syncIntervalMs)`
  - Call `worker.start()`

### Step 6.3: Implement Task operations
- [ ] Implement `async addTask(task: Task): Promise<void>`
  - Call `await this.localAdapter.addTask(task)`
  - Call `this.queue.enqueue('ADD_TASK', task)`
- [ ] Implement `async updateTask(id: string, updates: Partial<Task>): Promise<void>`
  - Call `await this.localAdapter.updateTask(id, updates)`
  - Call `this.queue.enqueue('UPDATE_TASK', { id, updates })`
- [ ] Implement `async deleteTask(id: string): Promise<void>`
  - Call `await this.localAdapter.deleteTask(id)`
  - Call `this.queue.enqueue('DELETE_TASK', { id })`
- [ ] Implement `async reorderTasks(tasks: Task[]): Promise<void>`
  - Call `await this.localAdapter.reorderTasks(tasks)`
  - Call `this.queue.enqueue('REORDER_TASKS', tasks)`
- [ ] Implement `async getTasks(): Promise<Task[]>`
  - Return `await this.localAdapter.getTasks()`
  - No queue operation for reads

### Step 6.4: Implement Project operations
- [ ] Implement `async addProject(project: Project): Promise<void>`
- [ ] Implement `async updateProject(id: string, updates: Partial<Project>): Promise<void>`
- [ ] Implement `async deleteProject(id: string): Promise<void>`
- [ ] Implement `async reorderProjects(projects: Project[]): Promise<void>`
- [ ] Implement `async getProjects(): Promise<Project[]>`

### Step 6.5: Implement Tag operations
- [ ] Implement `async addTag(tag: Tag): Promise<void>`
- [ ] Implement `async updateTag(id: string, updates: Partial<Tag>): Promise<void>`
- [ ] Implement `async deleteTag(id: string): Promise<void>`
- [ ] Implement `async getTags(): Promise<Tag[]>`

### Step 6.6: Implement TaskTag operations
- [ ] Implement `async addTaskTag(taskId: string, tagId: string): Promise<void>`
- [ ] Implement `async removeTaskTag(taskId: string, tagId: string): Promise<void>`
- [ ] Implement `async getTaskTags(): Promise<TaskTag[]>`

### Step 6.7: Implement ProjectTag operations
- [ ] Implement `async addProjectTag(projectId: string, tagId: string): Promise<void>`
- [ ] Implement `async removeProjectTag(projectId: string, tagId: string): Promise<void>`
- [ ] Implement `async getProjectTags(): Promise<ProjectTag[]>`

### Step 6.8: Implement TodayTask operations
- [ ] Implement `async getTodayTasks(): Promise<TodayTask[]>`
- [ ] Implement `async saveTodayTasks(todayTasks: TodayTask[]): Promise<void>`

### Step 6.9: Add sync control methods
- [ ] Implement `async syncNow(): Promise<void>`
  - Call `worker?.syncNow()`
- [ ] Implement `stopSync(): void`
  - Call `worker?.stop()`
- [ ] Implement `startSync(): void`
  - Call `worker?.start()`
- [ ] Implement `getSyncStatus(): { pending: number; failed: number; isRunning: boolean; isSyncing: boolean }`
  - Return queue counts and worker status
- [ ] Implement `retryFailed(): void`
  - Call `queue.retryFailed()`
- [ ] Implement `clearQueue(): void`
  - Call `queue.clearQueue()`

---

## Phase 7: Update Environment Configuration

### Step 7.1: Add sync configuration to env.mjs
- [ ] Open `src/env.mjs`
- [ ] Add `NEXT_PUBLIC_SYNC_INTERVAL_MS` to client schema
  - Type: `z.coerce.number()`
  - Default: `5000`
- [ ] Ensure `NEXT_PUBLIC_STORAGE_TYPE` exists and defaults to `'local'`

### Step 7.2: Update .env.example
- [ ] Add example for `NEXT_PUBLIC_SYNC_INTERVAL_MS=5000`
- [ ] Add comments explaining sync interval configuration

---

## Phase 8: Refactor useTasks Hook

### Step 8.1: Update imports in use-tasks.ts
- [ ] Import `StorageManager` from `@/lib/sync/storage-manager`
- [ ] Import `RemoteStorageAdapter` from `@/lib/sync/remote-storage-adapter`
- [ ] Import `env` from `@/env.mjs`
- [ ] Remove import of `storage` from `@/lib/storage`

### Step 8.2: Initialize StorageManager in hook
- [ ] Create `useMemo` to instantiate StorageManager
- [ ] Check `env.NEXT_PUBLIC_STORAGE_TYPE === 'remote'` for `enableRemoteSync`
- [ ] Create `RemoteStorageAdapter` instance if remote sync enabled
- [ ] Pass `env.NEXT_PUBLIC_SYNC_INTERVAL_MS` to StorageManager
- [ ] Store in ref or state to persist across renders

### Step 8.3: Update data loading useEffect
- [ ] Replace all `storage.getTasks()` calls with `storageManager.getTasks()`
- [ ] Replace all `storage.getProjects()` calls with `storageManager.getProjects()`
- [ ] Replace all `storage.getTags()` calls with `storageManager.getTags()`
- [ ] Replace all `storage.getTaskTags()` calls with `storageManager.getTaskTags()`
- [ ] Replace all `storage.getProjectTags()` calls with `storageManager.getProjectTags()`
- [ ] Replace all `storage.getTodayTasks()` calls with `storageManager.getTodayTasks()`

### Step 8.4: Update addTask function
- [ ] Remove `storage.saveTasks()` call
- [ ] Replace with `await storageManager.addTask(newTask)`
- [ ] Update tag handling to use `storageManager.addTaskTag()`

### Step 8.5: Update updateTask function
- [ ] Remove `storage.saveTasks()` call
- [ ] Replace with `await storageManager.updateTask(id, updates)`

### Step 8.6: Update deleteTask function
- [ ] Remove `storage.saveTasks()` call
- [ ] Replace with `await storageManager.deleteTask(id)`

### Step 8.7: Update reorderTasks function
- [ ] Remove `storage.saveTasks()` call
- [ ] Replace with `await storageManager.reorderTasks(reorderedTasks)`

### Step 8.8: Update Project functions
- [ ] Update `addProject` to use `storageManager.addProject()`
- [ ] Update `updateProject` to use `storageManager.updateProject()`
- [ ] Update `deleteProject` to use `storageManager.deleteProject()`
- [ ] Update `reorderProjects` to use `storageManager.reorderProjects()`

### Step 8.9: Update Tag functions
- [ ] Update `addTag` to use `storageManager.addTag()`
- [ ] Update `updateTag` to use `storageManager.updateTag()`
- [ ] Update `deleteTag` to use `storageManager.deleteTag()`

### Step 8.10: Update Tag relationship functions
- [ ] Update `addTagToTask` to use `storageManager.addTaskTag()`
- [ ] Update `removeTagFromTask` to use `storageManager.removeTaskTag()`
- [ ] Update `addTagToProject` to use `storageManager.addProjectTag()`
- [ ] Update `removeTagFromProject` to use `storageManager.removeProjectTag()`

### Step 8.11: Update Today task functions
- [ ] Update `addToToday` to use `storageManager.saveTodayTasks()`
- [ ] Update `removeFromToday` to use `storageManager.saveTodayTasks()`
- [ ] Update `reorderTodayTasks` to use `storageManager.saveTodayTasks()`
- [ ] Update `clearToday` to use `storageManager.saveTodayTasks()`

### Step 8.12: Add sync control methods to hook return
- [ ] Add `syncNow: () => storageManager.syncNow()`
- [ ] Add `getSyncStatus: () => storageManager.getSyncStatus()`
- [ ] Add `retryFailedSync: () => storageManager.retryFailed()`
- [ ] Add `clearSyncQueue: () => storageManager.clearQueue()`

---

## Phase 9: Clean Up Old Files

### Step 9.1: Remove obsolete files
- [ ] Delete `src/hooks/use-tasks-remote.ts`
- [ ] Delete `src/hooks/use-tasks-adapter.ts`
- [ ] Delete `src/lib/storage.ts`
- [ ] Delete `src/lib/db-storage.ts`
- [ ] Keep `src/lib/postgrest-storage.ts` for reference (can be adapted if needed)

### Step 9.2: Update component imports
- [ ] Search for all imports of `use-tasks-adapter`
- [ ] Replace with direct import of `useTasks` from `@/hooks/use-tasks`
- [ ] Search for any remaining imports of `storage` from `@/lib/storage`
- [ ] Update to use the hook methods instead

---

## Phase 10: Testing & Validation

### Step 10.1: Test local-only mode
- [ ] Set `NEXT_PUBLIC_STORAGE_TYPE=local` in `.env`
- [ ] Start dev server
- [ ] Test creating tasks (verify localStorage)
- [ ] Test updating tasks
- [ ] Test deleting tasks
- [ ] Test reordering tasks
- [ ] Test all project operations
- [ ] Test all tag operations
- [ ] Verify no queue is created in localStorage

### Step 10.2: Test local-first with remote sync mode
- [ ] Set `NEXT_PUBLIC_STORAGE_TYPE=remote` in `.env`
- [ ] Start dev server
- [ ] Test creating tasks (verify localStorage updated immediately)
- [ ] Check `sync_queue` in localStorage (should have queued operations)
- [ ] Verify queue processes (check console for sync attempts)
- [ ] Test offline behavior (disable network, create tasks, verify queued)
- [ ] Re-enable network and verify queue processes

### Step 10.3: Test multi-tab synchronization
- [ ] Open app in two browser tabs
- [ ] Create task in tab 1
- [ ] Verify task appears in tab 2 (via storage event listener)
- [ ] Update task in tab 2
- [ ] Verify update appears in tab 1

### Step 10.4: Test error handling
- [ ] Force network errors (block API endpoints)
- [ ] Create tasks and verify they queue
- [ ] Verify failed operations are marked as failed
- [ ] Restore network
- [ ] Call `retryFailedSync()`
- [ ] Verify failed operations are retried

### Step 10.5: Test sync interval configuration
- [ ] Set `NEXT_PUBLIC_SYNC_INTERVAL_MS=2000` in `.env`
- [ ] Verify worker syncs every 2 seconds
- [ ] Set to `10000` and verify 10-second interval

---

## Phase 11: Documentation & Final Steps

### Step 11.1: Update CLAUDE.md
- [ ] Document new architecture in "Architecture" section
- [ ] Update "Data Flow & State Management" with StorageManager pattern
- [ ] Document sync queue and worker behavior
- [ ] Update environment variables section
- [ ] Remove references to old dual-mode architecture
- [ ] Add section on sync controls and queue management

### Step 11.2: Update README (if exists)
- [ ] Document local-first architecture
- [ ] Explain sync queue behavior
- [ ] Document environment variables for sync configuration
- [ ] Add troubleshooting section for sync issues

### Step 11.3: Add JSDoc comments
- [ ] Add JSDoc to all public methods in `StorageManager`
- [ ] Add JSDoc to all public methods in `SyncQueue`
- [ ] Add JSDoc to all public methods in `SyncWorker`
- [ ] Add JSDoc to adapter classes
- [ ] Add examples in comments where helpful

### Step 11.4: Create migration guide
- [ ] Create `MIGRATION.md` with upgrade instructions
- [ ] Document breaking changes
- [ ] Provide code examples for updating components
- [ ] Document new hook methods and sync controls

---

## Phase 12: Optional Enhancements

### Step 12.1: Add sync status UI (optional)
- [ ] Create `SyncStatusIndicator` component
- [ ] Show pending operation count
- [ ] Show sync status (syncing/idle/error)
- [ ] Add button to manually trigger sync
- [ ] Add button to retry failed operations
- [ ] Display last sync timestamp

### Step 12.2: Add conflict resolution (optional)
- [ ] Detect conflicting operations in queue
- [ ] Implement last-write-wins strategy
- [ ] Add conflict resolution UI for manual resolution
- [ ] Log conflicts for debugging

### Step 12.3: Add queue optimization (optional)
- [ ] Implement operation deduplication
- [ ] Merge consecutive updates to same entity
- [ ] Batch related operations for efficiency
- [ ] Add queue size limits

### Step 12.4: Add sync analytics (optional)
- [ ] Track sync success/failure rates
- [ ] Monitor queue size trends
- [ ] Log sync latency
- [ ] Add metrics dashboard

---

## Success Criteria

- ✅ All components use single `useTasks()` hook
- ✅ localStorage updates happen immediately (no lag)
- ✅ Operations queue for remote sync when enabled
- ✅ App works fully offline
- ✅ Queue persists across page refreshes
- ✅ Failed operations retry automatically
- ✅ Multi-tab synchronization works
- ✅ All tests pass
- ✅ No ESLint errors
- ✅ TypeScript compiles without errors
- ✅ Documentation is up to date

---

## Estimated Timeline

- **Phase 1-2**: 2-3 hours (Foundation + Local Adapter)
- **Phase 3**: 1-2 hours (Remote Adapter)
- **Phase 4**: 1-2 hours (Sync Queue)
- **Phase 5**: 2-3 hours (Sync Worker)
- **Phase 6**: 2-3 hours (Storage Manager)
- **Phase 7**: 0.5 hours (Environment Config)
- **Phase 8**: 2-3 hours (Refactor Hook)
- **Phase 9**: 1 hour (Cleanup)
- **Phase 10**: 2-4 hours (Testing)
- **Phase 11**: 1-2 hours (Documentation)
- **Phase 12**: 4-8 hours (Optional Enhancements)

**Total Core Implementation**: 14-22 hours
**Total with Enhancements**: 18-30 hours

import type {
  Project,
  ProjectTag,
  Tag,
  Task,
  TaskTag,
  TodayTask,
} from "@/lib/types";

import { LocalStorageAdapter } from "./local-storage-adapter";
import { RemoteStorageAdapter } from "./remote-storage-adapter";
import { SyncQueue } from "./sync-queue";
import { SyncWorker } from "./sync-worker";
import { OperationType } from "./types";

/**
 * StorageManager orchestrates local-first storage with optional background sync.
 * - All writes go to localStorage immediately (instant UI feedback)
 * - Operations are queued for background sync to remote server (if enabled)
 * - Reads always come from localStorage (fast, offline-capable)
 */
export class StorageManager {
  private localAdapter: LocalStorageAdapter;
  private queue: SyncQueue;
  private worker?: SyncWorker;
  private enableRemoteSync: boolean;

  constructor(
    enableRemoteSync = false,
    remoteAdapter?: RemoteStorageAdapter,
    syncIntervalMs = 5000,
  ) {
    this.localAdapter = new LocalStorageAdapter();
    this.queue = new SyncQueue();
    this.enableRemoteSync = enableRemoteSync;

    // Initialize sync worker if remote sync is enabled
    if (enableRemoteSync && remoteAdapter) {
      this.worker = new SyncWorker(this.queue, remoteAdapter, syncIntervalMs);
      this.worker.start();
    }
  }

  // ========== Task Operations ==========

  /**
   * Add a new task (local + queued for sync)
   */
  async addTask(task: Task): Promise<void> {
    await this.localAdapter.addTask(task);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.ADD_TASK, task);
    }
  }

  /**
   * Update a task (local + queued for sync)
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await this.localAdapter.updateTask(id, updates);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.UPDATE_TASK, { id, updates });
    }
  }

  /**
   * Delete a task (local + queued for sync)
   */
  async deleteTask(id: string): Promise<void> {
    await this.localAdapter.deleteTask(id);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.DELETE_TASK, { id });
    }
  }

  /**
   * Reorder tasks (local + queued for sync)
   */
  async reorderTasks(tasks: Task[]): Promise<void> {
    await this.localAdapter.reorderTasks(tasks);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.REORDER_TASKS, tasks);
    }
  }

  /**
   * Get all tasks (always from local)
   */
  async getTasks(): Promise<Task[]> {
    return this.localAdapter.getTasks();
  }

  // ========== Project Operations ==========

  /**
   * Add a new project (local + queued for sync)
   */
  async addProject(project: Project): Promise<void> {
    await this.localAdapter.addProject(project);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.ADD_PROJECT, project);
    }
  }

  /**
   * Update a project (local + queued for sync)
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await this.localAdapter.updateProject(id, updates);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.UPDATE_PROJECT, { id, updates });
    }
  }

  /**
   * Delete a project (local + queued for sync)
   */
  async deleteProject(id: string): Promise<void> {
    await this.localAdapter.deleteProject(id);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.DELETE_PROJECT, { id });
    }
  }

  /**
   * Reorder projects (local + queued for sync)
   */
  async reorderProjects(projects: Project[]): Promise<void> {
    await this.localAdapter.reorderProjects(projects);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.REORDER_PROJECTS, projects);
    }
  }

  /**
   * Get all projects (always from local)
   */
  async getProjects(): Promise<Project[]> {
    return this.localAdapter.getProjects();
  }

  // ========== Tag Operations ==========

  /**
   * Add a new tag (local + queued for sync)
   */
  async addTag(tag: Tag): Promise<void> {
    await this.localAdapter.addTag(tag);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.ADD_TAG, tag);
    }
  }

  /**
   * Update a tag (local + queued for sync)
   */
  async updateTag(id: string, updates: Partial<Tag>): Promise<void> {
    await this.localAdapter.updateTag(id, updates);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.UPDATE_TAG, { id, updates });
    }
  }

  /**
   * Delete a tag (local + queued for sync)
   */
  async deleteTag(id: string): Promise<void> {
    await this.localAdapter.deleteTag(id);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.DELETE_TAG, { id });
    }
  }

  /**
   * Get all tags (always from local)
   */
  async getTags(): Promise<Tag[]> {
    return this.localAdapter.getTags();
  }

  // ========== TaskTag Operations ==========

  /**
   * Add a task-tag relationship (local + queued for sync)
   */
  async addTaskTag(taskId: string, tagId: string): Promise<void> {
    await this.localAdapter.addTaskTag(taskId, tagId);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.ADD_TASK_TAG, { taskId, tagId });
    }
  }

  /**
   * Remove a task-tag relationship (local + queued for sync)
   */
  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await this.localAdapter.removeTaskTag(taskId, tagId);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.REMOVE_TASK_TAG, { taskId, tagId });
    }
  }

  /**
   * Get all task-tag relationships (always from local)
   */
  async getTaskTags(): Promise<TaskTag[]> {
    return this.localAdapter.getTaskTags();
  }

  // ========== ProjectTag Operations ==========

  /**
   * Add a project-tag relationship (local + queued for sync)
   */
  async addProjectTag(projectId: string, tagId: string): Promise<void> {
    await this.localAdapter.addProjectTag(projectId, tagId);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.ADD_PROJECT_TAG, { projectId, tagId });
    }
  }

  /**
   * Remove a project-tag relationship (local + queued for sync)
   */
  async removeProjectTag(projectId: string, tagId: string): Promise<void> {
    await this.localAdapter.removeProjectTag(projectId, tagId);
    if (this.enableRemoteSync) {
      this.queue.enqueue(OperationType.REMOVE_PROJECT_TAG, {
        projectId,
        tagId,
      });
    }
  }

  /**
   * Get all project-tag relationships (always from local)
   */
  async getProjectTags(): Promise<ProjectTag[]> {
    return this.localAdapter.getProjectTags();
  }

  // ========== TodayTask Operations ==========

  /**
   * Get today's tasks (always from local)
   */
  async getTodayTasks(): Promise<TodayTask[]> {
    return this.localAdapter.getTodayTasks();
  }

  /**
   * Save today's tasks (local + queued for sync)
   */
  async saveTodayTasks(todayTasks: TodayTask[]): Promise<void> {
    await this.localAdapter.saveTodayTasks(todayTasks);
    if (this.enableRemoteSync) {
      // Note: Today tasks sync not yet implemented in remote adapter
      this.queue.enqueue(OperationType.REORDER_TODAY_TASKS, todayTasks);
    }
  }

  // ========== Sync Control Methods ==========

  /**
   * Manually trigger sync now
   */
  async syncNow(): Promise<void> {
    if (this.worker) {
      await this.worker.syncNow();
    }
  }

  /**
   * Stop background sync
   */
  stopSync(): void {
    this.worker?.stop();
  }

  /**
   * Start background sync
   */
  startSync(): void {
    this.worker?.start();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    pending: number;
    failed: number;
    isRunning: boolean;
    isSyncing: boolean;
  } {
    return {
      pending: this.queue.getPendingCount(),
      failed: this.queue.getFailedCount(),
      isRunning: this.worker?.isRunning() ?? false,
      isSyncing: this.worker?.isSyncing() ?? false,
    };
  }

  /**
   * Retry all failed operations
   */
  retryFailed(): void {
    this.queue.retryFailed();
  }

  /**
   * Clear the sync queue (use with caution)
   */
  clearQueue(): void {
    this.queue.clearQueue();
  }
}

import type { Project, Tag, Task } from "@/lib/types";

import { RemoteStorageAdapter } from "./remote-storage-adapter";
import { SyncQueue } from "./sync-queue";
import { OperationType, QueuedOperation } from "./types";

/**
 * SyncWorker processes queued operations and syncs them to the remote server.
 * Runs on an interval and handles online/offline scenarios.
 */
export class SyncWorker {
  private queue: SyncQueue;
  private remoteAdapter: RemoteStorageAdapter;
  private intervalId: number | null = null;
  private isProcessing = false;
  private syncIntervalMs: number;

  constructor(
    queue: SyncQueue,
    remoteAdapter: RemoteStorageAdapter,
    syncIntervalMs = 5000,
  ) {
    this.queue = queue;
    this.remoteAdapter = remoteAdapter;
    this.syncIntervalMs = syncIntervalMs;
  }

  /**
   * Start the sync worker
   */
  start(): void {
    if (this.intervalId !== null) {
      return; // Already running
    }

    // Start processing queue at regular intervals
    this.intervalId = window.setInterval(() => {
      void this.processQueue();
    }, this.syncIntervalMs);

    // Process immediately on start
    void this.processQueue();
  }

  /**
   * Stop the sync worker
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process the queue and sync operations to remote
   */
  async processQueue(): Promise<void> {
    // Skip if already processing
    if (this.isProcessing) {
      return;
    }

    // Skip if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.queue.getNextBatch(10);

      for (const operation of batch) {
        try {
          await this.executeOperation(operation);
          this.queue.markComplete(operation.id);
        } catch (error) {
          console.error(
            `Failed to execute operation ${operation.type}:`,
            error,
          );
          this.queue.markFailed(operation.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { type, payload } = operation;

    switch (type) {
      // Task operations
      case OperationType.ADD_TASK:
        await this.remoteAdapter.addTask(
          payload as Parameters<typeof this.remoteAdapter.addTask>[0],
        );
        break;

      case OperationType.UPDATE_TASK: {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<Task>;
        };
        await this.remoteAdapter.updateTask(id, updates);
        break;
      }

      case OperationType.DELETE_TASK:
        await this.remoteAdapter.deleteTask((payload as { id: string }).id);
        break;

      case OperationType.REORDER_TASKS:
        await this.remoteAdapter.reorderTasks(
          payload as Parameters<typeof this.remoteAdapter.reorderTasks>[0],
        );
        break;

      // Project operations
      case OperationType.ADD_PROJECT:
        await this.remoteAdapter.addProject(
          payload as Parameters<typeof this.remoteAdapter.addProject>[0],
        );
        break;

      case OperationType.UPDATE_PROJECT: {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<Project>;
        };
        await this.remoteAdapter.updateProject(id, updates);
        break;
      }

      case OperationType.DELETE_PROJECT:
        await this.remoteAdapter.deleteProject((payload as { id: string }).id);
        break;

      case OperationType.REORDER_PROJECTS:
        await this.remoteAdapter.reorderProjects(
          payload as Parameters<typeof this.remoteAdapter.reorderProjects>[0],
        );
        break;

      // Tag operations
      case OperationType.ADD_TAG:
        await this.remoteAdapter.addTag(
          payload as Parameters<typeof this.remoteAdapter.addTag>[0],
        );
        break;

      case OperationType.UPDATE_TAG: {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<Tag>;
        };
        await this.remoteAdapter.updateTag(id, updates);
        break;
      }

      case OperationType.DELETE_TAG:
        await this.remoteAdapter.deleteTag((payload as { id: string }).id);
        break;

      // Task-Tag relationship operations
      case OperationType.ADD_TASK_TAG: {
        const { taskId, tagId } = payload as { taskId: string; tagId: string };
        await this.remoteAdapter.addTaskTag(taskId, tagId);
        break;
      }

      case OperationType.REMOVE_TASK_TAG: {
        const { taskId, tagId } = payload as { taskId: string; tagId: string };
        await this.remoteAdapter.removeTaskTag(taskId, tagId);
        break;
      }

      // Project-Tag relationship operations
      case OperationType.ADD_PROJECT_TAG: {
        const { projectId, tagId } = payload as {
          projectId: string;
          tagId: string;
        };
        await this.remoteAdapter.addProjectTag(projectId, tagId);
        break;
      }

      case OperationType.REMOVE_PROJECT_TAG: {
        const { projectId, tagId } = payload as {
          projectId: string;
          tagId: string;
        };
        await this.remoteAdapter.removeProjectTag(projectId, tagId);
        break;
      }

      // Today tasks operations (not yet implemented in remote adapter)
      case OperationType.ADD_TODAY_TASK:
      case OperationType.REMOVE_TODAY_TASK:
      case OperationType.REORDER_TODAY_TASKS:
        console.warn(
          `Operation type ${type} not yet implemented in remote adapter`,
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Manually trigger sync now
   */
  async syncNow(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Check if worker is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.isProcessing;
  }
}

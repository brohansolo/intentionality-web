import type { Project, Tag, Task, TodayTask } from "@/lib/types";

import { LocalStorageAdapter } from "./local-storage-adapter";
import { RemoteStorageAdapter } from "./remote-storage-adapter";
import { SyncQueue } from "./sync-queue";
import { OperationType, QueuedOperation } from "./types";

/**
 * SyncWorker processes queued operations and syncs them to the remote server.
 * Runs on an interval and handles online/offline scenarios.
 * Also handles pulling data from remote on initialization.
 */
export class SyncWorker {
  private queue: SyncQueue;
  private remoteAdapter: RemoteStorageAdapter;
  private localAdapter: LocalStorageAdapter;
  private intervalId: number | null = null;
  private isProcessing = false;
  private syncIntervalMs: number;

  constructor(
    queue: SyncQueue,
    remoteAdapter: RemoteStorageAdapter,
    localAdapter: LocalStorageAdapter,
    syncIntervalMs = 5000,
  ) {
    this.queue = queue;
    this.remoteAdapter = remoteAdapter;
    this.localAdapter = localAdapter;
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

      // Today tasks operations
      case OperationType.ADD_TODAY_TASK: {
        const { taskId, order } = payload as { taskId: string; order: number };
        // For add, we need to fetch current today tasks, add the new one, and save all
        const currentTodayTasks = await this.remoteAdapter.getTodayTasks();
        const newTodayTask: TodayTask = { taskId, order };
        await this.remoteAdapter.saveTodayTasks([
          ...currentTodayTasks,
          newTodayTask,
        ]);
        break;
      }

      case OperationType.REMOVE_TODAY_TASK: {
        const { taskId } = payload as { taskId: string };
        // For remove, we need to fetch current today tasks, filter out the one to remove, and save
        const currentTodayTasks = await this.remoteAdapter.getTodayTasks();
        await this.remoteAdapter.saveTodayTasks(
          currentTodayTasks.filter((tt) => tt.taskId !== taskId),
        );
        break;
      }

      case OperationType.REORDER_TODAY_TASKS:
        await this.remoteAdapter.saveTodayTasks(
          payload as Parameters<typeof this.remoteAdapter.saveTodayTasks>[0],
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Pull latest data from remote and save to local storage
   * This is called on app initialization to sync remote -> local
   */
  async pullFromRemote(): Promise<void> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("Offline - skipping pull from remote");
      return;
    }

    try {
      console.log("Pulling data from remote...");

      // Fetch all data from remote in parallel
      const [tasks, projects, tags, taskTags, projectTags, todayTasks] =
        await Promise.all([
          this.remoteAdapter.getTasks(),
          this.remoteAdapter.getProjects(),
          this.remoteAdapter.getTags(),
          this.remoteAdapter.getTaskTags(),
          this.remoteAdapter.getProjectTags(),
          this.remoteAdapter.getTodayTasks(),
        ]);

      // Save to local storage (overwrites local data with remote)
      // Use Promise.allSettled to continue even if some operations fail
      const results = await Promise.allSettled([
        // Save each entity type by clearing and re-adding all items
        this.saveToLocal("tasks", tasks),
        this.saveToLocal("projects", projects),
        this.saveToLocal("tags", tags),
        this.saveToLocal("task_tags", taskTags),
        this.saveToLocal("project_tags", projectTags),
        this.saveToLocal("today", todayTasks),
      ]);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const types = [
            "tasks",
            "projects",
            "tags",
            "task_tags",
            "project_tags",
            "today",
          ];
          console.error(
            `Failed to save ${types[index]} to local:`,
            result.reason,
          );
        }
      });

      console.log("Successfully pulled data from remote");
    } catch (error) {
      console.error("Failed to pull from remote:", error);
      // Don't throw - we want the app to continue even if pull fails
    }
  }

  /**
   * Helper to save data directly to localStorage
   */
  private async saveToLocal(key: string, data: unknown[]): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
      throw error;
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

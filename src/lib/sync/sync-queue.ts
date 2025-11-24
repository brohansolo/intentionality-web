import { OperationType, QueuedOperation } from "./types";

const QUEUE_KEY = "sync_queue";

/**
 * SyncQueue manages a persistent queue of operations waiting to be synced to the remote server.
 * Operations are stored in localStorage and survive page refreshes.
 */
export class SyncQueue {
  private queue: QueuedOperation[] = [];

  constructor() {
    console.log(
      "[SyncQueue] Constructor called, loading queue from localStorage",
    );
    this.loadQueue();
    console.log("[SyncQueue] Loaded queue with", this.queue.length, "items");
  }

  /**
   * Load the queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(QUEUE_KEY);
      console.log("[SyncQueue] Loading from localStorage, raw value:", stored);
      if (stored) {
        this.queue = JSON.parse(stored) as QueuedOperation[];
        console.log("[SyncQueue] Parsed queue:", this.queue);
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
      this.queue = [];
    }
  }

  /**
   * Persist the queue to localStorage
   */
  private persistQueue(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(this.queue);
      console.log("[SyncQueue] Persisting to localStorage:", {
        queueLength: this.queue.length,
        serialized,
      });
      window.localStorage.setItem(QUEUE_KEY, serialized);
      // Verify it was saved
      const verified = window.localStorage.getItem(QUEUE_KEY);
      console.log("[SyncQueue] Verified persisted value:", verified);
    } catch (error) {
      console.error("Failed to persist sync queue:", error);
    }
  }

  /**
   * Generate a unique ID for an operation
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add an operation to the queue
   */
  enqueue(type: OperationType, payload: unknown): void {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    this.queue.push(operation);
    console.log("[SyncQueue] Enqueued operation:", {
      type,
      queueSize: this.queue.length,
      pendingCount: this.getPendingCount(),
    });
    this.persistQueue();
  }

  /**
   * Get the next batch of pending operations
   */
  getNextBatch(batchSize = 10): QueuedOperation[] {
    // console.log("[SyncQueue] getNextBatch called, current queue:", {
    //   totalItems: this.queue.length,
    //   queue: this.queue,
    // });
    const pending = this.queue.filter((op) => op.status === "pending");
    console.log("[SyncQueue] Pending operations:", pending.length);
    const batch = pending
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, batchSize);
    // console.log("[SyncQueue] Returning batch:", batch);
    return batch;
  }

  /**
   * Mark an operation as complete and remove it from the queue
   */
  markComplete(operationId: string): void {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    console.log("[SyncQueue] Marked operation as complete:", {
      operationId,
      remainingInQueue: this.queue.length,
      pendingCount: this.getPendingCount(),
    });
    this.persistQueue();
  }

  /**
   * Mark an operation as failed and increment retry count
   */
  markFailed(operationId: string): void {
    const operation = this.queue.find((op) => op.id === operationId);
    if (operation) {
      operation.status = "failed";
      operation.retries += 1;
      this.persistQueue();
    }
  }

  /**
   * Retry all failed operations that haven't exceeded max retries
   */
  retryFailed(): void {
    const maxRetries = 3;

    for (const operation of this.queue) {
      if (operation.status === "failed" && operation.retries < maxRetries) {
        operation.status = "pending";
      }
    }

    this.persistQueue();
  }

  /**
   * Get count of pending operations
   */
  getPendingCount(): number {
    return this.queue.filter((op) => op.status === "pending").length;
  }

  /**
   * Get count of failed operations
   */
  getFailedCount(): number {
    return this.queue.filter((op) => op.status === "failed").length;
  }

  /**
   * Get all operations (for debugging)
   */
  getAllOperations(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Clear all operations from the queue
   */
  clearQueue(): void {
    this.queue = [];
    this.persistQueue();
  }
}

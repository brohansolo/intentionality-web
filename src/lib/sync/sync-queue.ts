import { OperationType, QueuedOperation } from "./types";

const QUEUE_KEY = "sync_queue";

/**
 * SyncQueue manages a persistent queue of operations waiting to be synced to the remote server.
 * Operations are stored in localStorage and survive page refreshes.
 */
export class SyncQueue {
  private queue: QueuedOperation[] = [];

  constructor() {
    this.loadQueue();
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
      if (stored) {
        this.queue = JSON.parse(stored) as QueuedOperation[];
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
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
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
    this.persistQueue();
  }

  /**
   * Get the next batch of pending operations
   */
  getNextBatch(batchSize = 10): QueuedOperation[] {
    return this.queue
      .filter((op) => op.status === "pending")
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, batchSize);
  }

  /**
   * Mark an operation as complete and remove it from the queue
   */
  markComplete(operationId: string): void {
    this.queue = this.queue.filter((op) => op.id !== operationId);
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

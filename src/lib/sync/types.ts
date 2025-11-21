import type {
  Project,
  ProjectTag,
  Tag,
  Task,
  TaskTag,
  TodayTask,
} from "@/lib/types";

/**
 * Enum representing all possible operation types that can be queued for sync
 */
export enum OperationType {
  // Task operations
  ADD_TASK = "ADD_TASK",
  UPDATE_TASK = "UPDATE_TASK",
  DELETE_TASK = "DELETE_TASK",
  REORDER_TASKS = "REORDER_TASKS",

  // Project operations
  ADD_PROJECT = "ADD_PROJECT",
  UPDATE_PROJECT = "UPDATE_PROJECT",
  DELETE_PROJECT = "DELETE_PROJECT",
  REORDER_PROJECTS = "REORDER_PROJECTS",

  // Tag operations
  ADD_TAG = "ADD_TAG",
  UPDATE_TAG = "UPDATE_TAG",
  DELETE_TAG = "DELETE_TAG",

  // Task-Tag relationship operations
  ADD_TASK_TAG = "ADD_TASK_TAG",
  REMOVE_TASK_TAG = "REMOVE_TASK_TAG",

  // Project-Tag relationship operations
  ADD_PROJECT_TAG = "ADD_PROJECT_TAG",
  REMOVE_PROJECT_TAG = "REMOVE_PROJECT_TAG",

  // Today tasks operations
  ADD_TODAY_TASK = "ADD_TODAY_TASK",
  REMOVE_TODAY_TASK = "REMOVE_TODAY_TASK",
  REORDER_TODAY_TASKS = "REORDER_TODAY_TASKS",
}

/**
 * Represents a queued operation waiting to be synced to the remote server
 */
export interface QueuedOperation {
  /** Unique identifier for this operation */
  id: string;
  /** Type of operation to perform */
  type: OperationType;
  /** Operation-specific payload data */
  payload: unknown;
  /** Timestamp when operation was queued */
  timestamp: number;
  /** Number of times this operation has been retried */
  retries: number;
  /** Current status of the operation */
  status: "pending" | "processing" | "failed";
}

/**
 * Storage adapter interface that all storage implementations must follow.
 * Provides a unified API for CRUD operations on all data types.
 */
export interface IStorageAdapter {
  // Task operations
  getTasks(): Promise<Task[]>;
  addTask(task: Task): Promise<void>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  deleteTask(id: string): Promise<void>;
  reorderTasks(tasks: Task[]): Promise<void>;

  // Project operations
  getProjects(): Promise<Project[]>;
  addProject(project: Project): Promise<void>;
  updateProject(id: string, updates: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;
  reorderProjects(projects: Project[]): Promise<void>;

  // Tag operations
  getTags(): Promise<Tag[]>;
  addTag(tag: Tag): Promise<void>;
  updateTag(id: string, updates: Partial<Tag>): Promise<void>;
  deleteTag(id: string): Promise<void>;

  // Task-Tag relationship operations
  getTaskTags(): Promise<TaskTag[]>;
  addTaskTag(taskId: string, tagId: string): Promise<void>;
  removeTaskTag(taskId: string, tagId: string): Promise<void>;

  // Project-Tag relationship operations
  getProjectTags(): Promise<ProjectTag[]>;
  addProjectTag(projectId: string, tagId: string): Promise<void>;
  removeProjectTag(projectId: string, tagId: string): Promise<void>;

  // Today tasks operations
  getTodayTasks(): Promise<TodayTask[]>;
  saveTodayTasks(todayTasks: TodayTask[]): Promise<void>;
}

import { env } from "@/env.mjs";
import type {
  Project,
  ProjectTag,
  Tag,
  Task,
  TaskTag,
  TodayTask,
} from "@/lib/types";

import type { IStorageAdapter } from "./types";

/**
 * RemoteStorageAdapter implements the IStorageAdapter interface using PostgREST/Supabase API.
 * All operations communicate with the remote database via REST endpoints.
 */
export class RemoteStorageAdapter implements IStorageAdapter {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
      );
    }

    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Helper to convert camelCase to snake_case for database
   */
  private toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      result[snakeKey] = value;
    }
    return result;
  }

  /**
   * Helper to handle API responses
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }
    return response.json() as Promise<T>;
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(preferReturn = false): HeadersInit {
    const headers: HeadersInit = {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (preferReturn) {
      headers["Prefer"] = "return=representation";
    }

    return headers;
  }

  // ========== Task Methods ==========

  async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.apiUrl}/rest/v1/tasks?select=*`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) => this.dbToTask(item as Record<string, unknown>));
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      throw error;
    }
  }

  async addTask(task: Task): Promise<void> {
    try {
      const dbTask = this.taskToDb(task);

      await fetch(`${this.apiUrl}/rest/v1/tasks`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify(dbTask),
      });
    } catch (error) {
      console.error("Failed to add task:", error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    try {
      const dbUpdates = this.taskToDb(updates);

      await fetch(`${this.apiUrl}/rest/v1/tasks?id=eq.${id}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(dbUpdates),
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/rest/v1/tasks?id=eq.${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  }

  async reorderTasks(tasks: Task[]): Promise<void> {
    try {
      const updatePromises = tasks.map((task) =>
        fetch(`${this.apiUrl}/rest/v1/tasks?id=eq.${task.id}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({ order: task.order }),
        }),
      );

      const responses = await Promise.all(updatePromises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to reorder ${failed.length} tasks`);
      }
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      throw error;
    }
  }

  // ========== Project Methods ==========

  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${this.apiUrl}/rest/v1/projects?select=*`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) =>
        this.dbToProject(item as Record<string, unknown>),
      );
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    }
  }

  async addProject(project: Project): Promise<void> {
    try {
      const dbProject = this.projectToDb(project);

      await fetch(`${this.apiUrl}/rest/v1/projects`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify(dbProject),
      });
    } catch (error) {
      console.error("Failed to add project:", error);
      throw error;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      const dbUpdates = this.projectToDb(updates);

      await fetch(`${this.apiUrl}/rest/v1/projects?id=eq.${id}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(dbUpdates),
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/rest/v1/projects?id=eq.${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }

  async reorderProjects(projects: Project[]): Promise<void> {
    try {
      const updatePromises = projects.map((project) =>
        fetch(`${this.apiUrl}/rest/v1/projects?id=eq.${project.id}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({ order: project.order }),
        }),
      );

      const responses = await Promise.all(updatePromises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to reorder ${failed.length} projects`);
      }
    } catch (error) {
      console.error("Failed to reorder projects:", error);
      throw error;
    }
  }

  // ========== Tag Methods ==========

  async getTags(): Promise<Tag[]> {
    try {
      const response = await fetch(`${this.apiUrl}/rest/v1/tags?select=*`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) => this.dbToTag(item as Record<string, unknown>));
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      throw error;
    }
  }

  async addTag(tag: Tag): Promise<void> {
    try {
      const dbTag = this.tagToDb(tag);

      await fetch(`${this.apiUrl}/rest/v1/tags`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify(dbTag),
      });
    } catch (error) {
      console.error("Failed to add tag:", error);
      throw error;
    }
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<void> {
    try {
      const dbUpdates = this.tagToDb(updates);

      await fetch(`${this.apiUrl}/rest/v1/tags?id=eq.${id}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(dbUpdates),
      });
    } catch (error) {
      console.error("Failed to update tag:", error);
      throw error;
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/rest/v1/tags?id=eq.${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error("Failed to delete tag:", error);
      throw error;
    }
  }

  // ========== TaskTag Relationship Methods ==========

  async getTaskTags(): Promise<TaskTag[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/rest/v1/task_tags?select=*`,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
      );

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) =>
        this.dbToTaskTag(item as Record<string, unknown>),
      );
    } catch (error) {
      console.error("Failed to fetch task tags:", error);
      throw error;
    }
  }

  async addTaskTag(taskId: string, tagId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/rest/v1/task_tags`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          task_id: taskId,
          tag_id: tagId,
          created_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to add task tag:", error);
      throw error;
    }
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    try {
      await fetch(
        `${this.apiUrl}/rest/v1/task_tags?task_id=eq.${taskId}&tag_id=eq.${tagId}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        },
      );
    } catch (error) {
      console.error("Failed to remove task tag:", error);
      throw error;
    }
  }

  // ========== ProjectTag Relationship Methods ==========

  async getProjectTags(): Promise<ProjectTag[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/rest/v1/project_tags?select=*`,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
      );

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) =>
        this.dbToProjectTag(item as Record<string, unknown>),
      );
    } catch (error) {
      console.error("Failed to fetch project tags:", error);
      throw error;
    }
  }

  async addProjectTag(projectId: string, tagId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/rest/v1/project_tags`, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({
          project_id: projectId,
          tag_id: tagId,
          created_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to add project tag:", error);
      throw error;
    }
  }

  async removeProjectTag(projectId: string, tagId: string): Promise<void> {
    try {
      await fetch(
        `${this.apiUrl}/rest/v1/project_tags?project_id=eq.${projectId}&tag_id=eq.${tagId}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        },
      );
    } catch (error) {
      console.error("Failed to remove project tag:", error);
      throw error;
    }
  }

  // ========== TodayTask Methods ==========

  async getTodayTasks(): Promise<TodayTask[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/rest/v1/today_tasks?select=*`,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
      );

      const data = await this.handleResponse<unknown[]>(response);
      return data.map((item) =>
        this.dbToTodayTask(item as Record<string, unknown>),
      );
    } catch (error) {
      console.error("Failed to fetch today tasks:", error);
      // Return empty array as fallback for stub implementation
      return [];
    }
  }

  async saveTodayTasks(todayTasks: TodayTask[]): Promise<void> {
    try {
      // Step 1: Delete all existing today_tasks
      await fetch(`${this.apiUrl}/rest/v1/today_tasks`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      // Step 2: Insert new ones if there are any
      if (todayTasks.length > 0) {
        const dbTodayTasks = todayTasks.map((tt) => ({
          task_id: tt.taskId,
          order: tt.order,
        }));

        await fetch(`${this.apiUrl}/rest/v1/today_tasks`, {
          method: "POST",
          headers: this.getHeaders(true),
          body: JSON.stringify(dbTodayTasks),
        });
      }
    } catch (error) {
      console.error("Failed to save today tasks:", error);
      throw error;
    }
  }

  // ========== Helper Methods for Data Conversion ==========

  private taskToDb(task: Partial<Task>): Record<string, unknown> {
    const dbTask = this.toSnakeCase(task as Record<string, unknown>);

    // Handle special fields
    if (task.dueDate !== undefined) dbTask.due_date = task.dueDate;
    if (task.projectId !== undefined) dbTask.project_id = task.projectId;
    if (task.parentTaskId !== undefined)
      dbTask.parent_task_id = task.parentTaskId;
    if (task.timePeriod !== undefined) dbTask.time_period = task.timePeriod;
    if (task.timeLeft !== undefined) dbTask.time_left = task.timeLeft;
    if (task.lastCompleted !== undefined)
      dbTask.last_completed = task.lastCompleted;
    if (task.completionHistory !== undefined)
      dbTask.completion_history = task.completionHistory;
    if (task.isDaily !== undefined) dbTask.is_daily = task.isDaily;
    if (task.createdAt !== undefined) dbTask.created_at = task.createdAt;

    return dbTask;
  }

  private dbToTask(dbTask: Record<string, unknown>): Task {
    return {
      id: dbTask.id as string,
      title: dbTask.title as string,
      description: dbTask.description as string | undefined,
      completed: dbTask.completed as boolean,
      dueDate: dbTask.due_date as string | undefined,
      projectId: dbTask.project_id as string | undefined,
      parentTaskId: dbTask.parent_task_id as string | undefined,
      order: dbTask.order as number,
      isDaily: dbTask.is_daily as boolean,
      timePeriod: dbTask.time_period as number | undefined,
      timeLeft: dbTask.time_left as number | undefined,
      lastCompleted: dbTask.last_completed as string | undefined,
      completionHistory: dbTask.completion_history as
        | Record<string, boolean>
        | undefined,
      createdAt: dbTask.created_at as string,
    };
  }

  private projectToDb(project: Partial<Project>): Record<string, unknown> {
    const dbProject = this.toSnakeCase(project as Record<string, unknown>);
    if (project.createdAt !== undefined)
      dbProject.created_at = project.createdAt;
    return dbProject;
  }

  private dbToProject(dbProject: Record<string, unknown>): Project {
    return {
      id: dbProject.id as string,
      name: dbProject.name as string,
      description: dbProject.description as string | undefined,
      completed: dbProject.completed as boolean,
      order: dbProject.order as number,
      createdAt: dbProject.created_at as string,
    };
  }

  private tagToDb(tag: Partial<Tag>): Record<string, unknown> {
    const dbTag = this.toSnakeCase(tag as Record<string, unknown>);
    if (tag.createdAt !== undefined) dbTag.created_at = tag.createdAt;
    return dbTag;
  }

  private dbToTag(dbTag: Record<string, unknown>): Tag {
    return {
      id: dbTag.id as string,
      name: dbTag.name as string,
      color: dbTag.color as string | undefined,
      createdAt: dbTag.created_at as string,
    };
  }

  private dbToTaskTag(dbTaskTag: Record<string, unknown>): TaskTag {
    return {
      taskId: dbTaskTag.task_id as string,
      tagId: dbTaskTag.tag_id as string,
      createdAt: dbTaskTag.created_at as string,
    };
  }

  private dbToProjectTag(dbProjectTag: Record<string, unknown>): ProjectTag {
    return {
      projectId: dbProjectTag.project_id as string,
      tagId: dbProjectTag.tag_id as string,
      createdAt: dbProjectTag.created_at as string,
    };
  }

  private dbToTodayTask(dbTodayTask: Record<string, unknown>): TodayTask {
    return {
      taskId: dbTodayTask.task_id as string,
      order: dbTodayTask.order as number,
    };
  }
}

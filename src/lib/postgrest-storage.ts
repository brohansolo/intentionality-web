import { env } from "@/env.mjs";

import { Task } from "./types";

// PostgREST/Supabase configuration
const getPostgrestConfig = () => {
  const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  }

  return { apiUrl, apiKey };
};

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
};

// Convert Task to database format
const taskToDb = (task: Partial<Task>): Record<string, unknown> => {
  const dbTask = toSnakeCase(task);

  // Handle optional fields
  if (task.dueDate) {
    dbTask.due_date = task.dueDate;
  }
  if (task.projectId) {
    dbTask.project_id = task.projectId;
  }
  if (task.parentTaskId) {
    dbTask.parent_task_id = task.parentTaskId;
  }
  if (task.timePeriod !== undefined) {
    dbTask.time_period = task.timePeriod;
  }
  if (task.timeLeft !== undefined) {
    dbTask.time_left = task.timeLeft;
  }
  if (task.lastCompleted) {
    dbTask.last_completed = task.lastCompleted;
  }
  if (task.completionHistory) {
    dbTask.completion_history = task.completionHistory;
  }

  return dbTask;
};

// Convert database format to Task
const dbToTask = (dbTask: Record<string, unknown>): Task => {
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
    completionHistory: dbTask.completion_history as Record<string, boolean> | undefined,
    createdAt: dbTask.created_at as string,
  };
};

export const postgrestStorage = {
  /**
   * Fetch all tasks from PostgREST
   */
  getTasks: async (): Promise<Task[]> => {
    const { apiUrl, apiKey } = getPostgrestConfig();

    const response = await fetch(`${apiUrl}/rest/v1/tasks?select=*`, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch tasks: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.map(dbToTask);
  },

  /**
   * Create a new task in PostgREST
   */
  addTask: async (task: Task): Promise<Task> => {
    const { apiUrl, apiKey } = getPostgrestConfig();
    const dbTask = taskToDb(task);

    const response = await fetch(`${apiUrl}/rest/v1/tasks`, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(dbTask),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${response.status} ${error}`);
    }

    const data = await response.json();
    return dbToTask(data[0]);
  },

  /**
   * Update a task in PostgREST
   */
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const { apiUrl, apiKey } = getPostgrestConfig();
    const dbUpdates = taskToDb(updates);

    const response = await fetch(`${apiUrl}/rest/v1/tasks?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(dbUpdates),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update task: ${response.status} ${error}`);
    }

    const data = await response.json();
    return dbToTask(data[0]);
  },

  /**
   * Delete a task in PostgREST
   */
  deleteTask: async (id: string): Promise<void> => {
    const { apiUrl, apiKey } = getPostgrestConfig();

    const response = await fetch(`${apiUrl}/rest/v1/tasks?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete task: ${response.status} ${error}`);
    }
  },

  /**
   * Bulk update task orders (for drag-and-drop reordering)
   */
  reorderTasks: async (tasks: Task[]): Promise<void> => {
    const { apiUrl, apiKey } = getPostgrestConfig();

    // PostgREST doesn't have a built-in bulk update, so we'll do individual updates
    // For better performance, you could create a custom PostgreSQL function
    const updatePromises = tasks.map((task) =>
      fetch(`${apiUrl}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: task.order }),
      })
    );

    const responses = await Promise.all(updatePromises);
    const failed = responses.filter((r) => !r.ok);

    if (failed.length > 0) {
      throw new Error(`Failed to reorder ${failed.length} tasks`);
    }
  },
};

import { Project, ProjectTag, Tag, Task, TaskTag } from "./types";

const API_BASE = "/api";

export const dbStorage = {
  getTasks: async (): Promise<Task[]> => {
    const response = await fetch(`${API_BASE}/tasks`);
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  saveTasks: async (tasks: Task[]): Promise<void> => {
    // Note: This is not used in remote mode - tasks are saved individually
    throw new Error("Use addTask, updateTask, deleteTask instead");
  },

  addTask: async (task: Task): Promise<Task> => {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update task");
    return response.json();
  },

  deleteTask: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete task");
  },

  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    // Note: This is not used in remote mode - projects are saved individually
    throw new Error("Use addProject, updateProject, deleteProject instead");
  },

  addProject: async (project: Project): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error("Failed to create project");
    return response.json();
  },

  updateProject: async (
    id: string,
    updates: Partial<Project>,
  ): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update project");
    return response.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete project");
  },

  reorderTasks: async (tasks: Task[]): Promise<void> => {
    const response = await fetch(`${API_BASE}/tasks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    if (!response.ok) throw new Error("Failed to reorder tasks");
  },

  reorderProjects: async (projects: Project[]): Promise<void> => {
    const response = await fetch(`${API_BASE}/projects/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projects }),
    });
    if (!response.ok) throw new Error("Failed to reorder projects");
  },

  // Tag operations
  getTags: async (): Promise<Tag[]> => {
    const response = await fetch(`${API_BASE}/tags`);
    if (!response.ok) throw new Error("Failed to fetch tags");
    return response.json();
  },

  addTag: async (tag: Tag): Promise<Tag> => {
    const response = await fetch(`${API_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error("Failed to create tag");
    return response.json();
  },

  updateTag: async (id: string, updates: Partial<Tag>): Promise<Tag> => {
    const response = await fetch(`${API_BASE}/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update tag");
    return response.json();
  },

  deleteTag: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/tags/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete tag");
  },

  // Tag relationship operations
  getTaskTags: async (): Promise<TaskTag[]> => {
    const response = await fetch(`${API_BASE}/task-tags`);
    if (!response.ok) throw new Error("Failed to fetch task tags");
    return response.json();
  },

  addTagToTask: async (taskId: string, tagId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    if (!response.ok) throw new Error("Failed to add tag to task");
  },

  removeTagFromTask: async (taskId: string, tagId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/tags/${tagId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove tag from task");
  },

  getProjectTags: async (): Promise<ProjectTag[]> => {
    const response = await fetch(`${API_BASE}/project-tags`);
    if (!response.ok) throw new Error("Failed to fetch project tags");
    return response.json();
  },

  addTagToProject: async (projectId: string, tagId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    if (!response.ok) throw new Error("Failed to add tag to project");
  },

  removeTagFromProject: async (
    projectId: string,
    tagId: string,
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE}/projects/${projectId}/tags/${tagId}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) throw new Error("Failed to remove tag from project");
  },
};

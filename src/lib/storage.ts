import { env } from "@/env.mjs";

import { dbStorage } from "./db-storage";
import { postgrestStorage } from "./postgrest-storage";
import { Project, ProjectTag, Tag, Task, TaskTag, TodayTask } from "./types";

const TASKS_KEY = "tasks";
const PROJECTS_KEY = "projects";
const TODAY_KEY = "today";
const TAGS_KEY = "tags";
const TASK_TAGS_KEY = "task_tags";
const PROJECT_TAGS_KEY = "project_tags";

const isRemoteStorage = () => {
  return (
    typeof window !== "undefined" && env.NEXT_PUBLIC_STORAGE_TYPE === "remote"
  );
};

// Local storage implementation
const localStorageAdapter = {
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return [];
    const tasks = window.localStorage.getItem(TASKS_KEY);
    return tasks ? JSON.parse(tasks) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  getProjects: (): Project[] => {
    if (typeof window === "undefined") return [];
    const projects = window.localStorage.getItem(PROJECTS_KEY);
    return projects ? JSON.parse(projects) : [];
  },

  saveProjects: (projects: Project[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  getTodayTasks: (): TodayTask[] => {
    if (typeof window === "undefined") return [];
    const today = window.localStorage.getItem(TODAY_KEY);
    return today ? JSON.parse(today) : [];
  },

  saveTodayTasks: (todayTasks: TodayTask[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TODAY_KEY, JSON.stringify(todayTasks));
  },

  getTags: (): Tag[] => {
    if (typeof window === "undefined") return [];
    const tags = window.localStorage.getItem(TAGS_KEY);
    return tags ? JSON.parse(tags) : [];
  },

  saveTags: (tags: Tag[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  },

  getTaskTags: (): TaskTag[] => {
    if (typeof window === "undefined") return [];
    const taskTags = window.localStorage.getItem(TASK_TAGS_KEY);
    return taskTags ? JSON.parse(taskTags) : [];
  },

  saveTaskTags: (taskTags: TaskTag[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TASK_TAGS_KEY, JSON.stringify(taskTags));
  },

  getProjectTags: (): ProjectTag[] => {
    if (typeof window === "undefined") return [];
    const projectTags = window.localStorage.getItem(PROJECT_TAGS_KEY);
    return projectTags ? JSON.parse(projectTags) : [];
  },

  saveProjectTags: (projectTags: ProjectTag[]): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECT_TAGS_KEY, JSON.stringify(projectTags));
  },
};

// Unified storage interface that switches between local and remote
export const storage = {
  getTasks: async (): Promise<Task[]> => {
    if (isRemoteStorage()) {
      return postgrestStorage.getTasks();
    }
    return localStorageAdapter.getTasks();
  },

  saveTasks: async (tasks: Task[]): Promise<void> => {
    if (isRemoteStorage()) {
      // In remote mode, tasks should be saved individually via API
      // This method is kept for compatibility but shouldn't be used
      console.warn(
        "saveTasks is not recommended in remote mode. Use individual task operations.",
      );
      return;
    }
    localStorageAdapter.saveTasks(tasks);
  },

  addTask: async (task: Task): Promise<Task> => {
    if (isRemoteStorage()) {
      return postgrestStorage.addTask(task);
    }
    // For local mode, just return the task (handled by saveTasks)
    return task;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task | undefined> => {
    if (isRemoteStorage()) {
      return postgrestStorage.updateTask(id, updates);
    }
    // For local mode, return undefined (handled by saveTasks)
    return undefined;
  },

  deleteTask: async (id: string): Promise<void> => {
    if (isRemoteStorage()) {
      return postgrestStorage.deleteTask(id);
    }
    // For local mode, nothing to do (handled by saveTasks)
  },

  reorderTasks: async (tasks: Task[]): Promise<void> => {
    if (isRemoteStorage()) {
      return postgrestStorage.reorderTasks(tasks);
    }
    // For local mode, nothing to do (handled by saveTasks)
  },

  getProjects: async (): Promise<Project[]> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.getProjects();
      } catch (error) {
        console.warn("Projects endpoint not available, returning empty array");
        return [];
      }
    }
    return localStorageAdapter.getProjects();
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    if (isRemoteStorage()) {
      // In remote mode, projects should be saved individually via API
      // This method is kept for compatibility but shouldn't be used
      console.warn(
        "saveProjects is not recommended in remote mode. Use individual project operations.",
      );
      return;
    }
    localStorageAdapter.saveProjects(projects);
  },

  getTodayTasks: async (): Promise<TodayTask[]> => {
    if (isRemoteStorage()) {
      // For remote mode, this would need an API endpoint
      // Returning empty array for now
      return [];
    }
    return localStorageAdapter.getTodayTasks();
  },

  saveTodayTasks: async (todayTasks: TodayTask[]): Promise<void> => {
    if (isRemoteStorage()) {
      // For remote mode, this would need an API endpoint
      console.warn("saveTodayTasks not implemented for remote mode");
      return;
    }
    localStorageAdapter.saveTodayTasks(todayTasks);
  },

  getTags: async (): Promise<Tag[]> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.getTags();
      } catch (error) {
        console.warn("Tags endpoint not available, returning empty array");
        return [];
      }
    }
    return localStorageAdapter.getTags();
  },

  saveTags: async (tags: Tag[]): Promise<void> => {
    if (isRemoteStorage()) {
      console.warn("saveTags not recommended in remote mode");
      return;
    }
    localStorageAdapter.saveTags(tags);
  },

  getTaskTags: async (): Promise<TaskTag[]> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.getTaskTags();
      } catch (error) {
        console.warn("Task tags endpoint not available, returning empty array");
        return [];
      }
    }
    return localStorageAdapter.getTaskTags();
  },

  saveTaskTags: async (taskTags: TaskTag[]): Promise<void> => {
    if (isRemoteStorage()) {
      console.warn("saveTaskTags not recommended in remote mode");
      return;
    }
    localStorageAdapter.saveTaskTags(taskTags);
  },

  getProjectTags: async (): Promise<ProjectTag[]> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.getProjectTags();
      } catch (error) {
        console.warn("Project tags endpoint not available, returning empty array");
        return [];
      }
    }
    return localStorageAdapter.getProjectTags();
  },

  saveProjectTags: async (projectTags: ProjectTag[]): Promise<void> => {
    if (isRemoteStorage()) {
      console.warn("saveProjectTags not recommended in remote mode");
      return;
    }
    localStorageAdapter.saveProjectTags(projectTags);
  },

  // Tag relationship helpers
  addTagToTask: async (taskId: string, tagId: string): Promise<void> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.addTagToTask(taskId, tagId);
      } catch (error) {
        console.warn("addTagToTask endpoint not available, skipping");
        return;
      }
    }
    const taskTags = localStorageAdapter.getTaskTags();
    const exists = taskTags.some(
      (tt) => tt.taskId === taskId && tt.tagId === tagId,
    );
    if (!exists) {
      taskTags.push({ taskId, tagId, createdAt: new Date().toISOString() });
      localStorageAdapter.saveTaskTags(taskTags);
    }
  },

  removeTagFromTask: async (taskId: string, tagId: string): Promise<void> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.removeTagFromTask(taskId, tagId);
      } catch (error) {
        console.warn("removeTagFromTask endpoint not available, skipping");
        return;
      }
    }
    const taskTags = localStorageAdapter.getTaskTags();
    const filtered = taskTags.filter(
      (tt) => !(tt.taskId === taskId && tt.tagId === tagId),
    );
    localStorageAdapter.saveTaskTags(filtered);
  },

  addTagToProject: async (projectId: string, tagId: string): Promise<void> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.addTagToProject(projectId, tagId);
      } catch (error) {
        console.warn("addTagToProject endpoint not available, skipping");
        return;
      }
    }
    const projectTags = localStorageAdapter.getProjectTags();
    const exists = projectTags.some(
      (pt) => pt.projectId === projectId && pt.tagId === tagId,
    );
    if (!exists) {
      projectTags.push({
        projectId,
        tagId,
        createdAt: new Date().toISOString(),
      });
      localStorageAdapter.saveProjectTags(projectTags);
    }
  },

  removeTagFromProject: async (
    projectId: string,
    tagId: string,
  ): Promise<void> => {
    if (isRemoteStorage()) {
      try {
        return await dbStorage.removeTagFromProject(projectId, tagId);
      } catch (error) {
        console.warn("removeTagFromProject endpoint not available, skipping");
        return;
      }
    }
    const projectTags = localStorageAdapter.getProjectTags();
    const filtered = projectTags.filter(
      (pt) => !(pt.projectId === projectId && pt.tagId === tagId),
    );
    localStorageAdapter.saveProjectTags(filtered);
  },
};

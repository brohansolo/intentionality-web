import { env } from "@/env.mjs";

import { dbStorage } from "./db-storage";
import { Project, Tag, Task, TodayTask } from "./types";

const TASKS_KEY = "tasks";
const PROJECTS_KEY = "projects";
const TODAY_KEY = "today";
const TAGS_KEY = "tags";

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
};

// Unified storage interface that switches between local and remote
export const storage = {
  getTasks: async (): Promise<Task[]> => {
    if (isRemoteStorage()) {
      return dbStorage.getTasks();
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

  getProjects: async (): Promise<Project[]> => {
    if (isRemoteStorage()) {
      return dbStorage.getProjects();
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
      console.warn("getTodayTasks not implemented for remote mode");
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
      // For remote mode, this would need an API endpoint
      console.warn("getTags not implemented for remote mode");
      return [];
    }
    return localStorageAdapter.getTags();
  },

  saveTags: async (tags: Tag[]): Promise<void> => {
    if (isRemoteStorage()) {
      console.warn("saveTags not implemented for remote mode");
      return;
    }
    localStorageAdapter.saveTags(tags);
  },
};

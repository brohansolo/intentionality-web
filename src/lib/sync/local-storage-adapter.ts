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
 * localStorage key constants
 */
const TASKS_KEY = "tasks";
const PROJECTS_KEY = "projects";
const TODAY_KEY = "today";
const TAGS_KEY = "tags";
const TASK_TAGS_KEY = "task_tags";
const PROJECT_TAGS_KEY = "project_tags";

/**
 * LocalStorageAdapter implements the IStorageAdapter interface using browser localStorage.
 * All operations are synchronous but wrapped in Promises for API consistency.
 * Handles SSR gracefully by returning empty arrays when window is undefined.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Helper method to read data from localStorage
   */
  private readFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Helper method to write data to localStorage
   */
  private writeToStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }

  // ========== Task Methods ==========

  async getTasks(): Promise<Task[]> {
    return this.readFromStorage<Task[]>(TASKS_KEY, []);
  }

  async addTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    tasks.push(task);
    this.writeToStorage(TASKS_KEY, tasks);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.writeToStorage(TASKS_KEY, tasks);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    this.writeToStorage(TASKS_KEY, filtered);
  }

  async reorderTasks(reorderedTasks: Task[]): Promise<void> {
    const allTasks = await this.getTasks();
    // Create a map of reordered tasks for quick lookup
    const reorderedMap = new Map(reorderedTasks.map((t) => [t.id, t]));

    // Update order for tasks that were reordered
    const updatedTasks = allTasks.map((task) => {
      const reordered = reorderedMap.get(task.id);
      return reordered ? { ...task, order: reordered.order } : task;
    });

    this.writeToStorage(TASKS_KEY, updatedTasks);
  }

  // ========== Project Methods ==========

  async getProjects(): Promise<Project[]> {
    return this.readFromStorage<Project[]>(PROJECTS_KEY, []);
  }

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    projects.push(project);
    this.writeToStorage(PROJECTS_KEY, projects);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      this.writeToStorage(PROJECTS_KEY, projects);
    }
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    this.writeToStorage(PROJECTS_KEY, filtered);
  }

  async reorderProjects(reorderedProjects: Project[]): Promise<void> {
    const allProjects = await this.getProjects();
    const reorderedMap = new Map(reorderedProjects.map((p) => [p.id, p]));

    const updatedProjects = allProjects.map((project) => {
      const reordered = reorderedMap.get(project.id);
      return reordered ? { ...project, order: reordered.order } : project;
    });

    this.writeToStorage(PROJECTS_KEY, updatedProjects);
  }

  // ========== Tag Methods ==========

  async getTags(): Promise<Tag[]> {
    return this.readFromStorage<Tag[]>(TAGS_KEY, []);
  }

  async addTag(tag: Tag): Promise<void> {
    const tags = await this.getTags();
    tags.push(tag);
    this.writeToStorage(TAGS_KEY, tags);
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<void> {
    const tags = await this.getTags();
    const index = tags.findIndex((t) => t.id === id);
    if (index !== -1) {
      tags[index] = { ...tags[index], ...updates };
      this.writeToStorage(TAGS_KEY, tags);
    }
  }

  async deleteTag(id: string): Promise<void> {
    const tags = await this.getTags();
    const filtered = tags.filter((t) => t.id !== id);
    this.writeToStorage(TAGS_KEY, filtered);
  }

  // ========== TaskTag Relationship Methods ==========

  async getTaskTags(): Promise<TaskTag[]> {
    return this.readFromStorage<TaskTag[]>(TASK_TAGS_KEY, []);
  }

  async addTaskTag(taskId: string, tagId: string): Promise<void> {
    const taskTags = await this.getTaskTags();

    // Check for existing relationship
    const exists = taskTags.some(
      (tt) => tt.taskId === taskId && tt.tagId === tagId,
    );

    if (!exists) {
      taskTags.push({
        taskId,
        tagId,
        createdAt: new Date().toISOString(),
      });
      this.writeToStorage(TASK_TAGS_KEY, taskTags);
    }
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    const taskTags = await this.getTaskTags();
    const filtered = taskTags.filter(
      (tt) => !(tt.taskId === taskId && tt.tagId === tagId),
    );
    this.writeToStorage(TASK_TAGS_KEY, filtered);
  }

  // ========== ProjectTag Relationship Methods ==========

  async getProjectTags(): Promise<ProjectTag[]> {
    return this.readFromStorage<ProjectTag[]>(PROJECT_TAGS_KEY, []);
  }

  async addProjectTag(projectId: string, tagId: string): Promise<void> {
    const projectTags = await this.getProjectTags();

    // Check for existing relationship
    const exists = projectTags.some(
      (pt) => pt.projectId === projectId && pt.tagId === tagId,
    );

    if (!exists) {
      projectTags.push({
        projectId,
        tagId,
        createdAt: new Date().toISOString(),
      });
      this.writeToStorage(PROJECT_TAGS_KEY, projectTags);
    }
  }

  async removeProjectTag(projectId: string, tagId: string): Promise<void> {
    const projectTags = await this.getProjectTags();
    const filtered = projectTags.filter(
      (pt) => !(pt.projectId === projectId && pt.tagId === tagId),
    );
    this.writeToStorage(PROJECT_TAGS_KEY, filtered);
  }

  // ========== TodayTask Methods ==========

  async getTodayTasks(): Promise<TodayTask[]> {
    return this.readFromStorage<TodayTask[]>(TODAY_KEY, []);
  }

  async saveTodayTasks(todayTasks: TodayTask[]): Promise<void> {
    console.log("[LocalStorageAdapter] Saving today tasks:", todayTasks);
    this.writeToStorage(TODAY_KEY, todayTasks);
    console.log(
      "[LocalStorageAdapter] Saved to localStorage, key:",
      TODAY_KEY,
      "value:",
      window.localStorage.getItem(TODAY_KEY),
    );
  }
}

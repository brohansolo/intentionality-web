"use client";

import { useEffect, useMemo, useRef } from "react";

import { env } from "@/env.mjs";
import { RemoteStorageAdapter } from "@/lib/sync/remote-storage-adapter";
import { StorageManager } from "@/lib/sync/storage-manager";
import {
  Project,
  ProjectTag,
  Tag,
  Task,
  TaskTag,
  TodayTask,
} from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addProject as addProjectAction,
  deleteProject as deleteProjectAction,
  reorderProjects as reorderProjectsAction,
  setProjects,
  updateProject as updateProjectAction,
} from "@/store/slices/projectsSlice";
import {
  addProjectTag,
  removeProjectTag,
  removeProjectTagsByProject,
  removeProjectTagsByTag,
  setProjectTags,
} from "@/store/slices/projectTagsSlice";
import {
  addTag as addTagAction,
  deleteTag as deleteTagAction,
  setTags,
  updateTag as updateTagAction,
} from "@/store/slices/tagsSlice";
import {
  addTask as addTaskAction,
  deleteTask as deleteTaskAction,
  deleteTasksByProject,
  reorderTasks as reorderTasksAction,
  setTasks,
  updateTask as updateTaskAction,
} from "@/store/slices/tasksSlice";
import {
  addTaskTag,
  removeTaskTag,
  removeTaskTagsByTag,
  removeTaskTagsByTask,
  setTaskTags,
} from "@/store/slices/taskTagsSlice";
import {
  addToToday as addToTodayAction,
  clearToday as clearTodayAction,
  removeFromToday as removeFromTodayAction,
  reorderTodayTasks as reorderTodayTasksAction,
  setTodayTasks,
} from "@/store/slices/todayTasksSlice";

export const useTasks = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const projects = useAppSelector((state) => state.projects.items);
  const todayTasks = useAppSelector((state) => state.todayTasks.items);
  const tags = useAppSelector((state) => state.tags.items);
  const taskTags = useAppSelector((state) => state.taskTags.items);
  const projectTags = useAppSelector((state) => state.projectTags.items);

  // Initialize StorageManager
  const storageManagerRef = useRef<StorageManager | null>(null);

  if (!storageManagerRef.current) {
    const enableRemoteSync = env.NEXT_PUBLIC_STORAGE_TYPE === "remote";
    const remoteAdapter = enableRemoteSync
      ? new RemoteStorageAdapter()
      : undefined;
    const syncIntervalMs = env.NEXT_PUBLIC_SYNC_INTERVAL_MS;

    storageManagerRef.current = new StorageManager(
      enableRemoteSync,
      remoteAdapter,
      syncIntervalMs,
    );
  }

  const storageManager = storageManagerRef.current;

  useEffect(() => {
    const loadData = async () => {
      const [
        loadedTasks,
        loadedProjects,
        loadedTodayTasks,
        loadedTags,
        loadedTaskTags,
        loadedProjectTags,
      ] = await Promise.all([
        storageManager.getTasks(),
        storageManager.getProjects(),
        storageManager.getTodayTasks(),
        storageManager.getTags(),
        storageManager.getTaskTags(),
        storageManager.getProjectTags(),
      ]);
      dispatch(setTasks(loadedTasks));
      dispatch(setProjects(loadedProjects));
      dispatch(setTodayTasks(loadedTodayTasks));
      dispatch(setTags(loadedTags));
      dispatch(setTaskTags(loadedTaskTags));
      dispatch(setProjectTags(loadedProjectTags));
    };

    loadData();

    // Sync state across tabs (localStorage events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tasks" && e.newValue) {
        dispatch(setTasks(JSON.parse(e.newValue)));
      } else if (e.key === "projects" && e.newValue) {
        dispatch(setProjects(JSON.parse(e.newValue)));
      } else if (e.key === "today" && e.newValue) {
        dispatch(setTodayTasks(JSON.parse(e.newValue)));
      } else if (e.key === "tags" && e.newValue) {
        dispatch(setTags(JSON.parse(e.newValue)));
      } else if (e.key === "task_tags" && e.newValue) {
        dispatch(setTaskTags(JSON.parse(e.newValue)));
      } else if (e.key === "project_tags" && e.newValue) {
        dispatch(setProjectTags(JSON.parse(e.newValue)));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, storageManager]);

  const addTask = async (
    title: string,
    projectId?: string,
    dueDate?: string,
    isDaily: boolean = false,
    timePeriod?: number,
    description?: string,
    tagIds?: string[],
    providedId?: string,
  ) => {
    const maxOrder =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.order || 0)) : 0;
    const newTask: Task = {
      id: providedId || crypto.randomUUID(),
      title,
      description,
      completed: false,
      dueDate,
      projectId,
      order: maxOrder + 1,
      isDaily,
      timePeriod,
      createdAt: new Date().toISOString(),
    };
    console.log("Adding task:", newTask);
    console.log("Current tasks:", tasks);
    dispatch(addTaskAction(newTask));
    await storageManager.addTask(newTask);

    // Add tag relationships if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await storageManager.addTaskTag(newTask.id, tagId);
        dispatch(
          addTaskTag({
            taskId: newTask.id,
            tagId,
            createdAt: new Date().toISOString(),
          }),
        );
      }
    }

    return newTask.id;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    dispatch(updateTaskAction({ id, updates }));
    await storageManager.updateTask(id, updates);
  };

  const deleteTask = async (id: string) => {
    dispatch(deleteTaskAction(id));
    dispatch(removeTaskTagsByTask(id));
    await storageManager.deleteTask(id);
  };

  const toTitleCase = (str: string): string => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const addProject = async (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: toTitleCase(name),
      description: undefined,
      completed: false,
      order: Math.max(...projects.map((p) => p.order), 0) + 1,
      createdAt: new Date().toISOString(),
    };
    dispatch(addProjectAction(newProject));
    await storageManager.addProject(newProject);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const processedUpdates = { ...updates };
    if (updates.name !== undefined) {
      processedUpdates.name = toTitleCase(updates.name);
    }
    dispatch(updateProjectAction({ id, updates: processedUpdates }));
    await storageManager.updateProject(id, processedUpdates);
  };

  const deleteProject = async (id: string) => {
    // Delete all tasks in this project
    const projectTasks = tasks.filter((task) => task.projectId === id);
    for (const task of projectTasks) {
      await storageManager.deleteTask(task.id);
    }

    dispatch(deleteTasksByProject(id));
    dispatch(deleteProjectAction(id));
    dispatch(removeProjectTagsByProject(id));
    await storageManager.deleteProject(id);
  };

  const reorderTasks = async (projectTasks: Task[]) => {
    const otherTasks = tasks.filter(
      (task) => !projectTasks.some((pt) => pt.id === task.id),
    );
    const reorderedTasks = projectTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    dispatch(reorderTasksAction([...otherTasks, ...reorderedTasks]));
    await storageManager.reorderTasks(reorderedTasks);
  };

  const getInboxTasks = () =>
    tasks.filter((task) => !task.projectId && !task.isDaily);

  const reorderProjects = async (reorderedProjects: Project[]) => {
    const reorderedWithOrder = reorderedProjects.map((project, index) => ({
      ...project,
      order: index,
    }));
    dispatch(reorderProjectsAction(reorderedWithOrder));
    await storageManager.reorderProjects(reorderedWithOrder);
  };

  const getProjectTasks = (projectId: string) =>
    tasks
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => a.order - b.order);

  const getOrderedProjects = () =>
    [...projects].sort((a, b) => a.order - b.order);

  const getActiveProjects = () =>
    projects.filter((p) => !p.completed).sort((a, b) => a.order - b.order);

  const getDailyTasks = () => {
    return tasks.filter((task) => task.isDaily);
  };

  const markDailyTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().split("T")[0];
    const updatedHistory = {
      ...(task.completionHistory || {}),
      [today]: true,
    };

    // For daily tasks, don't mark as completed (keep them active)
    // Just update the completion history
    updateTask(id, {
      lastCompleted: new Date().toISOString(),
      completionHistory: updatedHistory,
    });
  };

  const markDailyTaskIncomplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().split("T")[0];
    const updatedHistory = { ...(task.completionHistory || {}) };
    delete updatedHistory[today];

    // Remove today from completion history
    updateTask(id, {
      completionHistory: updatedHistory,
    });
  };

  const addToToday = async (taskId: string) => {
    const maxOrder =
      todayTasks.length > 0 ? Math.max(...todayTasks.map((t) => t.order)) : -1;

    const newTodayTask: TodayTask = {
      taskId,
      order: maxOrder + 1,
    };

    dispatch(addToTodayAction(newTodayTask));
    await storageManager.saveTodayTasks([...todayTasks, newTodayTask]);
  };

  const removeFromToday = async (taskId: string) => {
    dispatch(removeFromTodayAction(taskId));
    await storageManager.saveTodayTasks(
      todayTasks.filter((t) => t.taskId !== taskId),
    );
  };

  const reorderTodayTasks = async (reorderedTasks: TodayTask[]) => {
    const reorderedWithOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    dispatch(reorderTodayTasksAction(reorderedWithOrder));
    await storageManager.saveTodayTasks(reorderedWithOrder);
  };

  const getTodayTasksList = () => {
    return [...todayTasks]
      .sort((a, b) => a.order - b.order)
      .map((tt) => tasks.find((t) => t.id === tt.taskId))
      .filter((t): t is Task => t !== undefined);
  };

  const isInToday = (taskId: string) => {
    return todayTasks.some((tt) => tt.taskId === taskId);
  };

  const clearToday = async () => {
    dispatch(clearTodayAction());
    await storageManager.saveTodayTasks([]);
  };

  const addTag = async (name: string, color?: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    dispatch(addTagAction(newTag));
    await storageManager.addTag(newTag);
    return newTag;
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    dispatch(updateTagAction({ id, updates }));
    await storageManager.updateTag(id, updates);
  };

  const deleteTag = async (id: string) => {
    dispatch(deleteTagAction(id));
    dispatch(removeTaskTagsByTag(id));
    dispatch(removeProjectTagsByTag(id));
    await storageManager.deleteTag(id);
  };

  const getOrCreateTag = async (name: string, color?: string) => {
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingTag) {
      return existingTag;
    }
    return await addTag(name, color);
  };

  // Tag relationship helpers
  const getTaskTags = (taskId: string): string[] => {
    return taskTags.filter((tt) => tt.taskId === taskId).map((tt) => tt.tagId);
  };

  const getProjectTags = (projectId: string): string[] => {
    return projectTags
      .filter((pt) => pt.projectId === projectId)
      .map((pt) => pt.tagId);
  };

  const addTagToTask = async (taskId: string, tagId: string) => {
    await storageManager.addTaskTag(taskId, tagId);
    dispatch(
      addTaskTag({ taskId, tagId, createdAt: new Date().toISOString() }),
    );
  };

  const removeTagFromTask = async (taskId: string, tagId: string) => {
    await storageManager.removeTaskTag(taskId, tagId);
    dispatch(removeTaskTag({ taskId, tagId }));
  };

  const addTagToProject = async (projectId: string, tagId: string) => {
    await storageManager.addProjectTag(projectId, tagId);
    dispatch(
      addProjectTag({
        projectId,
        tagId,
        createdAt: new Date().toISOString(),
      }),
    );
  };

  const removeTagFromProject = async (projectId: string, tagId: string) => {
    await storageManager.removeProjectTag(projectId, tagId);
    dispatch(removeProjectTag({ projectId, tagId }));
  };

  // Sync control methods
  const syncNow = async () => {
    await storageManager.syncNow();
  };

  const getSyncStatus = () => {
    return storageManager.getSyncStatus();
  };

  const retryFailedSync = () => {
    storageManager.retryFailed();
  };

  const clearSyncQueue = () => {
    storageManager.clearQueue();
  };

  return {
    tasks,
    projects: getOrderedProjects(),
    tags,
    taskTags,
    projectTags,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    reorderTasks,
    reorderProjects,
    getInboxTasks,
    getProjectTasks,
    getActiveProjects,
    getDailyTasks,
    markDailyTaskComplete,
    markDailyTaskIncomplete,
    addToToday,
    removeFromToday,
    reorderTodayTasks,
    getTodayTasksList,
    isInToday,
    todayTasks,
    clearToday,
    addTag,
    updateTag,
    deleteTag,
    getOrCreateTag,
    getTaskTags,
    getProjectTags,
    addTagToTask,
    removeTagFromTask,
    addTagToProject,
    removeTagFromProject,
    // Sync control methods
    syncNow,
    getSyncStatus,
    retryFailedSync,
    clearSyncQueue,
  };
};

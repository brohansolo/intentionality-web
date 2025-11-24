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

// Global flag to track if initial data load has been done
// This ensures we only do the initial sync once across all hook instances
let hasGloballyInitialized = false;

export const useTasks = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const projects = useAppSelector((state) => state.projects.items);
  const todayTasks = useAppSelector((state) => state.todayTasks.items);
  const tags = useAppSelector((state) => state.tags.items);
  const taskTags = useAppSelector((state) => state.taskTags.items);
  const projectTags = useAppSelector((state) => state.projectTags.items);

  // Track if THIS hook instance has initialized
  const hasInitializedRef = useRef(false);

  // Helper to get the global singleton storage manager
  const getStorageManager = () => {
    const enableRemoteSync = env.NEXT_PUBLIC_STORAGE_TYPE === "remote";
    const remoteAdapter = enableRemoteSync
      ? new RemoteStorageAdapter()
      : undefined;
    const syncIntervalMs = env.NEXT_PUBLIC_SYNC_INTERVAL_MS;

    return StorageManager.getInstance(
      enableRemoteSync,
      remoteAdapter,
      syncIntervalMs,
    );
  };

  useEffect(() => {
    // Prevent re-initialization if this hook instance already initialized
    if (hasInitializedRef.current) {
      console.log(
        "[useTasks] Skipping re-initialization, hook already initialized",
      );
      return;
    }

    hasInitializedRef.current = true;

    // If already globally initialized, just load from localStorage
    if (hasGloballyInitialized) {
      console.log(
        "[useTasks] Already globally initialized, loading from localStorage only",
      );
      const loadLocalData = async () => {
        const [
          loadedTasks,
          loadedProjects,
          loadedTodayTasks,
          loadedTags,
          loadedTaskTags,
          loadedProjectTags,
        ] = await Promise.all([
          getStorageManager().getTasks(),
          getStorageManager().getProjects(),
          getStorageManager().getTodayTasks(),
          getStorageManager().getTags(),
          getStorageManager().getTaskTags(),
          getStorageManager().getProjectTags(),
        ]);
        dispatch(setTasks(loadedTasks));
        dispatch(setProjects(loadedProjects));
        dispatch(setTodayTasks(loadedTodayTasks));
        dispatch(setTags(loadedTags));
        dispatch(setTaskTags(loadedTaskTags));
        dispatch(setProjectTags(loadedProjectTags));
      };
      loadLocalData();
      return;
    }

    // Mark as globally initialized before starting
    hasGloballyInitialized = true;
    const storageManager = getStorageManager();

    const loadData = async () => {
      console.log("[useTasks] Starting initial data load (FIRST TIME ONLY)...");

      // Step 1: Load data from localStorage immediately for instant UI
      const [
        loadedTasks,
        loadedProjects,
        loadedTodayTasks,
        loadedTags,
        loadedTaskTags,
        loadedProjectTags,
      ] = await Promise.all([
        getStorageManager().getTasks(),
        getStorageManager().getProjects(),
        getStorageManager().getTodayTasks(),
        getStorageManager().getTags(),
        getStorageManager().getTaskTags(),
        getStorageManager().getProjectTags(),
      ]);
      dispatch(setTasks(loadedTasks));
      dispatch(setProjects(loadedProjects));
      dispatch(setTodayTasks(loadedTodayTasks));
      dispatch(setTags(loadedTags));
      dispatch(setTaskTags(loadedTaskTags));
      dispatch(setProjectTags(loadedProjectTags));

      // Step 2: Sync all queued local changes to remote FIRST
      // This ensures the remote has the most current state from local
      console.log("[useTasks] Syncing local changes to remote...");
      await storageManager.syncNow();

      // Step 3: Pull latest data from remote (which now includes our local changes)
      // This gets any changes made on other devices/tabs
      console.log("[useTasks] Pulling latest data from remote...");
      await storageManager.pullFromRemote();

      // Step 4: Reload from localStorage to get the merged state
      const [
        updatedTasks,
        updatedProjects,
        updatedTodayTasks,
        updatedTags,
        updatedTaskTags,
        updatedProjectTags,
      ] = await Promise.all([
        getStorageManager().getTasks(),
        getStorageManager().getProjects(),
        getStorageManager().getTodayTasks(),
        getStorageManager().getTags(),
        getStorageManager().getTaskTags(),
        getStorageManager().getProjectTags(),
      ]);
      dispatch(setTasks(updatedTasks));
      dispatch(setProjects(updatedProjects));
      dispatch(setTodayTasks(updatedTodayTasks));
      dispatch(setTags(updatedTags));
      dispatch(setTaskTags(updatedTaskTags));
      dispatch(setProjectTags(updatedProjectTags));

      console.log("[useTasks] Initial data load complete");
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
  }, [dispatch]);

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
    await getStorageManager().addTask(newTask);

    // Add tag relationships if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await getStorageManager().addTaskTag(newTask.id, tagId);
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
    await getStorageManager().updateTask(id, updates);
  };

  const deleteTask = async (id: string) => {
    dispatch(deleteTaskAction(id));
    dispatch(removeTaskTagsByTask(id));
    await getStorageManager().deleteTask(id);
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
    await getStorageManager().addProject(newProject);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const processedUpdates = { ...updates };
    if (updates.name !== undefined) {
      processedUpdates.name = toTitleCase(updates.name);
    }
    dispatch(updateProjectAction({ id, updates: processedUpdates }));
    await getStorageManager().updateProject(id, processedUpdates);
  };

  const deleteProject = async (id: string) => {
    // Delete all tasks in this project
    const projectTasks = tasks.filter((task) => task.projectId === id);
    for (const task of projectTasks) {
      await getStorageManager().deleteTask(task.id);
    }

    dispatch(deleteTasksByProject(id));
    dispatch(deleteProjectAction(id));
    dispatch(removeProjectTagsByProject(id));
    await getStorageManager().deleteProject(id);
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
    await getStorageManager().reorderTasks(reorderedTasks);
  };

  const getInboxTasks = () =>
    tasks.filter((task) => !task.projectId && !task.isDaily);

  const reorderProjects = async (reorderedProjects: Project[]) => {
    const reorderedWithOrder = reorderedProjects.map((project, index) => ({
      ...project,
      order: index,
    }));
    dispatch(reorderProjectsAction(reorderedWithOrder));
    await getStorageManager().reorderProjects(reorderedWithOrder);
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

    const updatedTodayTasks = [...todayTasks, newTodayTask];
    console.log("[addToToday] Adding task to today:", {
      taskId,
      order: maxOrder + 1,
      currentTodayTasks: todayTasks,
      updatedTodayTasks,
    });
    dispatch(addToTodayAction(newTodayTask));
    await getStorageManager().addToToday(
      taskId,
      maxOrder + 1,
      updatedTodayTasks,
    );
    console.log("[addToToday] Storage updated successfully");
  };

  const removeFromToday = async (taskId: string) => {
    const updatedTodayTasks = todayTasks.filter((t) => t.taskId !== taskId);
    dispatch(removeFromTodayAction(taskId));
    await getStorageManager().removeFromToday(taskId, updatedTodayTasks);
  };

  const reorderTodayTasks = async (reorderedTasks: TodayTask[]) => {
    const reorderedWithOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    dispatch(reorderTodayTasksAction(reorderedWithOrder));
    await getStorageManager().reorderTodayTasks(reorderedWithOrder);
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
    await getStorageManager().clearTodayTasks();
  };

  const addTag = async (name: string, color?: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    dispatch(addTagAction(newTag));
    await getStorageManager().addTag(newTag);
    return newTag;
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    dispatch(updateTagAction({ id, updates }));
    await getStorageManager().updateTag(id, updates);
  };

  const deleteTag = async (id: string) => {
    dispatch(deleteTagAction(id));
    dispatch(removeTaskTagsByTag(id));
    dispatch(removeProjectTagsByTag(id));
    await getStorageManager().deleteTag(id);
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
    await getStorageManager().addTaskTag(taskId, tagId);
    dispatch(
      addTaskTag({ taskId, tagId, createdAt: new Date().toISOString() }),
    );
  };

  const removeTagFromTask = async (taskId: string, tagId: string) => {
    await getStorageManager().removeTaskTag(taskId, tagId);
    dispatch(removeTaskTag({ taskId, tagId }));
  };

  const addTagToProject = async (projectId: string, tagId: string) => {
    await getStorageManager().addProjectTag(projectId, tagId);
    dispatch(
      addProjectTag({
        projectId,
        tagId,
        createdAt: new Date().toISOString(),
      }),
    );
  };

  const removeTagFromProject = async (projectId: string, tagId: string) => {
    await getStorageManager().removeProjectTag(projectId, tagId);
    dispatch(removeProjectTag({ projectId, tagId }));
  };

  // Sync control methods
  const syncNow = async () => {
    await getStorageManager().syncNow();
  };

  const getSyncStatus = () => {
    return getStorageManager().getSyncStatus();
  };

  const retryFailedSync = () => {
    getStorageManager().retryFailed();
  };

  const clearSyncQueue = () => {
    getStorageManager().clearQueue();
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

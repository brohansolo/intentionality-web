"use client";

import { useEffect } from "react";

import { storage } from "@/lib/storage";
import { Project, Tag, Task, TodayTask } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addProject as addProjectAction,
  deleteProject as deleteProjectAction,
  reorderProjects as reorderProjectsAction,
  setProjects,
  updateProject as updateProjectAction,
} from "@/store/slices/projectsSlice";
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

  useEffect(() => {
    const loadData = async () => {
      const [loadedTasks, loadedProjects, loadedTodayTasks, loadedTags] =
        await Promise.all([
          storage.getTasks(),
          storage.getProjects(),
          storage.getTodayTasks(),
          storage.getTags(),
        ]);
      dispatch(setTasks(loadedTasks));
      dispatch(setProjects(loadedProjects));
      dispatch(setTodayTasks(loadedTodayTasks));
      dispatch(setTags(loadedTags));
    };

    loadData();

    // Sync state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tasks" && e.newValue) {
        dispatch(setTasks(JSON.parse(e.newValue)));
      } else if (e.key === "projects" && e.newValue) {
        dispatch(setProjects(JSON.parse(e.newValue)));
      } else if (e.key === "today" && e.newValue) {
        dispatch(setTodayTasks(JSON.parse(e.newValue)));
      } else if (e.key === "tags" && e.newValue) {
        dispatch(setTags(JSON.parse(e.newValue)));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  const addTask = (
    title: string,
    projectId?: string,
    dueDate?: string,
    isDaily: boolean = false,
    timePeriod?: number,
    description?: string,
  ) => {
    const maxOrder =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.order || 0)) : 0;
    const newTask: Task = {
      id: crypto.randomUUID(),
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
    const updatedTasks = [...tasks, newTask];
    console.log("Updated tasks:", updatedTasks);
    storage.saveTasks(updatedTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch(updateTaskAction({ id, updates }));
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task,
    );
    storage.saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    dispatch(deleteTaskAction(id));
    storage.saveTasks(tasks.filter((task) => task.id !== id));
  };

  const toTitleCase = (str: string): string => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const addProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: toTitleCase(name),
      description: undefined,
      completed: false,
      order: Math.max(...projects.map((p) => p.order), 0) + 1,
      createdAt: new Date().toISOString(),
    };
    dispatch(addProjectAction(newProject));
    storage.saveProjects([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const processedUpdates = { ...updates };
    if (updates.name !== undefined) {
      processedUpdates.name = toTitleCase(updates.name);
    }
    dispatch(updateProjectAction({ id, updates: processedUpdates }));
    const updatedProjects = projects.map((project) =>
      project.id === id ? { ...project, ...processedUpdates } : project,
    );
    storage.saveProjects(updatedProjects);
  };

  const deleteProject = (id: string) => {
    dispatch(deleteTasksByProject(id));
    dispatch(deleteProjectAction(id));
    storage.saveTasks(tasks.filter((task) => task.projectId !== id));
    storage.saveProjects(projects.filter((project) => project.id !== id));
  };

  const reorderTasks = (projectTasks: Task[]) => {
    const otherTasks = tasks.filter(
      (task) => !projectTasks.some((pt) => pt.id === task.id),
    );
    const reorderedTasks = projectTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    dispatch(reorderTasksAction([...otherTasks, ...reorderedTasks]));
    storage.saveTasks([...otherTasks, ...reorderedTasks]);
  };

  const getInboxTasks = () =>
    tasks.filter((task) => !task.projectId && !task.isDaily);

  const reorderProjects = (reorderedProjects: Project[]) => {
    const reorderedWithOrder = reorderedProjects.map((project, index) => ({
      ...project,
      order: index,
    }));
    dispatch(reorderProjectsAction(reorderedWithOrder));
    storage.saveProjects(reorderedWithOrder);
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

  const addToToday = (taskId: string) => {
    const maxOrder =
      todayTasks.length > 0 ? Math.max(...todayTasks.map((t) => t.order)) : -1;

    const newTodayTask: TodayTask = {
      taskId,
      order: maxOrder + 1,
    };

    dispatch(addToTodayAction(newTodayTask));
    storage.saveTodayTasks([...todayTasks, newTodayTask]);
  };

  const removeFromToday = (taskId: string) => {
    dispatch(removeFromTodayAction(taskId));
    storage.saveTodayTasks(todayTasks.filter((t) => t.taskId !== taskId));
  };

  const reorderTodayTasks = (reorderedTasks: TodayTask[]) => {
    const reorderedWithOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    dispatch(reorderTodayTasksAction(reorderedWithOrder));
    storage.saveTodayTasks(reorderedWithOrder);
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

  const clearToday = () => {
    dispatch(clearTodayAction());
    storage.saveTodayTasks([]);
  };

  const addTag = (name: string, color?: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    dispatch(addTagAction(newTag));
    storage.saveTags([...tags, newTag]);
    return newTag;
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    dispatch(updateTagAction({ id, updates }));
    const updatedTags = tags.map((tag) =>
      tag.id === id ? { ...tag, ...updates } : tag,
    );
    storage.saveTags(updatedTags);
  };

  const deleteTag = (id: string) => {
    dispatch(deleteTagAction(id));
    storage.saveTags(tags.filter((tag) => tag.id !== id));

    // Remove tag from all tasks
    const updatedTasks = tasks.map((task) => ({
      ...task,
      tags: task.tags?.filter((tagId) => tagId !== id) || [],
    }));
    updatedTasks.forEach((task) => {
      dispatch(updateTaskAction({ id: task.id, updates: { tags: task.tags } }));
    });
    storage.saveTasks(updatedTasks);

    // Remove tag from all projects
    const updatedProjects = projects.map((project) => ({
      ...project,
      tags: project.tags?.filter((tagId) => tagId !== id) || [],
    }));
    updatedProjects.forEach((project) => {
      dispatch(
        updateProjectAction({
          id: project.id,
          updates: { tags: project.tags },
        }),
      );
    });
    storage.saveProjects(updatedProjects);
  };

  const getOrCreateTag = (name: string, color?: string) => {
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingTag) {
      return existingTag;
    }
    return addTag(name, color);
  };

  return {
    tasks,
    projects: getOrderedProjects(),
    tags,
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
  };
};

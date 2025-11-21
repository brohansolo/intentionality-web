"use client";

import { useEffect } from "react";

import { storage } from "@/lib/storage";
import { Task } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProjects } from "@/store/slices/projectsSlice";
import { setProjectTags } from "@/store/slices/projectTagsSlice";
import { setTags } from "@/store/slices/tagsSlice";
import {
  addTask as addTaskAction,
  deleteTask as deleteTaskAction,
  reorderTasks as reorderTasksAction,
  setTasks,
  updateTask as updateTaskAction,
} from "@/store/slices/tasksSlice";
import { setTaskTags } from "@/store/slices/taskTagsSlice";
import {
  addToToday as addToTodayAction,
  setTodayTasks,
} from "@/store/slices/todayTasksSlice";

/**
 * Remote storage version of useTasks hook
 * Uses PostgREST/Supabase for all task operations
 */
export const useTasksRemote = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items);
  const projects = useAppSelector((state) => state.projects.items);
  const todayTasks = useAppSelector((state) => state.todayTasks.items);
  const tags = useAppSelector((state) => state.tags.items);
  const taskTags = useAppSelector((state) => state.taskTags.items);
  const projectTags = useAppSelector((state) => state.projectTags.items);

  // Load data from remote storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tasks
        const loadedTasks = await storage.getTasks();
        dispatch(setTasks(loadedTasks));
      } catch (error) {
        console.error("Failed to load tasks:", error);
        dispatch(setTasks([]));
      }

      // Mock projects data for now (endpoint not implemented yet)
      try {
        // const loadedProjects = await storage.getProjects();
        // dispatch(setProjects(loadedProjects));
        console.log("Projects endpoint not implemented yet, using empty array");
        dispatch(setProjects([]));
      } catch (error) {
        console.error("Failed to load projects:", error);
        dispatch(setProjects([]));
      }

      // Mock today tasks data for now (endpoint not implemented yet)
      try {
        // const loadedTodayTasks = await storage.getTodayTasks();
        // dispatch(setTodayTasks(loadedTodayTasks));
        console.log("Today tasks endpoint not implemented yet, using empty array");
        dispatch(setTodayTasks([]));
      } catch (error) {
        console.error("Failed to load today tasks:", error);
        dispatch(setTodayTasks([]));
      }

      // Mock tags data for now (endpoint not implemented yet)
      dispatch(setTags([]));
      dispatch(setTaskTags([]));
      dispatch(setProjectTags([]));
    };

    loadData();
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

    try {
      // Add to remote storage
      const savedTask = await storage.addTask(newTask);
      console.log("savedTask", savedTask);

      // Update local state
      dispatch(addTaskAction(savedTask));

      // Add tag relationships if provided
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await storage.addTagToTask(savedTask.id, tagId);
        }
      }

      return savedTask.id;
    } catch (error) {
      console.error("Failed to add task:", error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // Update in remote storage
      await storage.updateTask(id, updates);

      // Update local state
      dispatch(updateTaskAction({ id, updates }));
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Delete from remote storage
      await storage.deleteTask(id);

      // Update local state
      dispatch(deleteTaskAction(id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    try {
      // Get tasks that are not being reordered
      const otherTasks = tasks.filter(
        (task) => !reorderedTasks.some((rt) => rt.id === task.id),
      );

      // Assign new order values
      const tasksWithOrder = reorderedTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      // Update in remote storage
      await storage.reorderTasks(tasksWithOrder);

      // Update local state with all tasks (reordered + others)
      dispatch(reorderTasksAction([...otherTasks, ...tasksWithOrder]));
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      throw error;
    }
  };

  const getInboxTasks = () =>
    tasks.filter((task) => !task.projectId && !task.isDaily);

  const getProjectTasks = (projectId: string) =>
    tasks
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => a.order - b.order);

  const getDailyTasks = () => {
    return tasks.filter((task) => task.isDaily);
  };

  const markDailyTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().split("T")[0];
    const newCompletionHistory = {
      ...(task.completionHistory || {}),
      [today]: true,
    };

    await updateTask(id, {
      lastCompleted: new Date().toISOString(),
      completionHistory: newCompletionHistory,
    });
  };

  const markDailyTaskIncomplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().split("T")[0];
    const updatedHistory = { ...(task.completionHistory || {}) };
    delete updatedHistory[today];

    // Remove today from completion history
    await updateTask(id, {
      completionHistory: updatedHistory,
    });
  };

  const getOrderedProjects = () =>
    [...projects].sort((a, b) => a.order - b.order);

  const addToToday = (taskId: string) => {
    const maxOrder =
      todayTasks.length > 0
        ? Math.max(...todayTasks.map((t) => t.order || 0))
        : 0;

    dispatch(
      addToTodayAction({
        taskId,
        order: maxOrder + 1,
      })
    );

    // For remote mode, this would need an API endpoint
    // For now, we'll keep it in local state only
    storage.saveTodayTasks([
      ...todayTasks,
      { taskId, order: maxOrder + 1 },
    ]);
  };

  const isInToday = (taskId: string): boolean => {
    return todayTasks.some((tt) => tt.taskId === taskId);
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
    reorderTasks,
    getInboxTasks,
    getProjectTasks,
    getDailyTasks,
    markDailyTaskComplete,
    markDailyTaskIncomplete,
    addToToday,
    isInToday,
  };
};

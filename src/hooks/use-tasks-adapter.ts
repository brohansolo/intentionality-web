"use client";

import { env } from "@/env.mjs";

import { useTasks } from "./use-tasks";
import { useTasksRemote } from "./use-tasks-remote";

/**
 * Adapter hook that switches between local and remote storage implementations
 * based on the NEXT_PUBLIC_STORAGE_TYPE environment variable
 */
export const useTasksAdapter = () => {
  const isRemote = env.NEXT_PUBLIC_STORAGE_TYPE === "remote";

  // Call both hooks unconditionally to comply with Rules of Hooks
  const localTasks = useTasks();
  const remoteTasks = useTasksRemote();

  // Return the appropriate implementation based on storage type
  return isRemote ? remoteTasks : localTasks;
};

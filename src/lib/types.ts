export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  projectId?: string;
  parentTaskId?: string;
  order: number;
  isDaily: boolean;
  timePeriod?: number; // in minutes
  timeLeft?: number; // remaining time in seconds for focus mode
  lastCompleted?: string; // for daily tasks
  completionHistory?: Record<string, boolean>; // YYYY-MM-DD -> true for daily tasks
  tags?: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  order: number;
  tags?: string[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface TodayTask {
  taskId: string;
  order: number;
}

export type View = "inbox" | "next-steps" | "daily-tasks" | "today" | string;

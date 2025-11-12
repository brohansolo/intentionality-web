import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Task } from "@/lib/types";

interface TasksState {
  items: Task[];
}

const initialState: TasksState = {
  items: [],
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Task> }>,
    ) => {
      const index = state.items.findIndex(
        (task) => task.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
        };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((task) => task.id !== action.payload);
    },
    deleteTasksByProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (task) => task.projectId !== action.payload,
      );
    },
    reorderTasks: (state, action: PayloadAction<Task[]>) => {
      const reorderedIds = new Set(action.payload.map((t) => t.id));
      const otherTasks = state.items.filter(
        (task) => !reorderedIds.has(task.id),
      );
      state.items = [...otherTasks, ...action.payload];
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  deleteTasksByProject,
  reorderTasks,
} = tasksSlice.actions;

export default tasksSlice.reducer;

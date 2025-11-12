import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TodayTask } from "@/lib/types";

interface TodayTasksState {
  items: TodayTask[];
}

const initialState: TodayTasksState = {
  items: [],
};

const todayTasksSlice = createSlice({
  name: "todayTasks",
  initialState,
  reducers: {
    setTodayTasks: (state, action: PayloadAction<TodayTask[]>) => {
      state.items = action.payload;
    },
    addToToday: (state, action: PayloadAction<TodayTask>) => {
      state.items.push(action.payload);
    },
    removeFromToday: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (task) => task.taskId !== action.payload,
      );
    },
    reorderTodayTasks: (state, action: PayloadAction<TodayTask[]>) => {
      state.items = action.payload;
    },
    clearToday: (state) => {
      state.items = [];
    },
  },
});

export const {
  setTodayTasks,
  addToToday,
  removeFromToday,
  reorderTodayTasks,
  clearToday,
} = todayTasksSlice.actions;

export default todayTasksSlice.reducer;

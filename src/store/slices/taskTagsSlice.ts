import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TaskTag } from "@/lib/types";

interface TaskTagsState {
  items: TaskTag[];
}

const initialState: TaskTagsState = {
  items: [],
};

const taskTagsSlice = createSlice({
  name: "taskTags",
  initialState,
  reducers: {
    setTaskTags: (state, action: PayloadAction<TaskTag[]>) => {
      state.items = action.payload;
    },
    addTaskTag: (state, action: PayloadAction<TaskTag>) => {
      const exists = state.items.some(
        (tt) =>
          tt.taskId === action.payload.taskId &&
          tt.tagId === action.payload.tagId,
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeTaskTag: (
      state,
      action: PayloadAction<{ taskId: string; tagId: string }>,
    ) => {
      state.items = state.items.filter(
        (tt) =>
          !(
            tt.taskId === action.payload.taskId &&
            tt.tagId === action.payload.tagId
          ),
      );
    },
    removeTaskTagsByTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((tt) => tt.taskId !== action.payload);
    },
    removeTaskTagsByTag: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((tt) => tt.tagId !== action.payload);
    },
  },
});

export const {
  setTaskTags,
  addTaskTag,
  removeTaskTag,
  removeTaskTagsByTask,
  removeTaskTagsByTag,
} = taskTagsSlice.actions;
export default taskTagsSlice.reducer;
import { configureStore } from "@reduxjs/toolkit";

import projectsReducer from "./slices/projectsSlice";
import tagsReducer from "./slices/tagsSlice";
import tasksReducer from "./slices/tasksSlice";
import todayTasksReducer from "./slices/todayTasksSlice";

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    todayTasks: todayTasksReducer,
    tags: tagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

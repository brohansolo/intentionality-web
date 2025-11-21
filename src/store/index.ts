import { configureStore } from "@reduxjs/toolkit";

import projectsReducer from "./slices/projectsSlice";
import projectTagsReducer from "./slices/projectTagsSlice";
import tagsReducer from "./slices/tagsSlice";
import tasksReducer from "./slices/tasksSlice";
import taskTagsReducer from "./slices/taskTagsSlice";
import todayTasksReducer from "./slices/todayTasksSlice";

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    todayTasks: todayTasksReducer,
    tags: tagsReducer,
    taskTags: taskTagsReducer,
    projectTags: projectTagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

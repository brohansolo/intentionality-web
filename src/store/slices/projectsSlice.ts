import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "@/lib/types";

interface ProjectsState {
  items: Project[];
}

const initialState: ProjectsState = {
  items: [],
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.items = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.items.push(action.payload);
    },
    updateProject: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Project> }>,
    ) => {
      const index = state.items.findIndex(
        (project) => project.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
        };
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (project) => project.id !== action.payload,
      );
    },
    reorderProjects: (state, action: PayloadAction<Project[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  deleteProject,
  reorderProjects,
} = projectsSlice.actions;

export default projectsSlice.reducer;

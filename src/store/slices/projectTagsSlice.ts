import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ProjectTag } from "@/lib/types";

interface ProjectTagsState {
  items: ProjectTag[];
}

const initialState: ProjectTagsState = {
  items: [],
};

const projectTagsSlice = createSlice({
  name: "projectTags",
  initialState,
  reducers: {
    setProjectTags: (state, action: PayloadAction<ProjectTag[]>) => {
      state.items = action.payload;
    },
    addProjectTag: (state, action: PayloadAction<ProjectTag>) => {
      const exists = state.items.some(
        (pt) =>
          pt.projectId === action.payload.projectId &&
          pt.tagId === action.payload.tagId,
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeProjectTag: (
      state,
      action: PayloadAction<{ projectId: string; tagId: string }>,
    ) => {
      state.items = state.items.filter(
        (pt) =>
          !(
            pt.projectId === action.payload.projectId &&
            pt.tagId === action.payload.tagId
          ),
      );
    },
    removeProjectTagsByProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (pt) => pt.projectId !== action.payload,
      );
    },
    removeProjectTagsByTag: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((pt) => pt.tagId !== action.payload);
    },
  },
});

export const {
  setProjectTags,
  addProjectTag,
  removeProjectTag,
  removeProjectTagsByProject,
  removeProjectTagsByTag,
} = projectTagsSlice.actions;
export default projectTagsSlice.reducer;
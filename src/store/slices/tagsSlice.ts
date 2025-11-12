import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Tag } from "@/lib/types";

interface TagsState {
  items: Tag[];
}

const initialState: TagsState = {
  items: [],
};

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.items = action.payload;
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.items.push(action.payload);
    },
    updateTag: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Tag> }>,
    ) => {
      const index = state.items.findIndex(
        (tag) => tag.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
        };
      }
    },
    deleteTag: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((tag) => tag.id !== action.payload);
    },
  },
});

export const { setTags, addTag, updateTag, deleteTag } = tagsSlice.actions;
export default tagsSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import blocksReducer from './slices/blocksSlice';
import extrinsicsReducer from './slices/extrinsicsSlice';

export const store = configureStore({
  reducer: {
    blocks: blocksReducer,
    extrinsics: extrinsicsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
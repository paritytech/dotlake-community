import { configureStore } from '@reduxjs/toolkit';
import blocksReducer from './slices/blocksSlice';
import extrinsicsReducer from './slices/extrinsicsSlice';
import accountReducer from './slices/accountSlice';

export const store = configureStore({
  reducer: {
    blocks: blocksReducer,
    extrinsics: extrinsicsReducer,
    account: accountReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
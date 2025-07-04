import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../api/axios';

interface Extrinsic {
  method: {
    pallet: string;
    method: string;
  };
  signature: {
    signer: {
      id: string;
    };
  } | null;
  nonce: string | null;
  args: any;
  tip: string | null;
  hash: string | null;
  info: any;
  era: any;
  success: boolean;
  pays_fee: boolean;
  index: string;
  relay_chain: string;
  chain: string;
  timestamp: number;
  number: string;
  block_hash: string;
}

interface ExtrinsicsState {
  recentExtrinsics: Extrinsic[];
  loading: boolean;
  error: string | null;
}

const initialState: ExtrinsicsState = {
  recentExtrinsics: [],
  loading: false,
  error: null,
};

export const fetchRecentExtrinsics = createAsyncThunk(
  'extrinsics/fetchRecent',
  async () => {
    const response = await api.get('/extrinsics/recent');
    return response.data.extrinsics;
  }
);

const extrinsicsSlice = createSlice({
  name: 'extrinsics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentExtrinsics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentExtrinsics.fulfilled, (state, action) => {
        state.loading = false;
        state.recentExtrinsics = action.payload;
      })
      .addCase(fetchRecentExtrinsics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch extrinsics';
      });
  },
});

export default extrinsicsSlice.reducer; 
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Block {
  number: number;
  hash: string;
  parenthash: string;
  stateroot: string;
  extrinsicsroot: string;
  timestamp: number;
  authorid: string;
  finalized: boolean;
  extrinsics?: any[];
  events?: any[];
}

interface SearchParams {
  blockNumber?: string;
  hash?: string;
  author?: string;
  finalized?: boolean;
}

interface BlocksState {
  recentBlocks: Block[];
  currentBlock: Block | null;
  latestBlockNumber: number;
  oldestBlockNumber: number;
  loading: boolean;
  error: string | null;
}

const initialState: BlocksState = {
  recentBlocks: [],
  currentBlock: null,
  latestBlockNumber: 0,
  oldestBlockNumber: 0,
  loading: false,
  error: null,
};

export const fetchRecentBlocks = createAsyncThunk<Block[], void>(
  'blocks/fetchRecent',
  async () => {
    const response = await api.get('/blocks/recent');
    return response.data.blocks;
  }
);

export const fetchBlock = createAsyncThunk<Block | null, string>(
  'blocks/fetchBlock',
  async (blockNumber: string) => {
    const response = await api.get(`/blocks/${blockNumber}`);
    return response.data;
  }
);

export const searchBlocks = createAsyncThunk<Block[], SearchParams>(
  'blocks/search',
  async (params: SearchParams) => {
    const response = await api.get('/blocks/search', { params });
    return response.data.blocks;
  }
);

const blocksSlice = createSlice({
  name: 'blocks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentBlocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentBlocks.fulfilled, (state, action) => {
        state.loading = false;
        state.recentBlocks = action.payload;
        if (action.payload.length > 0) {
          const blockNumbers = action.payload.map(block => parseInt(block.number.toString()));
          state.latestBlockNumber = Math.max(state.latestBlockNumber, ...blockNumbers);
          const minBlock = Math.min(...blockNumbers);
          if (state.oldestBlockNumber === 0 || minBlock < state.oldestBlockNumber) {
            state.oldestBlockNumber = minBlock;
          }
        }
      })
      .addCase(fetchRecentBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blocks';
      })
      .addCase(fetchBlock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlock.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlock = action.payload;
        if (action.payload) {
          state.latestBlockNumber = Math.max(
            state.latestBlockNumber,
            parseInt(action.payload.number.toString())
          );
          const blockNumber = parseInt(action.payload.number.toString());
          if (state.oldestBlockNumber === 0 || blockNumber < state.oldestBlockNumber) {
            state.oldestBlockNumber = blockNumber;
          }
        }
      })
      .addCase(fetchBlock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch block';
      })
      .addCase(searchBlocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBlocks.fulfilled, (state, action) => {
        state.loading = false;
        state.recentBlocks = action.payload;
      })
      .addCase(searchBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search blocks';
      });
  },
});

export default blocksSlice.reducer; 
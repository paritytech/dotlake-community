import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Block {
  number: string;
  hash: string;
  parenthash: string;
  stateroot: string;
  extrinsicsroot: string;
  timestamp: number;
  authorid: string;
  finalized: boolean;
  extrinsics_count: number; 
  events_count: number;
  logs_count: number;
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

// Helper function to compare block numbers as strings
const compareBlockNumbers = (a: string, b: string) => {
  const padToSameLength = (...nums: string[]) => {
    const maxLength = Math.max(...nums.map(n => n.length));
    return nums.map(n => n.padStart(maxLength, '0'));
  };
  const [paddedA, paddedB] = padToSameLength(a, b);
  return paddedA.localeCompare(paddedB);
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
          // Find max and min block numbers using string comparison
          let maxBlock = action.payload[0].number;
          let minBlock = action.payload[0].number;
          
          action.payload.forEach(block => {
            if (compareBlockNumbers(block.number, maxBlock) > 0) {
              maxBlock = block.number;
            }
            if (compareBlockNumbers(block.number, minBlock) < 0) {
              minBlock = block.number;
            }
          });
          
          state.latestBlockNumber = parseInt(maxBlock);
          if (state.oldestBlockNumber === 0 || parseInt(minBlock) < state.oldestBlockNumber) {
            state.oldestBlockNumber = parseInt(minBlock);
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
          const blockNumber = parseInt(action.payload.number);
          state.latestBlockNumber = Math.max(state.latestBlockNumber, blockNumber);
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
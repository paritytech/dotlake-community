import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface AssetBalance {
  assetId: string;
  balance: string;
  symbol: string;
  decimals: number;
}

interface AccountState {
  accountId: string | null;
  balances: AssetBalance[];
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  accountId: null,
  balances: [],
  loading: false,
  error: null,
};

export const fetchAccountBalances = createAsyncThunk(
  'account/fetchBalances',
  async (accountId: string) => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data;
  }
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearAccount: (state) => {
      state.accountId = null;
      state.balances = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountBalances.fulfilled, (state, action) => {
        state.loading = false;
        state.accountId = action.payload.account_id;
        state.balances = action.payload.balances;
      })
      .addCase(fetchAccountBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch account balances';
      });
  },
});

export const { clearAccount } = accountSlice.actions;
export default accountSlice.reducer; 
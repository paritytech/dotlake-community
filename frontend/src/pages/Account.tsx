import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { fetchAccountBalances } from '../store/slices/accountSlice';
import { AppDispatch, RootState } from '../store';

const Account: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accountId, balances, loading, error } = useSelector((state: RootState) => state.account);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      await dispatch(fetchAccountBalances(searchInput.trim()));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Account Balances
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Enter Account ID"
              variant="outlined"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter account address..."
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </form>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {accountId && balances.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset ID</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.assetId}>
                  <TableCell>{balance.assetId}</TableCell>
                  <TableCell align="right">{balance.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {accountId && balances.length === 0 && !loading && !error && (
        <Alert severity="info">
          No balances found for this account.
        </Alert>
      )}
    </Box>
  );
};

export default Account; 
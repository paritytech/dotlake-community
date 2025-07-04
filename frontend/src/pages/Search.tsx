import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import { searchBlocks } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';

const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.blocks);
  const [searchParams, setSearchParams] = useState({
    blockNumber: '',
    hash: '',
    author: '',
    finalized: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty values
    const params = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => 
        value !== '' && value !== false
      )
    );
    dispatch(searchBlocks(params));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: name === 'finalized' ? checked : value,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Search Blocks
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Block Number"
              name="blockNumber"
              value={searchParams.blockNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Block Hash"
              name="hash"
              value={searchParams.hash}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Author"
              name="author"
              value={searchParams.author}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="finalized"
                  checked={searchParams.finalized}
                  onChange={handleChange}
                />
              }
              label="Finalized Only"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Search; 
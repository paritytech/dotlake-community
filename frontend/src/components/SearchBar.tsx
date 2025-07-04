import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api/axios';

interface SearchBarProps {
  size?: 'small' | 'medium' | 'large';
}

const SearchBar: React.FC<SearchBarProps> = ({ size = 'large' }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!searchQuery) return;

    // Case 1: If it's a number, search for block number
    if (/^\d+$/.test(searchQuery)) {
      navigate(`/block/${searchQuery}`);
      return;
    }

    // Case 2 & 3: If it starts with 0x, try block hash first, then extrinsic hash
    if (searchQuery.startsWith('0x')) {
      // Try block hash first
      try {
        const blockResponse = await api.get(`/blocks/hash/${searchQuery}`);
        
        if (blockResponse.data !== null) {
          navigate(`/block/${blockResponse.data.number}`);
          return;
        }
      } catch (err) {
        console.error('Error searching for block:', err);
      }

      // If block not found or error occurred, try extrinsic hash
      try {
        const extrinsicResponse = await api.get(`/extrinsics/hash/${searchQuery}`);

        if (extrinsicResponse.data !== null) {
          navigate(`/extrinsic/${extrinsicResponse.data.index}`);
          return;
        }

        // If we get here, neither block nor extrinsic was found
        setError('No block or extrinsic found with the provided hash');
      } catch (err) {
        setError('Error searching for hash');
        console.error('Error searching for hash:', err);
      }
    } else {
      // For any other search term, redirect to search page
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: '40px', fontSize: '0.875rem' };
      case 'medium':
        return { height: '48px', fontSize: '1rem' };
      case 'large':
        return { height: '56px', fontSize: '1.125rem' };
      default:
        return { height: '56px', fontSize: '1.125rem' };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <>
      <Box component="form" onSubmit={handleSearch} sx={{ width: '100%' }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by block number, block hash (0x...), or extrinsic hash (0x...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: {
                height: sizeStyles.height,
                '& input': {
                  fontSize: sizeStyles.fontSize,
                },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{
              height: sizeStyles.height,
              minWidth: '100px',
              fontSize: sizeStyles.fontSize,
            }}
          >
            Search
          </Button>
        </Box>
      </Box>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SearchBar; 
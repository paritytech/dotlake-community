import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  size?: 'small' | 'medium' | 'large';
}

const SearchBar: React.FC<SearchBarProps> = ({ size = 'large' }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      if (/^\d+$/.test(searchQuery)) {
        navigate(`/block/${searchQuery}`);
      } else {
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      }
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
    <Box component="form" onSubmit={handleSearch} sx={{ width: '100%' }}>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter block number or search by hash/author"
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
  );
};

export default SearchBar; 
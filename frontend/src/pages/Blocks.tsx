import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Chip,
  CircularProgress,
} from '@mui/material';
import { fetchRecentBlocks } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';

interface Block {
  number: string;
  hash: string;
  timestamp: number;
  authorid: string;
  finalized: boolean;
  extrinsics_count: number;
  events_count: number;
}

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

const Blocks: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { recentBlocks, loading: storeLoading, error: storeError } = useSelector((state: RootState) => state.blocks);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 25;

  const fetchBlocks = async () => {
    try {
      await dispatch(fetchRecentBlocks()).unwrap();
      // For now, we'll just show one page since we don't have total count from API
      setTotalPages(1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBlocks();
    // Set up auto-refresh every 12 seconds
    const intervalId = setInterval(fetchBlocks, 12000);
    return () => clearInterval(intervalId);
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (storeLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (storeError) {
    return (
      <Box p={3}>
        <Typography color="error">{storeError}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Latest Blocks
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Block</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hash</TableCell>
              <TableCell>Author</TableCell>
              <TableCell align="right">Extrinsics</TableCell>
              <TableCell align="right">Events</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentBlocks.map((block) => (
              <TableRow key={block.number} hover>
                <TableCell>
                  <Link
                    to={`/block/${block.number}`}
                    style={{ textDecoration: 'none', color: '#E6007A' }}
                  >
                    {block.number}
                  </Link>
                </TableCell>
                <TableCell>{formatTimeAgo(block.timestamp)}</TableCell>
                <TableCell>
                  <Chip
                    label={block.finalized ? "Finalized" : "Not Finalized"}
                    color={block.finalized ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {`${block.hash.slice(0, 8)}...${block.hash.slice(-8)}`}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {`${block.authorid.slice(0, 8)}...${block.authorid.slice(-8)}`}
                </TableCell>
                <TableCell align="right">{block.extrinsics_count}</TableCell>
                <TableCell align="right">{block.events_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default Blocks;
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
import api from '../api/axios';
import { fetchRecentBlocks } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';

interface Extrinsic {
  method: {
    pallet: string;
    method: string;
  };
  signature?: {
    signer?: {
      id: string;
    };
  };
  success: boolean;
  index: string;
  number: string;
  timestamp: number;
  hash: string;
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

const Extrinsics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [extrinsics, setExtrinsics] = useState<Extrinsic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 25;

  const fetchExtrinsics = async () => {
    try {
      setLoading(true);
      // First update the store with latest blocks
      await dispatch(fetchRecentBlocks()).unwrap();
      
      const response = await api.get(`/extrinsics/recent?limit=${rowsPerPage}`);
      setExtrinsics(response.data.extrinsics);
      setTotalPages(Math.ceil(response.data.total / rowsPerPage));
    } catch (err) {
      setError('Failed to fetch extrinsics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtrinsics();
    // Set up auto-refresh every 12 seconds
    const intervalId = setInterval(fetchExtrinsics, 12000);
    return () => clearInterval(intervalId);
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Latest Extrinsics
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Extrinsic ID</TableCell>
              <TableCell>Block</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Hash</TableCell>
              <TableCell>Signer</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {extrinsics.map((extrinsic) => (
              <TableRow key={extrinsic.index} hover>
                <TableCell>
                  <Link
                    to={`/extrinsic/${extrinsic.index}`}
                    style={{ textDecoration: 'none', color: '#E6007A' }}
                  >
                    {extrinsic.index}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/block/${extrinsic.number}`}
                    style={{ textDecoration: 'none', color: '#E6007A' }}
                  >
                    {extrinsic.number}
                  </Link>
                </TableCell>
                <TableCell>{formatTimeAgo(extrinsic.timestamp)}</TableCell>
                <TableCell>
                  {`${extrinsic.method.pallet}.${extrinsic.method.method}`}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {`${extrinsic.hash.slice(0, 8)}...${extrinsic.hash.slice(-8)}`}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {extrinsic.signature?.signer?.id
                    ? `${extrinsic.signature.signer.id.slice(0, 8)}...${extrinsic.signature.signer.id.slice(-8)}`
                    : 'Unsigned'
                  }
                </TableCell>
                <TableCell>
                  <Chip
                    label={extrinsic.success ? "Success" : "Failed"}
                    color={extrinsic.success ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
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

export default Extrinsics;
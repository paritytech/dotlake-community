import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from '@mui/material';
import { fetchRecentBlocks } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';

interface Block {
  number: number;
  hash: string;
  timestamp: number;
  extrinsics?: any[];
}

interface Extrinsic {
  method: {
    pallet: string;
    method: string;
  };
  hash: string;
  success: boolean;
  paysFee: boolean;
  signature?: {
    signer: {
      id: string;
    };
  };
  events: any[];
  blockNumber: number;
  timestamp: number;
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

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { recentBlocks, loading, error } = useSelector((state: RootState) => state.blocks);

  useEffect(() => {
    // Initial fetch
    dispatch(fetchRecentBlocks());

    // Set up periodic refresh every 10 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchRecentBlocks());
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  // Get the 10 most recent blocks
  const recentBlocksList = recentBlocks.slice(0, 10);

  // Get all extrinsics from recent blocks and sort by timestamp
  const allExtrinsics = recentBlocks.flatMap(block => 
    (block.extrinsics || []).map(extrinsic => ({
      ...extrinsic,
      blockNumber: block.number,
      timestamp: block.timestamp
    }))
  ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="h4" gutterBottom>
            Latest Blocks
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Block Number</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Extrinsics</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBlocksList.map((block: Block) => (
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
                    <TableCell>{block.extrinsics?.length || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Latest Extrinsics
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>Block</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allExtrinsics.map((extrinsic: Extrinsic, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {`${extrinsic.method?.pallet || ''}.${extrinsic.method?.method || ''}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/block/${extrinsic.blockNumber}`}
                        style={{ textDecoration: 'none', color: '#E6007A' }}
                      >
                        {extrinsic.blockNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', maxWidth: 150 }}>
                        {extrinsic.signature?.signer?.id || 'Unsigned'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatTimeAgo(extrinsic.timestamp)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={extrinsic.success ? "success.main" : "error.main"}
                      >
                        {extrinsic.success ? "Success" : "Failed"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 
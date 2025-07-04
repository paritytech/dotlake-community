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
import { fetchRecentExtrinsics } from '../store/slices/extrinsicsSlice';
import { AppDispatch, RootState } from '../store';

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
  const { recentBlocks, loading: blocksLoading, error: blocksError } = useSelector((state: RootState) => state.blocks);
  const { recentExtrinsics, loading: extrinsicsLoading, error: extrinsicsError } = useSelector((state: RootState) => state.extrinsics);

  useEffect(() => {
    // Initial fetch
    dispatch(fetchRecentBlocks());
    dispatch(fetchRecentExtrinsics());

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchRecentBlocks());
      dispatch(fetchRecentExtrinsics());
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  if (blocksLoading || extrinsicsLoading) return <Typography>Loading...</Typography>;
  if (blocksError) return <Typography color="error">{blocksError}</Typography>;
  if (extrinsicsError) return <Typography color="error">{extrinsicsError}</Typography>;

  // Get the 10 most recent blocks
  const recentBlocksList = recentBlocks.slice(0, 10);

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
                    <TableCell>{block.extrinsics_count || 0}</TableCell>
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
                {recentExtrinsics.slice(0, 10).map((extrinsic) => (
                  <TableRow key={extrinsic.hash} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {`${extrinsic.method.pallet}.${extrinsic.method.method}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/block/${extrinsic.number}`}
                        style={{ textDecoration: 'none', color: '#E6007A' }}
                      >
                        {extrinsic.number}
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
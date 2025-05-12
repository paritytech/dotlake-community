import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import api from '../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecentBlocks } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';

interface Event {
  relay_chain: string;
  chain: string;
  timestamp: number;
  number: string;
  hash: string;
  extrinsic_id?: string;
  event_id: string;
  pallet: string;
  method: string;
  data: Record<string, any>;
  source: string;
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

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 25;
  const dispatch = useDispatch<AppDispatch>();
  const { latestBlockNumber } = useSelector((state: RootState) => state.blocks);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // First update the store with latest blocks
      await dispatch(fetchRecentBlocks()).unwrap();
      
      // Use the latest block number from the store
      if (latestBlockNumber) {
        const eventsResponse = await api.get(`/blocks/${latestBlockNumber}/events?page=${page}&page_size=${rowsPerPage}`);
        console.log('Events response:', eventsResponse.data.events);
        setEvents(eventsResponse.data.events);
        setTotalPages(eventsResponse.data.total_pages);
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Set up auto-refresh every 12 seconds
    const intervalId = setInterval(fetchEvents, 12000);
    return () => clearInterval(intervalId);
  }, [page, latestBlockNumber]);

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
        Latest Events
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Block</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Extrinsic ID</TableCell>
              <TableCell>Event ID</TableCell>
              <TableCell>Pallet</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={`${event.number}-${event.event_id}`} hover>
                <TableCell>
                  <Link
                    to={`/block/${event.number}`}
                    style={{ textDecoration: 'none', color: '#E6007A' }}
                  >
                    {event.number}
                  </Link>
                </TableCell>
                <TableCell>{formatTimeAgo(event.timestamp)}</TableCell>
                <TableCell>
                  {event.extrinsic_id ? (
                    <Link
                      to={`/extrinsic/${event.extrinsic_id}`}
                      style={{ textDecoration: 'none', color: '#E6007A' }}
                    >
                      {event.extrinsic_id}
                    </Link>
                  ) : '-'}
                </TableCell>
                <TableCell>{event.event_id}</TableCell>
                <TableCell>{event.pallet}</TableCell>
                <TableCell>{event.method}</TableCell>
                <TableCell>{event.source}</TableCell>
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

export default Events; 
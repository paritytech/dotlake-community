import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Link,
  Snackbar,
  Pagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fetchBlock } from '../store/slices/blocksSlice';
import { AppDispatch, RootState } from '../store';
import api from '../api/axios';

const BLOCK_TIME = 6; // seconds

interface Event {
  pallet: string;
  method: string;
  data: any;
  source: string;
  extrinsic_id?: number;
}

interface Log {
  type: string;
  index: string;
  value: any;
}

const BlockDetails: React.FC = () => {
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentBlock, loading, error, latestBlockNumber, oldestBlockNumber } = useSelector(
    (state: RootState) => state.blocks
  );

  // Convert block numbers to strings for consistent comparison
  const requestedBlockNumber = blockNumber || '0';
  const latestBlockStr = latestBlockNumber.toString();
  const oldestBlockStr = oldestBlockNumber.toString();
  
  // Compare block numbers as strings, padded to same length for correct string comparison
  const padToSameLength = (...nums: string[]) => {
    const maxLength = Math.max(...nums.map(n => n.length));
    return nums.map(n => n.padStart(maxLength, '0'));
  };
  
  const [paddedRequested, paddedLatest, paddedOldest] = padToSameLength(
    requestedBlockNumber,
    latestBlockStr,
    oldestBlockStr
  );
  
  const isFutureBlock = paddedRequested > paddedLatest;
  const isOldBlock = oldestBlockNumber > 0 && paddedRequested < paddedOldest;

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [paginatedExtrinsics, setPaginatedExtrinsics] = useState<any[]>([]);
  const [extrinsicsLoading, setExtrinsicsLoading] = useState(false);
  const [extrinsicsError, setExtrinsicsError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [eventsPage, setEventsPage] = useState(1);
  const [extrinsicsPage, setExtrinsicsPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalExtrinsics, setTotalExtrinsics] = useState(0);
  const [totalEventsPages, setTotalEventsPages] = useState(0);
  const [totalExtrinsicsPages, setTotalExtrinsicsPages] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!blockNumber) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const response = await api.get(`/blocks/${blockNumber}/events`, {
        params: {
          page: eventsPage,
          page_size: 25
        }
      });
      setEvents(response.data.events);
      setTotalEvents(response.data.total);
      setTotalEventsPages(response.data.total_pages);
    } catch (err) {
      setEventsError('Failed to fetch events');
    } finally {
      setEventsLoading(false);
    }
  }, [blockNumber, eventsPage]);

  const fetchExtrinsics = useCallback(async () => {
    if (!blockNumber) return;
    setExtrinsicsLoading(true);
    setExtrinsicsError(null);
    try {
      const response = await api.get(`/blocks/${blockNumber}/extrinsics`, {
        params: {
          page: extrinsicsPage,
          page_size: 25
        }
      });
      setPaginatedExtrinsics(response.data.extrinsics);
      setTotalExtrinsics(response.data.total);
      setTotalExtrinsicsPages(response.data.total_pages);
    } catch (err) {
      setExtrinsicsError('Failed to fetch extrinsics');
    } finally {
      setExtrinsicsLoading(false);
    }
  }, [blockNumber, extrinsicsPage]);

  const fetchLogs = useCallback(async () => {
    if (!blockNumber) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const response = await api.get(`/blocks/${blockNumber}/logs`);
      setLogs(response.data.logs);
    } catch (err) {
      setLogsError('Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  }, [blockNumber]);

  useEffect(() => {
    if (blockNumber && !isFutureBlock && !isOldBlock) {
      console.log('Fetching block:', blockNumber);
      dispatch(fetchBlock(blockNumber));
      fetchEvents();
      fetchExtrinsics();
      fetchLogs();
    }
  }, [dispatch, blockNumber, isFutureBlock, isOldBlock, fetchEvents, fetchExtrinsics, fetchLogs]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!blockNumber) return;
    const newBlockNumber = direction === 'next' 
      ? parseInt(blockNumber) + 1 
      : parseInt(blockNumber) - 1;
    
    // Update latestBlockNumber if navigating to a newer block
    if (direction === 'next' && newBlockNumber > latestBlockNumber) {
      dispatch(fetchBlock(newBlockNumber.toString()));
    }
    
    navigate(`/block/${newBlockNumber}`);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(`${label} copied to clipboard`);
    setSnackbarOpen(true);
  };

  const getEstimatedTime = () => {
    const blocksToWait = parseInt(paddedRequested) - latestBlockNumber;
    const secondsToWait = blocksToWait * BLOCK_TIME;
    const estimatedTime = new Date(Date.now() + secondsToWait * 1000);
    return estimatedTime.toLocaleString();
  };

  const formatHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const handleEventsPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setEventsPage(value);
  };

  const handleExtrinsicsPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setExtrinsicsPage(value);
  };

  if (isOldBlock) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box display="flex" alignItems="center">
            <Tooltip title="Previous Block">
              <IconButton 
                onClick={() => handleNavigate('prev')} 
                disabled={parseInt(blockNumber!) <= 0}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h4">
              Block #{blockNumber}
            </Typography>
            <Tooltip title="Next Block">
              <IconButton onClick={() => handleNavigate('next')}>
                <NavigateNextIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1">
            This block has not been indexed yet. The oldest indexed block is{' '}
            <Link component={RouterLink} to={`/block/${oldestBlockNumber}`}>
              #{oldestBlockNumber}
            </Link>.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (isFutureBlock) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box display="flex" alignItems="center">
            <Tooltip title="Previous Block">
              <IconButton 
                onClick={() => handleNavigate('prev')} 
                disabled={parseInt(blockNumber!) <= 0}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h4">
              Block #{blockNumber}
            </Typography>
            <Tooltip title="Next Block">
              <IconButton onClick={() => handleNavigate('next')}>
                <NavigateNextIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body1">
            This block has not been produced yet. Current latest block is #{latestBlockNumber}.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Expected block time: {getEstimatedTime()}
          </Typography>
        </Alert>
      </Box>
    );
  }

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

  if (!currentBlock) {
    return (
      <Box p={3}>
        <Typography>Block not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Box display="flex" alignItems="center">
          <Tooltip title="Previous Block">
            <IconButton 
              onClick={() => handleNavigate('prev')} 
              disabled={parseInt(blockNumber!) <= 0}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4">
            Block #{currentBlock.number}
          </Typography>
          <Tooltip title="Next Block">
            <IconButton onClick={() => handleNavigate('next')}>
              <NavigateNextIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Chip 
          label={currentBlock.finalized ? "Finalized" : "Not Finalized"}
          color={currentBlock.finalized ? "success" : "warning"}
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ width: '200px', bgcolor: 'background.default' }}>
                Hash
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {currentBlock.hash}
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(currentBlock.hash || '', 'Hash')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Parent Hash
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {currentBlock.parenthash}
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(currentBlock.parenthash || '', 'Parent Hash')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                State Root
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{currentBlock.stateroot}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Extrinsics Root
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{currentBlock.extrinsicsroot}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Timestamp
              </TableCell>
              <TableCell>{new Date(currentBlock.timestamp).toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Author
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {currentBlock.authorid}
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(currentBlock.authorid || '', 'Author')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Accordion defaultExpanded={false}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          <Typography>Extrinsics ({totalExtrinsics})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Extrinsic ID</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Hash</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell>Signer</TableCell>
                  <TableCell align="center">Pays Fee</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extrinsicsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : extrinsicsError ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" color="error">
                      {extrinsicsError}
                    </TableCell>
                  </TableRow>
                ) : paginatedExtrinsics.map((extrinsic: any, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/extrinsic/${extrinsic.index}`}
                        sx={{ 
                          textDecoration: 'none',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {extrinsic.index}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {`${extrinsic.method?.pallet || ''}.${extrinsic.method?.method || ''}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', maxWidth: 100 }}>
                          {formatHash(extrinsic.hash || '-')}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyToClipboard(extrinsic.hash || '', 'Extrinsic Hash')}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{extrinsic.events?.length || 0}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', maxWidth: 150 }}>
                          {extrinsic.signature?.signer?.id || 'Unsigned'}
                        </Typography>
                        {extrinsic.signature?.signer?.id && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyToClipboard(extrinsic.signature?.signer?.id || '', 'Signer')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={extrinsic.pays_fee ? "Yes" : "No"}
                        color={extrinsic.pays_fee ? "default" : "secondary"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
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
          {totalExtrinsicsPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2} mb={1}>
              <Pagination
                count={totalExtrinsicsPages}
                page={extrinsicsPage}
                onChange={handleExtrinsicsPageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          <Typography>Events ({totalEvents})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Extrinsic ID</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Pallet</TableCell>
                  <TableCell>Method</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : eventsError ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" color="error">
                      {eventsError}
                    </TableCell>
                  </TableRow>
                ) : events.map((event, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {event.extrinsic_id !== undefined ? (
                        <Link
                          component={RouterLink}
                          to={`/extrinsic/${event.extrinsic_id}`}
                          sx={{ 
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {event.extrinsic_id}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>{event.pallet}</TableCell>
                    <TableCell>{event.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalEventsPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2} mb={1}>
              <Pagination
                count={totalEventsPages}
                page={eventsPage}
                onChange={handleEventsPageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          <Typography>Logs ({logs.length})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Index</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : logsError ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" color="error">
                      {logsError}
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.index} hover>
                    <TableCell>{log.index}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        maxWidth: '400px',
                        maxHeight: '100px',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#888',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: '#555',
                        },
                      }}>
                        <pre style={{ 
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          margin: 0
                        }}>
                          {JSON.stringify(log.value, null, 2)}
                        </pre>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default BlockDetails; 
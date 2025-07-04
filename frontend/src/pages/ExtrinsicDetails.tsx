import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Link,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../api/axios';

interface ExtrinsicDetailsData {
  method: {
    pallet: string;
    method: string;
  };
  signature?: {
    signer?: {
      id: string;
    };
    signature?: string;
  };
  nonce?: string;
  args: Record<string, any>;
  tip?: string;
  hash?: string;
  info?: Record<string, any>;
  era?: {
    period?: string;
    phase?: string;
  };
  success: boolean;
  pays_fee: boolean;
  index: string;
  relay_chain: string;
  chain: string;
  timestamp: number;
  number: string;
  block_hash: string;
  event_count: number;
}

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

const ExtrinsicDetails: React.FC = () => {
  const { extrinsicId } = useParams<{ extrinsicId: string }>();
  const navigate = useNavigate();
  const [extrinsic, setExtrinsic] = useState<ExtrinsicDetailsData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const fetchExtrinsicAndEvents = async () => {
      if (!extrinsicId) return;
      setLoading(true);
      setError(null);
      try {
        const [blockNumber, index] = extrinsicId.split('-');
        
        // Fetch extrinsic details
        const extrinsicResponse = await api.get(`/blocks/${blockNumber}/extrinsics`, {
          params: {
            page: 1,
            page_size: 1,
            extrinsic_id: extrinsicId
          }
        });
        
        if (extrinsicResponse.data.extrinsics.length > 0) {
          setExtrinsic(extrinsicResponse.data.extrinsics[0]);
          
          // Fetch associated events with pagination
          const eventsResponse = await api.get(`/blocks/${blockNumber}/events`, {
            params: {
              page: page + 1,
              page_size: rowsPerPage,
              extrinsic_id: extrinsicId
            }
          });
          
          setEvents(eventsResponse.data.events);
          setTotalEvents(eventsResponse.data.total);
        } else {
          setError('Extrinsic not found');
        }
      } catch (err) {
        setError('Failed to fetch extrinsic details');
      } finally {
        setLoading(false);
      }
    };

    fetchExtrinsicAndEvents();
  }, [extrinsicId, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(`${label} copied to clipboard`);
    setSnackbarOpen(true);
  };

  const formatHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const TableCellWithEllipsis = ({ children }: { children: React.ReactNode }) => (
    <TableCell>
      <Box
        sx={{
          maxWidth: '200px',
          overflow: 'auto',
          whiteSpace: 'nowrap',
          '&::-webkit-scrollbar': {
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
        }}
      >
        {children}
      </Box>
    </TableCell>
  );

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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!extrinsic) {
    return (
      <Box p={3}>
        <Typography>Extrinsic not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Box display="flex" alignItems="center">
          <Tooltip title="Previous Extrinsic">
            <IconButton 
              onClick={() => {
                const [blockNumber, index] = extrinsicId!.split('-');
                const newIndex = parseInt(index) - 1;
                if (newIndex >= 0) {
                  navigate(`/extrinsic/${blockNumber}-${newIndex}`);
                }
              }}
              disabled={parseInt(extrinsicId!.split('-')[1]) <= 0}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4">
            Extrinsic #{extrinsic.index}
          </Typography>
          <Tooltip title="Next Extrinsic">
            <IconButton 
              onClick={() => {
                const [blockNumber, index] = extrinsicId!.split('-');
                const newIndex = parseInt(index) + 1;
                navigate(`/extrinsic/${blockNumber}-${newIndex}`);
              }}
            >
              <NavigateNextIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Link
          component={RouterLink}
          to={`/block/${extrinsic.number}`}
          sx={{ ml: 2 }}
        >
          View Block #{extrinsic.number}
        </Link>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ width: '200px', bgcolor: 'background.default' }}>
                Hash
              </TableCell>
              <TableCellWithEllipsis>
                <Box display="flex" alignItems="center" gap={1}>
                  {formatHash(extrinsic.hash || '')}
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(extrinsic.hash || '', 'Hash')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCellWithEllipsis>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Method
              </TableCell>
              <TableCellWithEllipsis>
                {`${extrinsic.method.pallet}.${extrinsic.method.method}`}
              </TableCellWithEllipsis>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Signer
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {extrinsic.signature?.signer?.id || 'Unsigned'}
                  {extrinsic.signature?.signer?.id && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyToClipboard(extrinsic.signature!.signer!.id, 'Signer')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Status
              </TableCell>
              <TableCell>
                <Chip
                  label={extrinsic.success ? "Success" : "Failed"}
                  color={extrinsic.success ? "success" : "error"}
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Pays Fee
              </TableCell>
              <TableCell>
                <Chip 
                  label={extrinsic.pays_fee ? "Yes" : "No"}
                  color={extrinsic.pays_fee ? "default" : "secondary"}
                  size="small"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Arguments</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <pre style={{ 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}>
              {JSON.stringify(extrinsic.args, null, 2)}
            </pre>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Events ({totalEvents})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '200px' }}>Event ID</TableCell>
                    <TableCell sx={{ width: '200px' }}>Pallet</TableCell>
                    <TableCell sx={{ width: '200px' }}>Method</TableCell>
                    <TableCell sx={{ width: '400px' }}>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.event_id} hover>
                      <TableCellWithEllipsis>{event.event_id}</TableCellWithEllipsis>
                      <TableCellWithEllipsis>{event.pallet}</TableCellWithEllipsis>
                      <TableCellWithEllipsis>{event.method}</TableCellWithEllipsis>
                      <TableCell>
                        <Box
                          sx={{
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
                          }}
                        >
                          <pre style={{ 
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            margin: 0
                          }}>
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <TablePagination
            component="div"
            count={totalEvents}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
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

export default ExtrinsicDetails; 
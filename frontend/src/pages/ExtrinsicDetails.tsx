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
  signature: {
    signer: {
      id: string;
    };
    signature: string;
    nonce: string;
  };
  args: Record<string, any>;
  info: {
    weight: {
      refTime: string;
      proofSize: string;
    };
    class: string;
    partialFee: string;
    kind: string;
  };
  era: {
    period: string;
    phase: string;
  };
  hash: string;
  tip: string;
  success: boolean;
  pays_fee: boolean;
  events: Array<{
    method: {
      pallet: string;
      method: string;
    };
    data: Record<string, any>;
  }>;
  index: string;
  block_number: string;
}

const ExtrinsicDetails: React.FC = () => {
  const { extrinsicId } = useParams<{ extrinsicId: string }>();
  const navigate = useNavigate();
  const [extrinsic, setExtrinsic] = useState<ExtrinsicDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchExtrinsic = async () => {
      if (!extrinsicId) return;
      setLoading(true);
      setError(null);
      try {
        const [blockNumber, index] = extrinsicId.split('-');
        const response = await api.get(`/blocks/${blockNumber}/extrinsics`, {
          params: {
            page: 1,
            page_size: 1,
            index: index
          }
        });
        if (response.data.extrinsics.length > 0) {
          setExtrinsic({
            ...response.data.extrinsics[0],
            block_number: blockNumber
          });
        } else {
          setError('Extrinsic not found');
        }
      } catch (err) {
        setError('Failed to fetch extrinsic details');
      } finally {
        setLoading(false);
      }
    };

    fetchExtrinsic();
  }, [extrinsicId]);

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(`${label} copied to clipboard`);
    setSnackbarOpen(true);
  };

  const formatHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
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
          to={`/block/${extrinsic.block_number}`}
          sx={{ ml: 2 }}
        >
          View Block #{extrinsic.block_number}
        </Link>
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
                  {formatHash(extrinsic.hash)}
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(extrinsic.hash, 'Hash')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Method
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {`${extrinsic.method.pallet}.${extrinsic.method.method}`}
              </TableCell>
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
                      onClick={() => handleCopyToClipboard(extrinsic.signature.signer.id, 'Signer')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Nonce
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {extrinsic.signature?.nonce || '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Era
              </TableCell>
              <TableCell>
                {extrinsic.era ? `Period: ${extrinsic.era.period}, Phase: ${extrinsic.era.phase}` : '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                Tip
              </TableCell>
              <TableCell>
                {extrinsic.tip || '-'}
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

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Arguments</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ 
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0
          }}>
            {JSON.stringify(extrinsic.args, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Weight</TableCell>
                  <TableCell>
                    RefTime: {extrinsic.info?.weight?.refTime || '-'}
                    <br />
                    ProofSize: {extrinsic.info?.weight?.proofSize || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>{extrinsic.info?.class || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Partial Fee</TableCell>
                  <TableCell>{extrinsic.info?.partialFee || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Kind</TableCell>
                  <TableCell>{extrinsic.info?.kind || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Events ({extrinsic.events.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pallet</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extrinsic.events.map((event, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{event.method.pallet}</TableCell>
                    <TableCell>{event.method.method}</TableCell>
                    <TableCell>
                      <pre style={{ 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0
                      }}>
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
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

export default ExtrinsicDetails; 
import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Paper, Link, Button, IconButton } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import SearchBar from './SearchBar';

// Declare the window.ENV type
declare global {
  interface Window {
    ENV?: {
      CHAIN?: string;
    };
  }
}

interface LayoutProps {
  children: React.ReactNode;
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, mode, onToggleTheme }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Get chain name from environment variable
  const chainName = window.ENV?.CHAIN || 'Polkadot';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Left section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              <Link component={RouterLink} to="/" color="inherit" underline="none">
                Dotlake Explorer
              </Link>
            </Typography>
          </Box>

          {/* Center section */}
          <Typography variant="h6" component="div">
            {chainName}
          </Typography>

          {/* Right section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/blocks"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Blocks
            </Button>
            <Button
              component={RouterLink}
              to="/extrinsics"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Extrinsics
            </Button>
            <Button
              component={RouterLink}
              to="/events"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Events
            </Button>
            <Button
              component={RouterLink}
              to="/account"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Account
            </Button>
            <IconButton onClick={onToggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <SearchBar size={isHomePage ? 'large' : 'small'} />
        </Paper>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Dotlake Explorer
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 
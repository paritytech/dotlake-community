import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Paper, Link, Button } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link component={RouterLink} to="/" color="inherit" underline="none">
              Dotlake Explorer
            </Link>
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
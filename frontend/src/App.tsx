import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { store } from './store';

// Components
import Layout from './components/Layout';
import Home from './pages/Home';
import BlockDetails from './pages/BlockDetails';
import Search from './pages/Search';
import ExtrinsicDetails from './pages/ExtrinsicDetails';
import Blocks from './pages/Blocks';
import Extrinsics from './pages/Extrinsics';
import Events from './pages/Events';
import Account from './pages/Account';

// Create theme function
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#E6007A', // Polkadot pink
    },
    secondary: {
      main: '#6C5CE7', // Polkadot purple
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1E1E1E' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout mode={mode} onToggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blocks" element={<Blocks />} />
              <Route path="/block/:blockNumber" element={<BlockDetails />} />
              <Route path="/extrinsics" element={<Extrinsics />} />
              <Route path="/extrinsic/:extrinsicId" element={<ExtrinsicDetails />} />
              <Route path="/events" element={<Events />} />
              <Route path="/search" element={<Search />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App; 
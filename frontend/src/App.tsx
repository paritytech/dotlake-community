import React from 'react';
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

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E6007A', // Polkadot pink
    },
    secondary: {
      main: '#6C5CE7', // Polkadot purple
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blocks" element={<Blocks />} />
              <Route path="/block/:blockNumber" element={<BlockDetails />} />
              <Route path="/extrinsics" element={<Extrinsics />} />
              <Route path="/extrinsic/:extrinsicId" element={<ExtrinsicDetails />} />
              <Route path="/events" element={<Events />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App; 
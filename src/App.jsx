import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Home from './pages/Home';

/**
 * Dark mode MUI theme — Apple-inspired minimalism.
 * Deep navy backgrounds, crisp typography, subtle borders.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#080810',
      paper: '#111120',
    },
    primary: {
      main: '#4f9cf9',
    },
    secondary: {
      main: '#3CB371',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    text: {
      primary: '#e8eaf6',
      secondary: '#8892a4',
      disabled: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h5: { fontWeight: 700, letterSpacing: '-0.5px' },
    h6: { fontWeight: 600, letterSpacing: '-0.3px' },
    subtitle1: { fontWeight: 600 },
    body2: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: '#333',
          borderRadius: 3,
        },
        body: {
          overscrollBehavior: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, minHeight: 48, fontSize: '0.875rem' },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundImage: 'none' } },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Home />
    </ThemeProvider>
  );
}



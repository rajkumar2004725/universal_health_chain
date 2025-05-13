import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import Dashboard from '@/pages/Dashboard';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#673ab7',
    },
  },
});

const Index = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dashboard />
      </ThemeProvider>
    </Provider>
  );
};

export default Index;

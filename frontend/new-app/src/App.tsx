import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { Alert } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { store } from './store';
import theme from './theme';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRedirect from './components/auth/AuthRedirect';
import { LoadingSpinner } from './components/common';
import { RootState } from './store';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Something went wrong. Please refresh the page.
        </Alert>
      );
    }
    return this.props.children;
  }
}

// Not Found Page
const NotFound: React.FC = () => (
  <MainLayout>
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  </MainLayout>
);

// Lazy load pages with chunk loading error handling
const Login = React.lazy(() => import('./pages/auth/Login').catch(() => ({ default: () => <div>Failed to load Login page</div> })));
const Register = React.lazy(() => import('./pages/auth/Register').catch(() => ({ default: () => <div>Failed to load Register page</div> })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').catch(() => ({ default: () => <div>Failed to load Dashboard</div> })));
const HealthRecords = React.lazy(() => import('./pages/HealthRecords').catch(() => ({ default: () => <div>Failed to load Health Records</div> })));
const ClinicalTrials = React.lazy(() => import('./pages/ClinicalTrials').catch(() => ({ default: () => <div>Failed to load Clinical Trials</div> })));
const Profile = React.lazy(() => import('./pages/Profile').catch(() => ({ default: () => <div>Failed to load Profile</div> })));

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <LoadingSpinner message="Loading..." />
  </div>
);

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
                    <ErrorBoundary>
                    <Router>
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                {/* Public routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />

                                {/* Protected routes */}
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <MainLayout>
                                                <ErrorBoundary>
                                                    <Dashboard />
                                                </ErrorBoundary>
                                            </MainLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/health-records"
                                    element={
                                        <ProtectedRoute>
                                            <MainLayout>
                                                <ErrorBoundary>
                                                    <HealthRecords />
                                                </ErrorBoundary>
                                            </MainLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/clinical-trials"
                                    element={
                                        <ProtectedRoute>
                                            <MainLayout>
                                                <ErrorBoundary>
                                                    <ClinicalTrials />
                                                </ErrorBoundary>
                                            </MainLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <MainLayout>
                                                <ErrorBoundary>
                                                    <Profile />
                                                </ErrorBoundary>
                                            </MainLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Redirect to dashboard if authenticated, otherwise to login */}
                                <Route path="/" element={<AuthRedirect />} />
                                
                                {/* 404 Route */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </Router>
                    </ErrorBoundary>
                </SnackbarProvider>
            </ThemeProvider>
        </Provider>
    );
};

export default App;

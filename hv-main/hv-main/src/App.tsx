import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './components/Router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { useNetworkStatus } from './hooks/useNetworkStatus';

function AppContent() {
  useNetworkStatus(); // Monitor network status globally
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppRouter />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
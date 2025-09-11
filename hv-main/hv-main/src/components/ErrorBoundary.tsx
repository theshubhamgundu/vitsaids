import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { showToast } from '../utils/toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Show toast notification
    showToast.error('An unexpected error occurred. Please try again.');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    showToast.info('Retrying...');
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In a real app, you would send this to your error reporting service
    console.log('Error report:', errorReport);
    showToast.success('Error report generated. Thank you for helping us improve!');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center">
                  We encountered an unexpected error. Don't worry, our team has been notified.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs mt-2 overflow-auto">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                
                <div className="space-y-2">
                  <Button 
                    onClick={this.handleRetry} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Home size={16} className="mr-2" />
                    Go to Homepage
                  </Button>
                  
                  <Button 
                    onClick={this.handleReportError} 
                    variant="ghost" 
                    className="w-full"
                  >
                    <Bug size={16} className="mr-2" />
                    Report This Issue
                  </Button>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>If the problem persists, please contact our support team.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
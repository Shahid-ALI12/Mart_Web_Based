// ============================================================
// MEGA MART — React Error Boundary Components
// Catches render errors and displays graceful fallback UI
// ============================================================

'use client';

import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ──────────────────────────────────────────────
// Error Info Interface
// ──────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback component */
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  /** Error boundary name for logging */
  name?: string;
  /** Show detailed error info (dev only) */
  showDetails?: boolean;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

// ──────────────────────────────────────────────
// Main Error Boundary
// ──────────────────────────────────────────────
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log error to console in production
    console.error(`[ErrorBoundary:${this.props.name || 'App'}]`, error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, you could send this to Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} reset={this.handleReset} />;
      }

      const isDev = process.env.NODE_ENV === 'development';
      const showDetails = this.props.showDetails ?? isDev;
      const errorCount = this.state.errorCount;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {this.props.name
                  ? `An error occurred in the ${this.props.name} section.`
                  : 'An unexpected error occurred while rendering this page.'}
                {errorCount > 1 && (
                  <span className="block mt-1 text-xs opacity-80">
                    This error has occurred {errorCount} times.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={this.handleReset} variant="default" size="sm" className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" size="sm" className="gap-1.5">
                <Home className="w-3.5 h-3.5" />
                Go Home
              </Button>
            </div>

            {/* Error details (dev mode or explicitly enabled) */}
            {showDetails && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Bug className="w-3.5 h-3.5" />
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-48">
                  <p className="font-semibold text-destructive mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p className="font-semibold mt-2 mb-1">Component Stack:</p>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ──────────────────────────────────────────────
// Lightweight Error Boundary (minimal UI)
// ──────────────────────────────────────────────
export class LightweightErrorBoundary extends Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[LightweightErrorBoundary:${this.props.name || 'Component'}]`, error);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-destructive" />
          <p>Failed to load{this.props.name ? ` ${this.props.name}` : ''}.</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-1"
          >
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ──────────────────────────────────────────────
// API Error Boundary (for data-fetching sections)
// ──────────────────────────────────────────────
interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  name?: string;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ApiErrorBoundary:${props.name || 'DataSection'}]`, error);
  }

  render() {
    if (this.state.hasError) {
      const isNetworkError =
        this.state.error?.message?.includes('fetch') ||
        this.state.error?.message?.includes('network') ||
        this.state.error?.message?.includes('Failed to');

      return (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">
            {isNetworkError ? 'Connection Error' : 'Data Loading Error'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : `Failed to load ${this.props.name || 'data'}. The error has been logged.`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isNetworkError ? 'Retry Connection' : 'Try Again'}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ──────────────────────────────────────────────
// Hook-based error boundary wrapper (for functional components)
// ──────────────────────────────────────────────
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    name?: string;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  } = {},
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary name={options.name || displayName} fallback={options.fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return ComponentWithErrorBoundary;
}

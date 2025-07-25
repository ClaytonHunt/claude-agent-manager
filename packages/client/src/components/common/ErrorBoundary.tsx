import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button, Card, CardContent } from './';
import { isDev } from '@/utils/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = async () => {
    if (!this.state.error) return;

    const errorText = [
      `Error: ${this.state.error.toString()}`,
      '',
      'Component Stack:',
      this.state.errorInfo?.componentStack || 'N/A',
      '',
      'Stack Trace:',
      this.state.error.stack || 'N/A'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-error-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                An unexpected error occurred. This has been logged and we'll look into it.
              </p>

              {isDev && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-100 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    Error Details
                    <button
                      onClick={this.handleCopyError}
                      className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy error to clipboard"
                    >
                      {this.state.copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </summary>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={this.handleReload}
                  className="flex-1"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
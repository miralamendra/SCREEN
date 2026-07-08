import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('hec_workspace_data');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-500 mb-4">
                The application encountered an unexpected error. This might be due to corrupted data in your browser.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-left overflow-auto max-h-32 mb-6">
                <code className="text-xs text-red-600 font-mono break-words">
                  {this.state.error?.message || 'Unknown error'}
                </code>
              </div>
              <button
                onClick={this.handleReset}
                className="w-full bg-black text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Clear Data & Reload App
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Warning: This will clear your unsaved local progress and reset to the demo data.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

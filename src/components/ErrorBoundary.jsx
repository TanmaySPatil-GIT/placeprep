import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by PlacePrep ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-mint-50 text-darkcharcoal-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-[32px] border border-warmborder text-center space-y-6 shadow-warm-md">
            <div className="w-14 h-14 rounded-full bg-[#FDF3F3] text-[#D32F2F] border border-[#F0C2C2] flex items-center justify-center mx-auto shadow-warm-sm">
              <AlertTriangle className="w-7 h-7 text-[#D32F2F]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold font-serif text-darkcharcoal-900">Something Went Wrong</h2>
              <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans">
                An unexpected exception occurred during session execution. Don't worry, your interview context and progress are preserved.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-2xl bg-[#FDF3F3] border border-[#F0C2C2] text-[11px] text-[#D32F2F] font-mono overflow-x-auto text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white text-xs font-extrabold shadow-warm-md hover:scale-105 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Reload Session</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-mint-100 hover:bg-mint-200 text-leaf-700 text-xs font-bold border border-warmborder transition-colors shadow-warm-sm"
              >
                <Home className="w-4 h-4 text-leaf-600" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

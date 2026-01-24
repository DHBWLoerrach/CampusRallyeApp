import React from 'react';

export type ErrorBoundaryFallbackProps = {
  error: Error;
  reset: () => void;
};

type Props = {
  children: React.ReactNode;
  fallback: (props: ErrorBoundaryFallbackProps) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback({ error, reset: this.reset });
    }
    return this.props.children;
  }
}

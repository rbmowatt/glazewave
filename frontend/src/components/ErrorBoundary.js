import React, { Component } from 'react';

// Without a boundary, an error thrown anywhere in the tree unmounts the whole
// app and the user sees a blank page with no indication anything went wrong.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback || (
          <div className="container">
            <p>Something went wrong loading this section.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

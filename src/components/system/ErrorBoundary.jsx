import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Render Crash Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'black', color: 'white', zIndex: 9999, padding: '2rem', overflow: 'auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'red', fontFamily: 'monospace' }}>Runtime Error</h1>
            <button onClick={this.handleReload} style={{ background: 'white', color: 'black', padding: '0.5rem 1rem', marginBottom: '1rem', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
                RELOAD APP
            </button>
            <hr style={{ margin: '1rem 0', borderColor: '#333' }} />
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#ffaaaa', fontSize: '14px', background: '#220000', padding: '1rem' }}>
                {this.state.error && this.state.error.toString()}
            </pre>
            <div style={{ marginTop: '1rem' }}>
                <h3 style={{ color: '#888', marginBottom: '0.5rem' }}>Stack Trace:</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#888', fontSize: '12px' }}>
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

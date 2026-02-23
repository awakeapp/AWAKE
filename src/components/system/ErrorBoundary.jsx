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
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: "sans-serif"
          }}
        >
          <h2>Something went wrong.</h2>
          <p>Please refresh the application.</p>
          <pre style={{textAlign: 'left', background: '#f8d7da', color: '#721c24', padding: '10px', overflowX: 'auto'}}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={this.handleReload} style={{marginTop: '20px'}}>
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

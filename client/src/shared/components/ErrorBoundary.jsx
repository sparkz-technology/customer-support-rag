import { Component } from 'react';
import { Button } from 'antd';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
      return;
    }
    console.error('UI error boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, title, description } = this.props;

    if (!hasError) return children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f0f',
        color: '#e5e5e5',
        padding: '32px',
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          background: '#1a1a1a',
          border: '1px solid #303030',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {title || 'Something went wrong'}
          </div>
          <div style={{ color: '#a3a3a3', marginBottom: '16px', lineHeight: 1.5 }}>
            {description || 'Please try reloading the app. If the issue persists, contact support.'}
          </div>
          {error?.message ? (
            <div style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '12px',
              color: '#fca5a5',
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              wordBreak: 'break-word',
            }}>
              {error.message}
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="primary" onClick={this.handleReset}>
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

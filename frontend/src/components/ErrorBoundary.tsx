import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div className="card" style={{ maxWidth: '500px', padding: '3rem 2rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            padding: '1rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--danger-bg)',
                            marginBottom: '1.5rem',
                            color: 'var(--danger)'
                        }}>
                            <AlertOctagon size={48} />
                        </div>

                        <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            Something went wrong
                        </h1>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            We encountered an unexpected error. Our team has been notified.
                            Please try refreshing the page.
                        </p>

                        {this.state.error && (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem',
                                overflowX: 'auto',
                                fontFamily: 'monospace'
                            }}>
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <RefreshCcw size={18} style={{ marginRight: '0.5rem' }} />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

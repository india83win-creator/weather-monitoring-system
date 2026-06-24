import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught a React rendering error:', error, info);
  }

  // Self-healing: clears all caches, localStorage, and service workers, then reloads
  handleReset = async () => {
    try {
      // 1. Clear all Service Worker caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        console.log('[ErrorBoundary] All SW caches cleared.');
      }

      // 2. Unregister all Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log('[ErrorBoundary] All Service Workers unregistered.');
      }

      // 3. Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn('[ErrorBoundary] Cleanup error (non-fatal):', err);
    }

    // 4. Hard reload to bypass any in-memory cache
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '48px 40px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
              }}
            >
              ⚡
            </div>

            <h1
              style={{
                color: '#f1f5f9',
                fontSize: '22px',
                fontWeight: 800,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: '0 0 32px',
              }}
            >
              AeroCast hit an unexpected error. This is usually caused by a stale
              cache after an update. Tap the button below to clear the cache and
              reload — it fixes the issue instantly.
            </p>

            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 32px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                letterSpacing: '0.01em',
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.opacity = '0.85')}
              onMouseOut={(e) => (e.target.style.opacity = '1')}
            >
              🔄 Clear Cache &amp; Reload
            </button>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <details
                style={{
                  marginTop: '20px',
                  textAlign: 'left',
                  color: '#64748b',
                  fontSize: '11px',
                }}
              >
                <summary
                  style={{ cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#f87171',
                    fontSize: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

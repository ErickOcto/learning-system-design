export default function App() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <main className="container" style={{ maxWidth: '800px' }}>
        <div className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <header style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="status-badge status-badge--info">
                <span className="status-dot"></span>
                Scaffold Online
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                v0.1.0-alpha
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', letterSpacing: '-0.02em', color: 'var(--color-accent-primary)' }}>
              Interactive System Design Lab
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Technical Blueprint &amp; Design System Verification
            </p>
          </header>

          {/* Verification Cards */}
          <section style={{ display: 'grid', gap: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
              System Verification Checklist
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Check 1: React Boots */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', display: 'block' }}>1. React Framework</strong>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    React 18 + Vite + TS successfully initialized
                  </span>
                </div>
                <span className="status-badge status-badge--healthy">
                  <span className="status-dot"></span>
                  Active
                </span>
              </div>

              {/* Check 2: Typography */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', display: 'block' }}>2. Self-Hosted / Web Fonts</strong>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', marginRight: '1rem' }}>Heading (Space Grotesk)</span>
                    <span style={{ fontFamily: 'var(--font-body)', marginRight: '1rem' }}>Body (Inter)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>Mono (JetBrains Mono)</span>
                  </div>
                </div>
                <span className="status-badge status-badge--healthy">
                  <span className="status-dot"></span>
                  Loaded
                </span>
              </div>

              {/* Check 3: CSS Variables */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', display: 'block' }}>3. Functional Status Tokens</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span className="status-badge status-badge--healthy">
                      <span className="status-dot"></span>
                      Healthy
                    </span>
                    <span className="status-badge status-badge--warning">
                      <span className="status-dot"></span>
                      Degraded
                    </span>
                    <span className="status-badge status-badge--error">
                      <span className="status-dot"></span>
                      Down
                    </span>
                  </div>
                </div>
                <span className="status-badge status-badge--healthy">
                  <span className="status-dot"></span>
                  Accessible
                </span>
              </div>

              {/* Check 4: Canvas / Dot-Grid */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', display: 'block' }}>4. Blueprint Texture</strong>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    Dot-grid background texture rendering across viewport
                  </span>
                </div>
                <span className="status-badge status-badge--healthy">
                  <span className="status-dot"></span>
                  Rendering
                </span>
              </div>
            </div>
          </section>

          {/* Footer Info */}
          <footer
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border-subtle)',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>[SYS_DESIGN_LAB] INITIALIZED</span>
            <span>OUT_OF_SCOPE: ROUTING &amp; LOGIC</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

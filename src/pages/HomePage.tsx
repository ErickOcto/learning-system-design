import { Link } from 'react-router-dom';
import { CURRICULUM_GROUPS, VizType } from '../data/curriculum';
import { PlayCircle, BarChart2, FileText, ArrowRight, Layers } from 'lucide-react';

export default function HomePage() {
  const getVizIcon = (type: VizType) => {
    switch (type) {
      case 'simulation':
        return <PlayCircle size={14} style={{ color: 'var(--color-status-healthy)' }} />;
      case 'interactive':
        return <BarChart2 size={14} style={{ color: 'var(--color-status-warning)' }} />;
      case 'prose':
        return <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Welcome Card */}
      <div className="blueprint-card" style={{ background: 'linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(56, 189, 248, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="status-badge status-badge--info">
            <Layers size={12} />
            System Architecture Lab
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            ~28 Curriculum Routes Mapped
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Interactive System Design Curriculum
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)', maxWidth: '700px', lineHeight: 1.6 }}>
          Learn system design through parameter-driven interactive simulations, contrastive diagrams, and live telemetry feeds following roadmap.sh/system-design.
        </p>
      </div>

      {/* Curriculum Groups Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {CURRICULUM_GROUPS.map((group) => (
          <div key={group.id} className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem', color: 'var(--color-accent-primary)' }}>
              {group.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {group.routes.map((route) => (
                <Link
                  key={route.id}
                  to={route.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    textDecoration: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getVizIcon(route.vizType)}
                    <span style={{ fontWeight: 500 }}>{route.title}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

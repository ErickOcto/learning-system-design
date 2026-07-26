import { useLocation } from 'react-router-dom';
import { findRouteByPath, VizType } from '../data/curriculum';
import { PlayCircle, BarChart2, FileText, ArrowRight } from 'lucide-react';
import { useTopicStore } from '../store/useTopicStore';
import ResourceLibrary from '../components/resources/ResourceLibrary';

export default function TopicPlaceholderPage() {
  const location = useLocation();
  const route = findRouteByPath(location.pathname);
  const topicStore = useTopicStore();

  if (!route) {
    return (
      <div className="blueprint-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ color: 'var(--color-status-error)', marginBottom: '0.5rem' }}>404 — Topic Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          The requested route <code>{location.pathname}</code> does not exist in the curriculum map.
        </p>
      </div>
    );
  }

  const topicRecord = topicStore.getTopicRecord(route.id);

  const getVizBadge = (type: VizType) => {
    switch (type) {
      case 'simulation':
        return (
          <span className="status-badge status-badge--healthy">
            <PlayCircle size={12} />
            Full Particle Simulation (🎯)
          </span>
        );
      case 'interactive':
        return (
          <span className="status-badge status-badge--warning">
            <BarChart2 size={12} />
            Interactive Diagram (📊)
          </span>
        );
      case 'prose':
        return (
          <span className="status-badge status-badge--info">
            <FileText size={12} />
            Conceptual Overview (📝)
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Route Header Card */}
      <div className="blueprint-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {getVizBadge(route.vizType)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            ROUTE: {route.path}
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          {route.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          {route.description}
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          <span>Topics Covered: <strong style={{ color: 'var(--color-text-primary)' }}>{route.topicsCovered}</strong></span>
          <span>Status: <strong style={{ color: 'var(--color-status-healthy)' }}>{topicRecord.status}</strong></span>
        </div>
      </div>

      {/* Content Area Slot Placeholder */}
      <div
        className="blueprint-card"
        style={{
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--color-border-subtle)',
          backgroundColor: 'rgba(17, 24, 39, 0.4)',
          textAlign: 'center',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent-glow)',
            border: '1px solid var(--color-accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent-primary)',
          }}
        >
          <ArrowRight size={24} />
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.25rem' }}>
            {route.title} Content Area
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', fontSize: 'var(--font-size-sm)' }}>
            App Shell &amp; Route Navigation verified! Visualization canvas modules will mount here.
          </p>
        </div>
      </div>

      {/* § 6 Resource Library */}
      <ResourceLibrary topicId={route.id} />
    </div>
  );
}

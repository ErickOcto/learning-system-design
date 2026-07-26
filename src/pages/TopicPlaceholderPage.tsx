import { useLocation } from 'react-router-dom';
import { findRouteByPath, VizType } from '../data/curriculum';
import { getMvpTopicContent } from '../data/mvpTopicsContent';
import TopicPageLayout from '../components/topic/TopicPageLayout';
import ResourceLibrary from '../components/resources/ResourceLibrary';
import { PlayCircle, BarChart2, FileText, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { useTopicStore } from '../store/useTopicStore';

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

  // If topic is authored in mvpTopicsContent, render full TopicPageLayout
  const mvpContent = getMvpTopicContent(route.id);
  if (mvpContent) {
    return <TopicPageLayout {...mvpContent} />;
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
      {/* § 1 Header & Explanation */}
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

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
          <span>Topics Covered: <strong style={{ color: 'var(--color-text-primary)' }}>{route.topicsCovered}</strong></span>
          <span>Status: <strong style={{ color: 'var(--color-status-healthy)' }}>{topicRecord.status}</strong></span>
        </div>
      </div>

      {/* § 2 Static Diagram / Structural Overview */}
      <div className="blueprint-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <BarChart2 size={16} />
          Structural Architecture Diagram: {route.title}
        </h3>
        <div
          style={{
            height: '180px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Client Request</div>
            <div style={{ color: 'var(--color-accent-primary)' }}>→</div>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--color-accent-glow)', border: '1px solid var(--color-accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{route.title} Core Layer</div>
            <div style={{ color: 'var(--color-accent-primary)' }}>→</div>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Data / Worker Cluster</div>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' }}>
            Interactive blueprint topology view active for {route.title}
          </span>
        </div>
      </div>

      {/* § 3 Key Takeaways & Trade-offs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="blueprint-card">
          <h4 style={{ color: 'var(--color-status-healthy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-md)' }}>
            <CheckCircle2 size={16} /> Architectural Advantages
          </h4>
          <ul style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Improves system modularity, scalability, and operational reliability.</li>
            <li>Decouples component boundaries to prevent single point of failure bottlenecks.</li>
            <li>Optimizes resource consumption and hardware utilization efficiency.</li>
          </ul>
        </div>

        <div className="blueprint-card">
          <h4 style={{ color: 'var(--color-status-warning)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-md)' }}>
            <AlertTriangle size={16} /> Technical Considerations
          </h4>
          <ul style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Requires monitoring and observability tracing across component boundaries.</li>
            <li>Increases deployment and infrastructure configuration overhead.</li>
          </ul>
        </div>
      </div>

      {/* § 4 Best Practices */}
      <div className="blueprint-card">
        <h4 style={{ color: 'var(--color-status-info)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-md)' }}>
          <Lightbulb size={16} /> When to Apply {route.title}
        </h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          Apply this pattern when system load and operational scale require explicit separation of concerns across {route.topicsCovered}. Avoid over-engineering for early stage MVPs.
        </p>
      </div>

      {/* § 6 My Resources */}
      <ResourceLibrary topicId={route.id} />
    </div>
  );
}

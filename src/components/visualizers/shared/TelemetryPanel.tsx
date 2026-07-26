import { TelemetryMetric } from '../../../types/visualizer';
import { Activity } from 'lucide-react';

export interface TelemetryPanelProps {
  metrics: TelemetryMetric[];
}

export default function TelemetryPanel({ metrics }: TelemetryPanelProps) {
  const getBadgeClass = (status?: 'healthy' | 'warning' | 'error' | 'neutral') => {
    switch (status) {
      case 'healthy':
        return 'status-badge--healthy';
      case 'warning':
        return 'status-badge--warning';
      case 'error':
        return 'status-badge--error';
      default:
        return 'status-badge--info';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        padding: '0.6rem 1rem',
        fontSize: 'var(--font-size-xs)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border-subtle)', paddingRight: '0.75rem' }}>
        <Activity size={14} style={{ color: 'var(--color-accent-primary)' }} />
        <span>TELEMETRY</span>
      </div>

      {metrics.length === 0 ? (
        <span style={{ color: 'var(--color-text-muted)' }}>No active metrics</span>
      ) : (
        metrics.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{m.label}:</span>
            <span className={`status-badge ${getBadgeClass(m.status)}`} style={{ padding: '1px 6px' }}>
              {m.value} {m.unit || ''}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

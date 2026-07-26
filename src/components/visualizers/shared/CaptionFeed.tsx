import { useRef, useEffect } from 'react';
import { CaptionEntry } from '../../../types/visualizer';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';

export interface CaptionFeedProps {
  captions: CaptionEntry[];
  maxEntries?: number;
}

export default function CaptionFeed({ captions, maxEntries = 30 }: CaptionFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleCaptions = captions.slice(-maxEntries);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions]);

  const getSeverityIcon = (severity?: 'info' | 'warning' | 'error') => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={13} style={{ color: 'var(--color-status-error)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={13} style={{ color: 'var(--color-status-warning)', flexShrink: 0 }} />;
      default:
        return <Info size={13} style={{ color: 'var(--color-status-healthy)', flexShrink: 0 }} />;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: '100px',
        overflowY: 'auto',
        backgroundColor: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-subtle)',
        borderTop: 'none',
        padding: '0.5rem 0.75rem',
        fontSize: 'var(--font-size-xs)',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      {visibleCaptions.length === 0 ? (
        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          💬 Live simulation event caption feed...
        </span>
      ) : (
        visibleCaptions.map((entry) => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.4 }}>
            {getSeverityIcon(entry.severity)}
            <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
              [{new Date(entry.timestamp).toLocaleTimeString()}]
            </span>
            <span style={{ color: 'var(--color-text-primary)' }}>{entry.text}</span>
          </div>
        ))
      )}
    </div>
  );
}

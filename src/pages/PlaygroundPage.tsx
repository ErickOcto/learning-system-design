import { ReactFlowProvider } from '@xyflow/react';
import PlaygroundPalette from '../components/playground/PlaygroundPalette';
import PlaygroundCanvas from '../components/playground/PlaygroundCanvas';
import PlaygroundControlsBar from '../components/playground/PlaygroundControlsBar';
import { Cpu } from 'lucide-react';

export default function PlaygroundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        width: '100%',
        backgroundColor: 'var(--color-bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          height: '44px',
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-md)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={18} style={{ color: 'var(--color-accent-primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            Architecture Playground
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-glow)',
              color: 'var(--color-accent-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            Simulation Engine v1
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <PlaygroundControlsBar />

      {/* Main Canvas Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PlaygroundPalette />
        <ReactFlowProvider>
          <PlaygroundCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

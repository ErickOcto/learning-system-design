import { usePlaygroundSimulationStore } from './engine/usePlaygroundSimulationStore';
import { Play, Pause, RotateCcw, Activity, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PlaygroundControlsBar() {
  const isPlaying = usePlaygroundSimulationStore((s) => s.isPlaying);
  const speedMultiplier = usePlaygroundSimulationStore((s) => s.speedMultiplier);
  const packets = usePlaygroundSimulationStore((s) => s.packets);
  const totalEmitted = usePlaygroundSimulationStore((s) => s.totalEmitted);
  const totalProcessed = usePlaygroundSimulationStore((s) => s.totalProcessed);
  const totalDropped = usePlaygroundSimulationStore((s) => s.totalDropped);

  const togglePlay = usePlaygroundSimulationStore((s) => s.togglePlay);
  const setSpeed = usePlaygroundSimulationStore((s) => s.setSpeed);
  const resetSimulation = usePlaygroundSimulationStore((s) => s.resetSimulation);

  return (
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
        gap: '1rem',
      }}
    >
      {/* Play / Pause / Reset controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={togglePlay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isPlaying
              ? 'var(--color-status-warning-bg)'
              : 'var(--color-status-healthy-bg)',
            border: `1px solid ${
              isPlaying
                ? 'var(--color-status-warning-border)'
                : 'var(--color-status-healthy-border)'
            }`,
            color: isPlaying
              ? 'var(--color-status-warning)'
              : 'var(--color-status-healthy)',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : 'Run Simulation'}
        </button>

        <button
          onClick={resetSimulation}
          title="Reset Simulation"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.35rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
        </button>

        {/* Speed selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--color-bg-base)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {[0.5, 1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeed(spd)}
              style={{
                background:
                  speedMultiplier === spd ? 'var(--color-bg-elevated)' : 'transparent',
                border: 'none',
                color:
                  speedMultiplier === spd
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-muted)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Metrics Readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Activity size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            In-Flight:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-primary)' }}>
            {packets.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowUpRight size={13} style={{ color: 'var(--color-status-info)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Emitted:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {totalEmitted}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Processed:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-status-healthy)' }}>
            {totalProcessed}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlertTriangle size={13} style={{ color: 'var(--color-status-error)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Dropped:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: totalDropped > 0 ? 'var(--color-status-error)' : 'var(--color-text-muted)' }}>
            {totalDropped}
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ControlsBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  children?: React.ReactNode; // Custom simulation parameters slot
  advancedControls?: React.ReactNode; // Expander slot
}

export default function ControlsBar({
  isPlaying,
  onTogglePlay,
  onReset,
  speed = 1,
  onSpeedChange,
  children,
  advancedControls,
}: ControlsBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        backgroundColor: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        padding: '0.75rem 1rem',
      }}
    >
      {/* Primary Control Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Play/Pause/Reset & Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onTogglePlay}
            className={`status-badge ${isPlaying ? 'status-badge--healthy' : 'status-badge--info'}`}
            style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', border: '1px solid var(--color-border-subtle)' }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {onReset && (
            <button
              onClick={onReset}
              className="status-badge status-badge--info"
              style={{ cursor: 'pointer', padding: '0.4rem 0.6rem', border: '1px solid var(--color-border-subtle)' }}
              title="Reset Simulation"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {onSpeedChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                SPEED:
              </span>
              {[0.5, 1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  style={{
                    backgroundColor: speed === s ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                    color: speed === s ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 6px',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    fontWeight: speed === s ? 600 : 400,
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Parameter Controls Slot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {children}

          {advancedControls && (
            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent-primary)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {showAdvanced ? 'Hide Dials' : 'More Controls'}
              {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Controls Expander Panel */}
      {showAdvanced && advancedControls && (
        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {advancedControls}
        </div>
      )}
    </div>
  );
}

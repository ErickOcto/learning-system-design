import React, { useEffect } from 'react';
import ControlsBar, { ControlsBarProps } from './ControlsBar';
import CaptionFeed from './CaptionFeed';
import TelemetryPanel from './TelemetryPanel';
import { CaptionEntry, TelemetryMetric } from '../../../types/visualizer';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

export interface VisualizationContainerProps extends ControlsBarProps {
  captions?: CaptionEntry[];
  metrics?: TelemetryMetric[];
  children?: React.ReactNode;
  canvasSlot?: React.ReactNode;
}

export default function VisualizationContainer({
  isPlaying,
  onTogglePlay,
  onReset,
  speed = 1,
  onSpeedChange,
  children,
  canvasSlot,
  advancedControls,
  captions = [],
  metrics = [],
}: VisualizationContainerProps) {
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>();

  // Auto pause if visualization scrolls off-screen
  useEffect(() => {
    if (!isVisible && isPlaying) {
      onTogglePlay();
    }
  }, [isVisible, isPlaying, onTogglePlay]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Controls Bar Strip */}
      <ControlsBar
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        speed={speed}
        onSpeedChange={onSpeedChange}
        advancedControls={advancedControls}
      >
        {children}
      </ControlsBar>

      {/* Main Simulation Canvas Slot */}
      <div
        style={{
          minHeight: '260px',
          backgroundColor: 'var(--color-bg-surface)',
          borderLeft: '1px solid var(--color-border-subtle)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {canvasSlot || (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            [CANVAS_SLOT]
          </span>
        )}
      </div>

      {/* Synced Caption Feed */}
      <CaptionFeed captions={captions} />

      {/* Telemetry Metric Readouts Panel */}
      <TelemetryPanel metrics={metrics} />
    </div>
  );
}

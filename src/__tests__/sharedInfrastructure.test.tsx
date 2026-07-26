// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useAnimationLoop } from '../hooks/useAnimationLoop';
import VisualizationContainer from '../components/visualizers/shared/VisualizationContainer';

describe('Shared Visualization Infrastructure', () => {
  beforeEach(() => {
    cleanup();
  });

  it('useAnimationLoop controls animation loop ticks and play/pause', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useAnimationLoop({ isPlaying: false, onTick }));

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('mounts ControlsBar, Canvas slot, CaptionFeed, and TelemetryPanel', () => {
    const onTogglePlay = vi.fn();

    render(
      <VisualizationContainer
        isPlaying={true}
        onTogglePlay={onTogglePlay}
        captions={[
          { id: '1', timestamp: Date.now(), text: 'Routed request #1 to Server 2', severity: 'info' },
        ]}
        metrics={[
          { id: 'm1', label: 'RPS', value: 45, unit: 'req/s', status: 'healthy' },
        ]}
        canvasSlot={<div data-testid="test-canvas">Canvas Active</div>}
      />
    );

    // ControlsBar renders
    expect(screen.getByText('Pause')).toBeDefined();

    // Canvas slot renders
    expect(screen.getByTestId('test-canvas')).toBeDefined();

    // CaptionFeed renders
    expect(screen.getByText('Routed request #1 to Server 2')).toBeDefined();

    // TelemetryPanel renders
    expect(screen.getByText('RPS:')).toBeDefined();
    expect(screen.getByText('45 req/s')).toBeDefined();

    // Pause click triggers onTogglePlay
    fireEvent.click(screen.getByText('Pause'));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });
});

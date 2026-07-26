// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import ScalingVisualizer from '../components/visualizers/ScalingVisualizer';

describe('ScalingVisualizer (Flagship §7.2)', () => {
  beforeEach(() => {
    cleanup();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      roundRect: vi.fn(),
      setLineDash: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    cleanup();
  });

  it('renders dual-panel controls, canvas, and telemetry metrics', () => {
    render(<ScalingVisualizer />);

    // Shared Traffic Load slider label
    expect(screen.getByText('SHARED TRAFFIC LOAD:')).toBeDefined();

    // Telemetry readouts
    expect(screen.getByText('SHARED LOAD:')).toBeDefined();
    expect(screen.getByText('VERT CPU:')).toBeDefined();
    expect(screen.getByText('HORIZ NODES:')).toBeDefined();
  });

  it('allows scaling up vertical machine hardware', () => {
    render(<ScalingVisualizer />);

    // Expand controls
    fireEvent.click(screen.getByText('More Controls'));

    const upgradeBtn = screen.getByText(/Scale Up Vertical Machine/i);
    fireEvent.click(upgradeBtn);

    // Upgraded from Medium (2 vCPU) to Large (4 vCPU)
    expect(screen.getByText(/Scale Up Vertical Machine \(8 vCPU\)/i)).toBeDefined();
  });

  it('allows toggling auto-scaler mode', () => {
    render(<ScalingVisualizer />);

    // Expand controls
    fireEvent.click(screen.getByText('More Controls'));

    const autoScaleBtn = screen.getByText('ON (Auto Pool)');
    fireEvent.click(autoScaleBtn);

    expect(screen.getByText('OFF (Fixed Pool)')).toBeDefined();
  });
});

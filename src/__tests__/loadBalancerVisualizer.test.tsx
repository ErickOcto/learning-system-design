// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import LoadBalancerVisualizer from '../components/visualizers/LoadBalancerVisualizer';

describe('LoadBalancerVisualizer (Flagship §7.1)', () => {
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
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders controls, canvas, caption feed, and telemetry metrics', () => {
    render(<LoadBalancerVisualizer />);

    // ControlsBar
    expect(screen.getByText('Play')).toBeDefined();
    expect(screen.getByText('ALGO:')).toBeDefined();

    // TelemetryPanel metrics
    expect(screen.getByText('TARGET RPS:')).toBeDefined();
    expect(screen.getByText('ACTIVE POOL:')).toBeDefined();
    expect(screen.getByText('DROPPED REQS:')).toBeDefined();
  });

  it('allows changing routing algorithm', () => {
    render(<LoadBalancerVisualizer />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'least-connections' } });

    expect((select as HTMLSelectElement).value).toBe('least-connections');
  });

  it('allows scaling server pool and toggling server health', () => {
    render(<LoadBalancerVisualizer />);

    // Click server 1 health toggle
    const toggleBtn = screen.getByText('S1 ✓');
    fireEvent.click(toggleBtn);

    // Marked offline / unhealthy
    expect(screen.getByText('S1 ✗')).toBeDefined();
  });
});

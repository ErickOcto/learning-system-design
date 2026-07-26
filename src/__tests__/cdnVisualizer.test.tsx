// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CdnVisualizer from '../components/visualizers/CdnVisualizer';

describe('CdnVisualizer (Catalog Viz #2)', () => {
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
      setLineDash: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 20 }),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders CDN mode selector and initial telemetry readouts', () => {
    render(<CdnVisualizer />);

    expect(screen.getByText('CDN MODE:')).toBeDefined();
    expect(screen.getByText(/AVG LATENCY RTT/i)).toBeDefined();
    expect(screen.getByText(/ORIGIN LOAD/i)).toBeDefined();
    expect(screen.getByText(/BANDWIDTH SAVED/i)).toBeDefined();
  });

  it('switches between CDN modes correctly', () => {
    render(<CdnVisualizer />);

    const select = screen.getByDisplayValue('Pull CDN (Lazy Cold Start)');
    fireEvent.change(select, { target: { value: 'no_cdn' } });

    expect(screen.getByDisplayValue('No CDN (Direct to Origin)')).toBeDefined();
  });

  it('renders Region selector, TTL slider, and invalidation button in Pull CDN mode', () => {
    render(<CdnVisualizer />);

    expect(screen.getByText('CLIENT REGION:')).toBeDefined();
    expect(screen.getByText('TTL:')).toBeDefined();
    expect(screen.getByText('Invalidate Edge Caches')).toBeDefined();
  });

  it('allows invalidating edge caches via button click', () => {
    render(<CdnVisualizer />);

    const invalidateBtn = screen.getByText('Invalidate Edge Caches');
    fireEvent.click(invalidateBtn);

    // Caption feed logs invalidation event
    expect(screen.getByText(/Cache invalidated! Next requests will trigger Origin fetches/i)).toBeDefined();
  });
});

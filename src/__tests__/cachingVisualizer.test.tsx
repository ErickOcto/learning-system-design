// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import CachingVisualizer from '../components/visualizers/CachingVisualizer';

describe('CachingVisualizer (Catalog #1)', () => {
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

  it('renders controls, canvas grid, and telemetry metrics', () => {
    render(<CachingVisualizer />);

    // Eviction Policy selector
    expect(screen.getByText('EVICTION POLICY:')).toBeDefined();

    // Telemetry readouts
    expect(screen.getByText('CACHE HIT RATE:')).toBeDefined();
    expect(screen.getByText('MEMORY LOAD:')).toBeDefined();
  });

  it('allows requesting key and updating cache hit/miss stats', async () => {
    render(<CachingVisualizer />);

    // Click Get K1
    const getK1Btn = screen.getByText('Get K1');
    fireEvent.click(getK1Btn);

    // Initial request is a MISS (0H / 1M)
    expect(screen.getByText(/0H \/ 1M/i)).toBeDefined();
  });

  it('allows changing eviction policy', () => {
    render(<CachingVisualizer />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'LFU' } });

    expect((select as HTMLSelectElement).value).toBe('LFU');
  });
});

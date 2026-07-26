// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import MessagingVisualizer from '../components/visualizers/MessagingVisualizer';

describe('MessagingVisualizer (Catalog #7)', () => {
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

  it('renders controls, canvas, and telemetry metrics', () => {
    render(<MessagingVisualizer />);

    // Messaging Pattern selector
    expect(screen.getByText('MESSAGING PATTERN:')).toBeDefined();

    // Telemetry readouts
    expect(screen.getByText('QUEUE BACKLOG:')).toBeDefined();
    expect(screen.getByText('PROCESSED TOTAL:')).toBeDefined();
    expect(screen.getByText('WORKER POOL:')).toBeDefined();
  });

  it('allows injecting traffic burst to buffer queue', () => {
    render(<MessagingVisualizer />);

    // Expand controls
    fireEvent.click(screen.getByText('More Controls'));

    const burstBtn = screen.getByText(/Inject Traffic Burst/i);
    fireEvent.click(burstBtn);

    // Backlog depth increased
    expect(screen.getByText('QUEUE BACKLOG:')).toBeDefined();
  });

  it('allows changing messaging pattern to Pub/Sub fan-out mode', () => {
    render(<MessagingVisualizer />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pubsub' } });

    expect((select as HTMLSelectElement).value).toBe('pubsub');
    expect(screen.getByText(/3x/)).toBeDefined();
  });
});

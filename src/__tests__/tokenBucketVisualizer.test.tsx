// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TokenBucketVisualizer from '../components/visualizers/TokenBucketVisualizer';

describe('TokenBucketVisualizer (Catalog Viz #9)', () => {
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
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 20 }),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders controls, sliders, and initial telemetry readouts', () => {
    render(<TokenBucketVisualizer />);

    expect(screen.getByText('Send Request')).toBeDefined();
    expect(screen.getByText('Burst 20 Requests')).toBeDefined();
    expect(screen.getByText(/^AVAILABLE TOKENS/i)).toBeDefined();
    expect(screen.getByText(/^ACCEPTED \(200 OK\)/i)).toBeDefined();
    expect(screen.getByText(/^REJECTED \(429\)/i)).toBeDefined();
    expect(screen.getByText(/^THROTTLE RATE/i)).toBeDefined();
  });

  it('handles Send Request button click', () => {
    render(<TokenBucketVisualizer />);

    const sendBtn = screen.getByText('Send Request');
    fireEvent.click(sendBtn);

    // Caption feed logs 200 OK request
    expect(screen.getByText(/200 OK: Token consumed from bucket/i)).toBeDefined();
  });

  it('handles Burst 20 Requests button click and triggers rate limiting', () => {
    render(<TokenBucketVisualizer />);

    const burstBtn = screen.getByText('Burst 20 Requests');
    fireEvent.click(burstBtn);

    // Caption feed logs burst & throttling event
    expect(screen.getByText(/BURST INJECTED: Dispatched 20 rapid requests/i)).toBeDefined();
  });
});

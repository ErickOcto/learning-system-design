// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import DnsVisualizer from '../components/visualizers/DnsVisualizer';

describe('DnsVisualizer (Catalog Viz #13)', () => {
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

  it('renders controls, input domain, and initial telemetry readouts', () => {
    render(<DnsVisualizer />);

    expect(screen.getByText('Resolve DNS')).toBeDefined();
    expect(screen.getByText('Flush Caches')).toBeDefined();
    expect(screen.getByDisplayValue('example.com')).toBeDefined();
    expect(screen.getByText(/^RESOLVED IP/i)).toBeDefined();
    expect(screen.getByText(/^DNS LATENCY/i)).toBeDefined();
    expect(screen.getByText(/^HOPS TRAVERSED/i)).toBeDefined();
    expect(screen.getByText(/^CACHE STATUS/i)).toBeDefined();
  });

  it('handles Resolve DNS button click', () => {
    render(<DnsVisualizer />);

    const resolveBtn = screen.getByText('Resolve DNS');
    fireEvent.click(resolveBtn);

    // Caption feed logs DNS resolution start
    expect(screen.getByText(/Initiating full recursive DNS lookup/i)).toBeDefined();
  });

  it('handles Flush Caches button click', () => {
    render(<DnsVisualizer />);

    const flushBtn = screen.getByText('Flush Caches');
    fireEvent.click(flushBtn);

    expect(screen.getByText(/DNS Caches flushed/i)).toBeDefined();
  });
});

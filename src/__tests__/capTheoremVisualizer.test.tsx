// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CapTheoremVisualizer from '../components/visualizers/CapTheoremVisualizer';

describe('CapTheoremVisualizer (Catalog Viz #5)', () => {
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

  it('renders CAP mode selector, partition toggle button, and initial telemetry readouts', () => {
    render(<CapTheoremVisualizer />);

    expect(screen.getByText('CAP MODE:')).toBeDefined();
    expect(screen.getByText(/SYSTEM STATE/i)).toBeDefined();
    expect(screen.getByText(/NODE A VERSION/i)).toBeDefined();
    expect(screen.getByText(/NODE B VERSION/i)).toBeDefined();
    expect(screen.getByText(/Sever Network Connection/i)).toBeDefined();
  });

  it('switches between CP and AP modes', () => {
    render(<CapTheoremVisualizer />);

    const select = screen.getByDisplayValue('CP (Consistency over Availability — Reject 503)');
    fireEvent.change(select, { target: { value: 'AP' } });

    expect(screen.getByDisplayValue('AP (Availability over Consistency — Serve Stale)')).toBeDefined();
  });

  it('handles Write to Node A and Read from Node B when healthy', () => {
    render(<CapTheoremVisualizer />);

    const writeBtn = screen.getByText('Write to Node A');
    fireEvent.click(writeBtn);

    expect(screen.getByText(/Write v2 committed to Node A/i)).toBeDefined();

    const readBtn = screen.getByText('Read from Node B');
    fireEvent.click(readBtn);

    expect(screen.getByText(/READ SUCCESS: Client read Node B/i)).toBeDefined();
  });

  it('handles CP mode + Partition read rejection (HTTP 503)', () => {
    render(<CapTheoremVisualizer />);

    // Sever partition
    const severBtn = screen.getByText('Sever Network Connection');
    fireEvent.click(severBtn);

    // Write Node A
    const writeBtn = screen.getByText('Write to Node A');
    fireEvent.click(writeBtn);

    // Read Node B in CP mode
    const readBtn = screen.getByText('Read from Node B');
    fireEvent.click(readBtn);

    // CP mode rejects read with HTTP 503
    expect(screen.getByText(/CP READ REJECTED: HTTP 503 Service Unavailable/i)).toBeDefined();
  });

  it('handles AP mode + Partition stale read', () => {
    render(<CapTheoremVisualizer />);

    // Switch to AP mode
    const select = screen.getByDisplayValue('CP (Consistency over Availability — Reject 503)');
    fireEvent.change(select, { target: { value: 'AP' } });

    // Sever partition
    const severBtn = screen.getByText('Sever Network Connection');
    fireEvent.click(severBtn);

    // Write Node A
    const writeBtn = screen.getByText('Write to Node A');
    fireEvent.click(writeBtn);

    // Read Node B in AP mode
    const readBtn = screen.getByText('Read from Node B');
    fireEvent.click(readBtn);

    // AP mode returns stale data
    expect(screen.getByText(/AP STALE READ: Client read Node B/i)).toBeDefined();
  });
});

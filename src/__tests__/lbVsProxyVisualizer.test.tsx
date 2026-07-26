// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LbVsProxyVisualizer from '../components/visualizers/LbVsProxyVisualizer';

describe('LbVsProxyVisualizer (Catalog Viz #10)', () => {
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

  it('renders role selector, feature checkboxes, and initial telemetry readouts', () => {
    render(<LbVsProxyVisualizer />);

    expect(screen.getByText('ROLE:')).toBeDefined();
    expect(screen.getByText('TLS Offloading')).toBeDefined();
    expect(screen.getByText('IP Topology Masking')).toBeDefined();
    expect(screen.getByText('Dispatch Request')).toBeDefined();
    expect(screen.getByText(/^PRIMARY ROLE/i)).toBeDefined();
    expect(screen.getByText(/^TLS OFF-LOADING/i)).toBeDefined();
    expect(screen.getByText(/^TOPOLOGY MASKING/i)).toBeDefined();
  });

  it('switches between Reverse Proxy, Load Balancer, and Combined roles', () => {
    render(<LbVsProxyVisualizer />);

    const roleSelect = screen.getByDisplayValue('Reverse Proxy (Edge Protection)');
    fireEvent.change(roleSelect, { target: { value: 'load_balancer' } });

    expect(screen.getByDisplayValue('Load Balancer (Traffic Distribution)')).toBeDefined();
  });

  it('handles Dispatch Request button click', () => {
    render(<LbVsProxyVisualizer />);

    const dispatchBtn = screen.getByText('Dispatch Request');
    fireEvent.click(dispatchBtn);

    // Caption feed logs request event
    expect(screen.getByText(/Reverse Proxy processed request/i)).toBeDefined();
  });
});

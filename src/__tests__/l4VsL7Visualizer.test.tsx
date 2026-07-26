// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import L4VsL7Visualizer from '../components/visualizers/L4VsL7Visualizer';

describe('L4VsL7Visualizer (Catalog Viz #14)', () => {
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

  it('renders layer selector, path dropdown, and initial telemetry readouts', () => {
    render(<L4VsL7Visualizer />);

    expect(screen.getByText('LAYER:')).toBeDefined();
    expect(screen.getByText('URL PATH:')).toBeDefined();
    expect(screen.getByText('Dispatch Packet')).toBeDefined();
    expect(screen.getByText(/^ROUTING LAYER/i)).toBeDefined();
    expect(screen.getByText(/^PAYLOAD INSPECTION/i)).toBeDefined();
    expect(screen.getByText(/^ROUTED TARGET POOL/i)).toBeDefined();
  });

  it('switches between Layer 4 and Layer 7 routing modes', () => {
    render(<L4VsL7Visualizer />);

    const select = screen.getByDisplayValue('Layer 7 (HTTP Smart Content Router)');
    fireEvent.change(select, { target: { value: 'L4' } });

    expect(screen.getByDisplayValue('Layer 4 (TCP / IP:Port Transport)')).toBeDefined();
  });

  it('handles Dispatch Packet button click', () => {
    render(<L4VsL7Visualizer />);

    const dispatchBtn = screen.getByText('Dispatch Packet');
    fireEvent.click(dispatchBtn);

    // Caption feed logs L7 smart routing event
    expect(screen.getByText(/L7 SMART ROUTE: Matched URL Path/i)).toBeDefined();
  });
});

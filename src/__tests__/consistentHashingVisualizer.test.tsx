// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ConsistentHashingVisualizer from '../components/visualizers/ConsistentHashingVisualizer';

describe('ConsistentHashingVisualizer (Bonus Viz #1)', () => {
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

  it('renders node controls, key button, and initial telemetry readouts', () => {
    render(<ConsistentHashingVisualizer />);

    expect(screen.getByText('Add Key to Ring')).toBeDefined();
    expect(screen.getByText('Add Node')).toBeDefined();
    expect(screen.getByText('Remove Node')).toBeDefined();
    expect(screen.getByText(/^PHYSICAL NODES/i)).toBeDefined();
    expect(screen.getByText(/^VIRTUAL REPLICAS/i)).toBeDefined();
    expect(screen.getByText(/^TOTAL KEYS MAPPED/i)).toBeDefined();
  });

  it('handles Add Key button click', () => {
    render(<ConsistentHashingVisualizer />);

    const addKeyBtn = screen.getByText('Add Key to Ring');
    fireEvent.click(addKeyBtn);

    // Caption feed logs key mapping
    expect(screen.getByText(/mapped clockwise to/i)).toBeDefined();
  });

  it('handles Add Node button click', () => {
    render(<ConsistentHashingVisualizer />);

    const addNodeBtn = screen.getByText('Add Node');
    fireEvent.click(addNodeBtn);

    expect(screen.getByText(/Added Node D. Minimal Key Remapping/i)).toBeDefined();
  });
});

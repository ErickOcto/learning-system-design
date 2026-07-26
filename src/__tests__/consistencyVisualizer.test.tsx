// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ConsistencyVisualizer from '../components/visualizers/ConsistencyVisualizer';

describe('ConsistencyVisualizer (Catalog Viz #6)', () => {
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

  it('renders consistency level selector, controls, and initial telemetry readouts', () => {
    render(<ConsistencyVisualizer />);

    expect(screen.getByText('LEVEL:')).toBeDefined();
    expect(screen.getByText(/CONSISTENCY LEVEL/i)).toBeDefined();
    expect(screen.getByText(/WRITE LATENCY/i)).toBeDefined();
    expect(screen.getByText(/QUORUM FORMULA/i)).toBeDefined();
  });

  it('switches between Weak, Eventual, and Strong consistency levels', () => {
    render(<ConsistencyVisualizer />);

    const select = screen.getByDisplayValue('Eventual (Async Window)');
    fireEvent.change(select, { target: { value: 'strong' } });

    expect(screen.getByDisplayValue('Strong (Quorum W + R > N)')).toBeDefined();
    expect(screen.getByText('W:')).toBeDefined();
    expect(screen.getByText('R:')).toBeDefined();
  });

  it('handles Write Data button click in Eventual mode', () => {
    render(<ConsistencyVisualizer />);

    const writeBtn = screen.getByText('Write Data');
    fireEvent.click(writeBtn);

    expect(screen.getByText(/EVENTUAL WRITE: Leader updated to v2/i)).toBeDefined();
  });

  it('handles Read Data button click', () => {
    render(<ConsistencyVisualizer />);

    const readBtn = screen.getByText('Read Data');
    fireEvent.click(readBtn);

    expect(screen.getByText(/READ: Client queried Node/i)).toBeDefined();
  });
});

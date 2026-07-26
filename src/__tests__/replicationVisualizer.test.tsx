// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ReplicationVisualizer from '../components/visualizers/ReplicationVisualizer';

describe('ReplicationVisualizer (Catalog Viz #3)', () => {
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

  it('renders replication mode selector, controls, and initial telemetry readouts', () => {
    render(<ReplicationVisualizer />);

    expect(screen.getByText('REPLICATION MODE:')).toBeDefined();
    expect(screen.getByText(/REPLICATION LAG/i)).toBeDefined();
    expect(screen.getAllByText(/STALE READS/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/PRIMARY STATUS/i)).toBeDefined();
    expect(screen.getByText(/CONSENSUS STATE/i)).toBeDefined();
  });

  it('switches between Async and Sync replication modes', () => {
    render(<ReplicationVisualizer />);

    const select = screen.getByDisplayValue('Asynchronous (Fast Write, Stale Reads)');
    fireEvent.change(select, { target: { value: 'sync' } });

    expect(screen.getByDisplayValue('Synchronous (Strict Consistency, Slow Write)')).toBeDefined();
  });

  it('handles Write Data button click', () => {
    render(<ReplicationVisualizer />);

    const writeBtn = screen.getByText('Write Data to Primary');
    fireEvent.click(writeBtn);

    // Caption feed logs write event
    expect(screen.getByText(/Asynchronous Write v2 committed to Primary/i)).toBeDefined();
  });

  it('handles Read from Replica button click', () => {
    render(<ReplicationVisualizer />);

    const readBtn = screen.getByText('Read from Replica');
    fireEvent.click(readBtn);

    // Caption feed logs read event
    expect(screen.getByText(/READ! Client read Replica/i)).toBeDefined();
  });

  it('handles Primary Node Failure and consensus election', () => {
    render(<ReplicationVisualizer />);

    const killBtn = screen.getByText('Kill Primary Node');
    fireEvent.click(killBtn);

    // Caption feed logs failure & consensus state updates to ELECTION
    expect(screen.getByText(/CRITICAL: Primary DB node crashed! Initiating failover consensus election/i)).toBeDefined();
  });
});

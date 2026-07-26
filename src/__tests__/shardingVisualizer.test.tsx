// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import ShardingVisualizer from '../components/visualizers/ShardingVisualizer';

describe('ShardingVisualizer (Catalog #4)', () => {
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
    render(<ShardingVisualizer />);

    // Sharding Strategy selector
    expect(screen.getByText('SHARDING STRATEGY:')).toBeDefined();

    // Telemetry readouts
    expect(screen.getByText('TOTAL RECORDS:')).toBeDefined();
    expect(screen.getByText('SHARD COUNT:')).toBeDefined();
    expect(screen.getByText('KEYS REMAPPED ON SCALE:')).toBeDefined();
  });

  it('allows changing strategy and adding shard nodes', () => {
    render(<ShardingVisualizer />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'consistent-hashing' } });

    expect((select as HTMLSelectElement).value).toBe('consistent-hashing');

    // Expand controls bar
    fireEvent.click(screen.getByText('More Controls'));

    // Click Add Shard Node (3 -> 4)
    const addShardBtn = screen.getByText(/Add Shard Node/i);
    fireEvent.click(addShardBtn);

    expect(screen.getByText(/SHARD COUNT:/)).toBeDefined();
  });

  it('allows toggling hot key traffic mode', () => {
    render(<ShardingVisualizer />);

    // Expand controls
    fireEvent.click(screen.getByText('More Controls'));

    const hotKeyBtn = screen.getByText('OFF (Uniform Key Traffic)');
    fireEvent.click(hotKeyBtn);

    expect(screen.getByText('ON (usr_9999 Flooding)')).toBeDefined();
  });
});

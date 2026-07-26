// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LoadLevelingVisualizer from '../components/visualizers/LoadLevelingVisualizer';

describe('LoadLevelingVisualizer (Catalog Viz #8)', () => {
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

  it('renders burst traffic button, sliders, and initial telemetry readouts', () => {
    render(<LoadLevelingVisualizer />);

    expect(screen.getByText('Inject Traffic Burst (+500%)')).toBeDefined();
    expect(screen.getByText(/^UNPROTECTED DROPS/i)).toBeDefined();
    expect(screen.getByText(/^PROTECTED DROPS/i)).toBeDefined();
    expect(screen.getByText(/^UNPROTECTED DB CPU/i)).toBeDefined();
    expect(screen.getByText(/^QUEUE BUFFER FILL/i)).toBeDefined();
  });

  it('handles Traffic Burst injection and updates telemetry', () => {
    render(<LoadLevelingVisualizer />);

    const burstBtn = screen.getByText('Inject Traffic Burst (+500%)');
    fireEvent.click(burstBtn);

    // Caption feed logs burst event
    expect(screen.getByText(/TRAFFIC SPIKE \(\+500%\) INJECTED/i)).toBeDefined();
  });

  it('allows adjusting DB processing rate slider', () => {
    render(<LoadLevelingVisualizer />);

    const slider = screen.getByDisplayValue('3');
    fireEvent.change(slider, { target: { value: '6' } });

    expect(screen.getByText('6/s')).toBeDefined();
  });
});

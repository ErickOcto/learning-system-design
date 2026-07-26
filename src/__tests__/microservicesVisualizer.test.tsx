// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MicroservicesVisualizer from '../components/visualizers/MicroservicesVisualizer';

describe('MicroservicesVisualizer (Catalog Viz #12)', () => {
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

  it('renders failure injection buttons, dispatch control, and initial telemetry readouts', () => {
    render(<MicroservicesVisualizer />);

    expect(screen.getByText('Dispatch Traffic Batch')).toBeDefined();
    expect(screen.getByText(/User DB/i)).toBeDefined();
    expect(screen.getByText(/Payment/i)).toBeDefined();
    expect(screen.getByText(/^MONOLITH STATUS/i)).toBeDefined();
    expect(screen.getByText(/^MICROSERVICES STATUS/i)).toBeDefined();
    expect(screen.getByText(/^MONOLITH BLAST RADIUS/i)).toBeDefined();
    expect(screen.getByText(/^MICRO BLAST RADIUS/i)).toBeDefined();
  });

  it('handles User DB Failure Injection and demonstrates blast radius isolation difference', () => {
    render(<MicroservicesVisualizer />);

    const failUserBtn = screen.getByText(/User DB/i);
    fireEvent.click(failUserBtn);

    const dispatchBtn = screen.getByText('Dispatch Traffic Batch');
    fireEvent.click(dispatchBtn);

    // Caption feed logs total monolith crash vs isolated microservice degradation
    expect(screen.getByText(/MONOLITH: Process crashed! 4\/4 requests failed/i)).toBeDefined();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CircuitBreakerVisualizer from '../components/visualizers/CircuitBreakerVisualizer';

describe('CircuitBreakerVisualizer (Catalog Viz #11)', () => {
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

  it('renders controls, failure buttons, and initial telemetry readouts', () => {
    render(<CircuitBreakerVisualizer />);

    expect(screen.getByText('Dispatch Traffic Batch')).toBeDefined();
    expect(screen.getByText(/Recs/i)).toBeDefined();
    expect(screen.getByText('Bulkhead Thread Isolation')).toBeDefined();
    expect(screen.getByText(/^PAYMENT CIRCUIT/i)).toBeDefined();
    expect(screen.getByText(/^INVENTORY CIRCUIT/i)).toBeDefined();
    expect(screen.getByText(/^RECOMMENDATIONS/i)).toBeDefined();
    expect(screen.getByText(/^BULKHEAD ISOLATION/i)).toBeDefined();
  });

  it('handles Failure Injection and trips Circuit Breaker to OPEN', () => {
    render(<CircuitBreakerVisualizer />);

    const failRecsBtn = screen.getByText(/Recs/i);
    fireEvent.click(failRecsBtn);

    const dispatchBtn = screen.getByText('Dispatch Traffic Batch');
    // Dispatch multiple batches to cross failure threshold N=3
    fireEvent.click(dispatchBtn);
    fireEvent.click(dispatchBtn);
    fireEvent.click(dispatchBtn);

    // Caption feed logs circuit trip event
    expect(screen.getByText(/CIRCUIT TRIP! Recommendations Service accumulated/i)).toBeDefined();
  });

  it('toggles Bulkhead isolation state', () => {
    render(<CircuitBreakerVisualizer />);

    const bulkheadCheckbox = screen.getByLabelText('Bulkhead Thread Isolation');
    fireEvent.click(bulkheadCheckbox);

    expect(screen.getByText('DISABLED (SHARED RISK)')).toBeDefined();
  });
});

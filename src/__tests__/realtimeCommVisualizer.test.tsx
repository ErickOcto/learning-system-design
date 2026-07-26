// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RealtimeCommVisualizer from '../components/visualizers/RealtimeCommVisualizer';

describe('RealtimeCommVisualizer (Bonus Viz #2)', () => {
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

  it('renders protocol selector, event buttons, and initial telemetry readouts', () => {
    render(<RealtimeCommVisualizer />);

    expect(screen.getByText('PROTOCOL:')).toBeDefined();
    expect(screen.getByText('Emit Server Event')).toBeDefined();
    expect(screen.getByText('Send Client Message')).toBeDefined();
    expect(screen.getByText(/^PROTOCOL MODE/i)).toBeDefined();
    expect(screen.getByText(/^HTTP HANDSHAKES/i)).toBeDefined();
    expect(screen.getByText(/^HEADER OVERHEAD/i)).toBeDefined();
  });

  it('handles Emit Server Event button click', () => {
    render(<RealtimeCommVisualizer />);

    const emitBtn = screen.getByText('Emit Server Event');
    fireEvent.click(emitBtn);

    expect(screen.getByText(/SERVER EVENT: Pushed data stream frame/i)).toBeDefined();
  });

  it('handles Send Client Message button click', () => {
    render(<RealtimeCommVisualizer />);

    const sendBtn = screen.getByText('Send Client Message');
    fireEvent.click(sendBtn);

    expect(screen.getByText(/CLIENT MESSAGE: Sent message to server/i)).toBeDefined();
  });
});

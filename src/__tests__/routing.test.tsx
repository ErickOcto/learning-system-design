// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App';
import { ALL_CURRICULUM_ROUTES } from '../data/curriculum';

describe('Core App Layout & Routing', () => {
  beforeEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
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

  it('renders Header, Sidebar, and HomePage on initial load', () => {
    render(<App />);

    // Header logo text
    expect(screen.getAllByText(/System Design/i).length).toBeGreaterThan(0);

    // Sidebar curriculum header
    expect(screen.getByText(/Curriculum Map/i)).toBeDefined();

    // HomePage title
    expect(screen.getByText(/Interactive System Design Curriculum/i)).toBeDefined();
  });

  it('navigates to Horizontal Scaling topic and updates breadcrumbs & content area', () => {
    window.history.pushState({}, '', '/foundations/scaling');
    render(<App />);

    // Route title in content area
    expect(screen.getAllByText('Horizontal vs. Vertical Scaling').length).toBeGreaterThan(0);

    // Breadcrumb & Group Header updates
    expect(screen.getAllByText('1. Foundations').length).toBeGreaterThan(0);
  });

  it('contains all ~28 curriculum route definitions', () => {
    expect(ALL_CURRICULUM_ROUTES.length).toBeGreaterThanOrEqual(28);
  });
});

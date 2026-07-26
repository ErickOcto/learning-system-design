// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App';
import { ALL_CURRICULUM_ROUTES } from '../data/curriculum';

describe('Core App Layout & Routing', () => {
  beforeEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
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

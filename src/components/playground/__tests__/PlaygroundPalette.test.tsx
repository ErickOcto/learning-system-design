// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlaygroundPalette, { PALETTE_ITEMS } from '../PlaygroundPalette';

describe('PlaygroundPalette', () => {
  it('renders all 8 component palette items', () => {
    render(<PlaygroundPalette />);

    expect(screen.getByText('Component Palette')).toBeDefined();

    PALETTE_ITEMS.forEach((item) => {
      expect(screen.getByText(item.label)).toBeDefined();
      expect(screen.getByText(item.description)).toBeDefined();
    });
  });
});

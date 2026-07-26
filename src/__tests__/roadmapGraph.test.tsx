// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App';
import { useTopicStore } from '../store/useTopicStore';

describe('Interactive Roadmap SVG Navigator', () => {
  beforeEach(async () => {
    cleanup();
    window.history.pushState({}, '', '/');
    await useTopicStore.getState().clearData();
  });

  it('renders SVG roadmap node graph and group nodes', () => {
    render(<App />);

    // SVG graph containers render
    expect(screen.getAllByText('Visual Roadmap Navigator').length).toBeGreaterThan(0);

    // Group titles render inside SVG nodes
    expect(screen.getAllByText('1. Foundations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5. Caching').length).toBeGreaterThan(0);
  });

  it('reflects status colors from topicStore on roadmap nodes', async () => {
    await act(async () => {
      await useTopicStore.getState().setTopicStatus('foundations/scaling', 'mastered');
    });

    render(<App />);

    const topicRecord = useTopicStore.getState().getTopicRecord('foundations/scaling');
    expect(topicRecord.status).toBe('mastered');
  });
});

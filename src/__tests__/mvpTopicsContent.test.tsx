// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App';
import { MVP_TOPICS_CONTENT } from '../data/mvpTopicsContent';

describe('Content Authoring: MVP Topics', () => {
  beforeEach(() => {
    cleanup();
  });

  it('contains authored text content for all 5 MVP topics', () => {
    const mvpKeys = [
      'scaling',
      'load-balancers',
      'cache-strategies',
      'sharding',
      'queues-pubsub',
    ];

    mvpKeys.forEach((key) => {
      const topic = MVP_TOPICS_CONTENT[key];
      expect(topic).toBeDefined();
      expect(topic.explanation.length).toBeGreaterThan(30);
      expect(topic.realWorldExamples.length).toBeGreaterThanOrEqual(3);
      expect(topic.tradeoffs.pros.length).toBeGreaterThanOrEqual(2);
      expect(topic.tradeoffs.cons.length).toBeGreaterThanOrEqual(2);
      expect(topic.tradeoffs.whenNotToUse.length).toBeGreaterThan(20);
      expect(topic.relatedTopicIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders complete 6-section layout for Horizontal Scaling topic page', () => {
    window.history.pushState({}, '', '/foundations/scaling');
    render(<App />);

    // § 1 Explanation
    expect(screen.getByText(/Scaling is the mechanism of expanding system capacity/i)).toBeDefined();

    // § 3 Real World Examples
    expect(screen.getByText('NGINX + AWS EC2')).toBeDefined();

    // § 4 Trade-offs
    expect(screen.getByText(/Horizontal scaling provides zero-downtime elastic capacity/i)).toBeDefined();
    expect(screen.getByText(/Do not build complex horizontal auto-scaling infrastructure/i)).toBeDefined();

    // § 6 My Resources
    expect(screen.getByText(/§ 6 — My Resources/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Caching Strategies topic page', () => {
    window.history.pushState({}, '', '/caching/strategies');
    render(<App />);

    expect(screen.getByText(/Caching places frequently accessed data in high-speed/i)).toBeDefined();
    expect(screen.getByText('Redis / Memcached')).toBeDefined();
    expect(screen.getByText(/Dramatically reduces query latency/i)).toBeDefined();
  });
});

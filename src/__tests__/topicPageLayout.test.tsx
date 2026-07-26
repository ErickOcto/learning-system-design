// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import 'fake-indexeddb/auto';
import TopicPageLayout from '../components/topic/TopicPageLayout';
import { TopicPageProps } from '../types/topic';

describe('Topic Page Component Template (§6)', () => {
  beforeEach(() => {
    cleanup();
  });

  const mockProps: TopicPageProps = {
    topicId: 'foundations/scaling',
    title: 'Horizontal vs. Vertical Scaling',
    group: '1. Foundations',
    explanation: 'A load balancer distributes incoming requests across multiple servers so no single machine is overwhelmed.',
    realWorldExamples: [
      { name: 'NGINX', description: 'Upstream pools for web traffic distribution' },
      { name: 'AWS ALB', description: 'Application Load Balancer for HTTP routing' },
    ],
    tradeoffs: {
      pros: ['No single point of failure', 'Easy horizontal scaling'],
      cons: ['Adds network hop latency', 'Session affinity complexity'],
      whenNotToUse: 'Single-server hobby project where reverse proxy alone handles traffic.',
    },
    relatedTopicIds: ['/networking/load-balancers', '/caching/strategies'],
    Visualizer: () => <div data-testid="mock-viz">Mock Viz Slot</div>,
  };

  it('renders all 6 sections with passed props', () => {
    render(
      <BrowserRouter>
        <TopicPageLayout {...mockProps} />
      </BrowserRouter>
    );

    // Header & §1 Explanation
    expect(screen.getByText('Horizontal vs. Vertical Scaling')).toBeDefined();
    expect(screen.getByText(/A load balancer distributes incoming requests/i)).toBeDefined();

    // §2 Visualizer slot
    expect(screen.getByTestId('mock-viz')).toBeDefined();

    // §3 Real World
    expect(screen.getByText('NGINX')).toBeDefined();
    expect(screen.getByText('Upstream pools for web traffic distribution')).toBeDefined();

    // §4 Trade-offs (Pros, Cons, When NOT to use)
    expect(screen.getByText('No single point of failure')).toBeDefined();
    expect(screen.getByText('Adds network hop latency')).toBeDefined();
    expect(screen.getByText(/Single-server hobby project/i)).toBeDefined();

    // §5 Related Topics
    expect(screen.getByText(/#Load Balancers/i)).toBeDefined();
  });
});

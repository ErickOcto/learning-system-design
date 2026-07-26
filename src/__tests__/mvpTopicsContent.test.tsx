// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App';
import { MVP_TOPICS_CONTENT } from '../data/mvpTopicsContent';

describe('Content Authoring: MVP Topics', () => {
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
      setLineDash: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      roundRect: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    cleanup();
  });

  it('contains authored text content for all MVP topics including Microservices', () => {
    const mvpKeys = [
      'scaling',
      'load-balancers',
      'cache-strategies',
      'sharding',
      'queues-pubsub',
      'cdn',
      'data-replication',
      'cap-theorem',
      'consistency-patterns',
      'load-leveling',
      'resiliency',
      'lb-vs-proxy',
      'resiliency-advanced',
      'microservices',
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

  it('renders complete 6-section layout for Load Balancers topic page with particle visualizer', () => {
    window.history.pushState({}, '', '/networking/load-balancers');
    render(<App />);

    expect(screen.getByText(/A load balancer acts as a reverse proxy traffic director/i)).toBeDefined();
    expect(screen.getByText('AWS Application Load Balancer')).toBeDefined();
    expect(screen.getByText(/Eliminates single point of server failure/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Caching Strategies topic page', () => {
    window.history.pushState({}, '', '/caching/strategies');
    render(<App />);

    expect(screen.getByText(/Caching places frequently accessed data in high-speed/i)).toBeDefined();
    expect(screen.getByText('Redis / Memcached')).toBeDefined();
    expect(screen.getByText(/Dramatically reduces query latency/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Content Delivery Networks (CDN) topic page', () => {
    window.history.pushState({}, '', '/networking/cdn');
    render(<App />);

    expect(screen.getByText(/A Content Delivery Network \(CDN\) is a geographically distributed/i)).toBeDefined();
    expect(screen.getByText('Cloudflare Edge Network')).toBeDefined();
    expect(screen.getByText(/Dramatically reduces HTTP request latency by serving content/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Database Replication topic page', () => {
    window.history.pushState({}, '', '/data/replication');
    render(<App />);

    expect(screen.getByText(/Database replication streams Write-Ahead Log/i)).toBeDefined();
    expect(screen.getByText('PostgreSQL Streaming Replication')).toBeDefined();
    expect(screen.getByText(/Offloads read query throughput across multiple replica follower/i)).toBeDefined();
  });

  it('renders complete 6-section layout for CAP Theorem topic page', () => {
    window.history.pushState({}, '', '/availability/cap-theorem');
    render(<App />);

    expect(screen.getByText(/The CAP Theorem states that a distributed system cannot simultaneously/i)).toBeDefined();
    expect(screen.getByText('Apache Cassandra (AP)')).toBeDefined();
    expect(screen.getByText(/CP mode guarantees zero stale reads across nodes/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Consistency Patterns topic page', () => {
    window.history.pushState({}, '', '/availability/consistency-patterns');
    render(<App />);

    expect(screen.getByText(/Consistency patterns define the guarantees a distributed data store provides/i)).toBeDefined();
    expect(screen.getByText('Memcached / Voip Audio (Weak)')).toBeDefined();
    expect(screen.getByText(/Strong consistency eliminates stale reads and data corruption/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Queue Load Leveling topic page', () => {
    window.history.pushState({}, '', '/messaging/load-leveling');
    render(<App />);

    expect(screen.getByText(/Queue-based load leveling places a message buffer between an unpredictable/i)).toBeDefined();
    expect(screen.getByText('AWS SQS + Lambda / Worker Pool')).toBeDefined();
    expect(screen.getByText(/Shields fragile downstream databases and microservices from 100% CPU crashes/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Rate Limiting Resiliency topic page', () => {
    window.history.pushState({}, '', '/availability/resiliency');
    render(<App />);

    expect(screen.getByText(/Rate limiting and throttling algorithms like Token Bucket control the rate/i)).toBeDefined();
    expect(screen.getByText('Stripe API Rate Limiter')).toBeDefined();
    expect(screen.getByText(/Guarantees hard upper limits on incoming request rates/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Load Balancer vs Reverse Proxy topic page', () => {
    window.history.pushState({}, '', '/networking/lb-vs-proxy');
    render(<App />);

    expect(screen.getByText(/While Reverse Proxies and Load Balancers often run on the exact same software/i)).toBeDefined();
    expect(screen.getByText('NGINX as Edge Reverse Proxy')).toBeDefined();
    expect(screen.getByText(/Reverse proxies obscure internal server topology/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Circuit Breaker Resiliency Advanced topic page', () => {
    window.history.pushState({}, '', '/availability/resiliency-advanced');
    render(<App />);

    expect(screen.getByText(/Circuit Breakers and Bulkhead patterns prevent localized component failures/i)).toBeDefined();
    expect(screen.getByText('Netflix Hystrix / Resilience4j')).toBeDefined();
    expect(screen.getByText(/Eliminates cascading failures by insulating healthy microservice thread pools/i)).toBeDefined();
  });

  it('renders complete 6-section layout for Microservices & Blast Radius topic page', () => {
    window.history.pushState({}, '', '/architecture/microservices');
    render(<App />);

    expect(screen.getByText(/System architecture dictates the "Blast Radius" of a component failure/i)).toBeDefined();
    expect(screen.getByText('Amazon Monolith to Distributed Services')).toBeDefined();
    expect(screen.getByText(/Drastically reduces failure blast radius by isolating faults/i)).toBeDefined();
  });
});

export type VizType = 'simulation' | 'interactive' | 'prose';

export interface CurriculumRoute {
  id: string;
  path: string;
  title: string;
  topicsCovered: string;
  vizType: VizType;
  description: string;
}

export interface CurriculumGroup {
  id: string;
  title: string;
  routes: CurriculumRoute[];
}

export const CURRICULUM_GROUPS: CurriculumGroup[] = [
  {
    id: 'foundations',
    title: '1. Foundations',
    routes: [
      {
        id: 'what-is-system-design',
        path: '/foundations/what-is-system-design',
        title: 'What is System Design',
        topicsCovered: 'What is System Design',
        vizType: 'prose',
        description: 'Conceptual overview with a "big picture" system architecture overview.',
      },
      {
        id: 'how-to-approach',
        path: '/foundations/how-to-approach',
        title: 'How to Approach System Design',
        topicsCovered: 'System Design Interview & Problem Framework',
        vizType: 'interactive',
        description: 'Interactive step-through framework for system design estimation and trade-offs.',
      },
      {
        id: 'perf-vs-scalability',
        path: '/foundations/perf-vs-scalability',
        title: 'Performance vs. Scalability',
        topicsCovered: 'Performance vs. Scalability',
        vizType: 'interactive',
        description: 'Synchronized load-vs-response curves showing scaling boundaries.',
      },
      {
        id: 'latency-vs-throughput',
        path: '/foundations/latency-vs-throughput',
        title: 'Latency vs. Throughput',
        topicsCovered: 'Latency vs. Throughput',
        vizType: 'interactive',
        description: 'Pipe-width metaphor comparing latency and throughput characteristics.',
      },
      {
        id: 'scaling',
        path: '/foundations/scaling',
        title: 'Horizontal vs. Vertical Scaling',
        topicsCovered: 'Horizontal Scaling, Vertical Scaling (Flagship §7.2)',
        vizType: 'simulation',
        description: 'Flagship §7.2 side-by-side scaling panels with shared traffic controls.',
      },
    ],
  },
  {
    id: 'availability',
    title: '2. Availability & Consistency',
    routes: [
      {
        id: 'availability-overview',
        path: '/availability/overview',
        title: 'Availability vs. Consistency',
        topicsCovered: 'Availability vs. Consistency (Overview)',
        vizType: 'interactive',
        description: 'Trade-off spectrum slider between availability and strong consistency.',
      },
      {
        id: 'consistency-patterns',
        path: '/availability/consistency-patterns',
        title: 'Consistency Patterns',
        topicsCovered: 'Weak, Eventual, and Strong Consistency',
        vizType: 'simulation',
        description: 'Catalog #6 simulation showing replica convergence window over time.',
      },
      {
        id: 'cap-theorem',
        path: '/availability/cap-theorem',
        title: 'CAP Theorem',
        topicsCovered: 'CAP Theorem (CP vs. AP)',
        vizType: 'simulation',
        description: 'Catalog #5 network partition toggle simulating CP vs. AP trade-offs.',
      },
      {
        id: 'failover-replication',
        path: '/availability/failover-replication',
        title: 'Replication & Failover',
        topicsCovered: 'Primary-Replica Sync, Failover, Promotion',
        vizType: 'simulation',
        description: 'Catalog #3 primary replica replication lag and automatic failover.',
      },
      {
        id: 'nines',
        path: '/availability/nines',
        title: 'Availability in Numbers (SLA)',
        topicsCovered: 'Availability in Numbers (99.9% vs 99.999%)',
        vizType: 'interactive',
        description: 'Interactive SLA calculator converting nines to annual/monthly downtime budget.',
      },
      {
        id: 'resiliency',
        path: '/availability/resiliency',
        title: 'Circuit Breaker & Throttling',
        topicsCovered: 'Circuit Breaker, Bulkhead, Retry, Throttling',
        vizType: 'simulation',
        description: 'Catalog #11 & #9 circuit breaker tripping and token bucket rate limiting.',
      },
      {
        id: 'resiliency-advanced',
        path: '/availability/resiliency-advanced',
        title: 'Advanced Resiliency Patterns',
        topicsCovered: 'Health Endpoint, Deployment Stamps, Geodes',
        vizType: 'interactive',
        description: 'Architectural pattern diagrams with interactive component hovers.',
      },
    ],
  },
  {
    id: 'networking',
    title: '3. Networking & Delivery',
    routes: [
      {
        id: 'dns',
        path: '/networking/dns',
        title: 'Domain Name System (DNS)',
        topicsCovered: 'DNS Lookup Lifecycle',
        vizType: 'simulation',
        description: 'Catalog #13 interactive DNS recursive resolver lookup sequence.',
      },
      {
        id: 'cdn',
        path: '/networking/cdn',
        title: 'Content Delivery Networks (CDN)',
        topicsCovered: 'Push CDN, Pull CDN, Edge Caching',
        vizType: 'simulation',
        description: 'Catalog #2 edge-POP latency map comparing origin vs CDN hits.',
      },
      {
        id: 'protocols',
        path: '/networking/protocols',
        title: 'Networking Protocols (HTTP, TCP, UDP)',
        topicsCovered: 'HTTP, TCP, UDP Packet Flow',
        vizType: 'interactive',
        description: 'Protocol stack layer diagram with interactive packet inspector.',
      },
      {
        id: 'api-styles',
        path: '/networking/api-styles',
        title: 'API Styles (REST, RPC, gRPC, GraphQL)',
        topicsCovered: 'REST, RPC, gRPC, GraphQL Comparison',
        vizType: 'interactive',
        description: 'Interactive request/response comparison across modern API styles.',
      },
      {
        id: 'load-balancers',
        path: '/networking/load-balancers',
        title: 'Load Balancers & Algorithms',
        topicsCovered: 'Layer 4 vs Layer 7, Balancing Algorithms (Flagship §7.1)',
        vizType: 'simulation',
        description: 'Flagship §7.1 particle flow engine across horizontally-scaled servers.',
      },
      {
        id: 'lb-vs-proxy',
        path: '/networking/lb-vs-proxy',
        title: 'Load Balancer vs. Reverse Proxy',
        topicsCovered: 'Load Balancer vs. Reverse Proxy',
        vizType: 'simulation',
        description: 'Catalog #10 dual topology flow comparing load balancing and reverse proxying.',
      },
      {
        id: 'l4-vs-l7',
        path: '/networking/l4-vs-l7',
        title: 'Layer 4 vs. Layer 7 Routing',
        topicsCovered: 'Layer 4 vs Layer 7 Routing & Deep Packet Inspection',
        vizType: 'simulation',
        description: 'Catalog #14 deep packet inspector comparing L4 transport vs L7 application routing.',
      },
    ],
  },
  {
    id: 'data',
    title: '4. Data & Storage',
    routes: [
      {
        id: 'sql-vs-nosql',
        path: '/data/sql-vs-nosql',
        title: 'SQL vs. NoSQL Databases',
        topicsCovered: 'Key-Value, Document, Wide Column, Graph DBs',
        vizType: 'interactive',
        description: 'Interactive model explorer comparing schema structures and access patterns.',
      },
      {
        id: 'data-replication',
        path: '/data/replication',
        title: 'Database Replication',
        topicsCovered: 'Single-Leader & Multi-Leader Replication',
        vizType: 'simulation',
        description: 'Catalog #3 replication lag and primary promotion simulation.',
      },
      {
        id: 'sharding',
        path: '/data/sharding',
        title: 'Database Sharding',
        topicsCovered: 'Key-Based, Range-Based, Directory Sharding',
        vizType: 'simulation',
        description: 'Catalog #4 sharded DB query router with virtual partition keys.',
      },
      {
        id: 'denormalization-tuning',
        path: '/data/denormalization-tuning',
        title: 'Denormalization & SQL Tuning',
        topicsCovered: 'Denormalization, SQL Index Tuning',
        vizType: 'prose',
        description: 'Prose explanation with static query execution plan breakdown.',
      },
      {
        id: 'data-patterns',
        path: '/data/patterns',
        title: 'Data Management Patterns',
        topicsCovered: 'CQRS, Event Sourcing, Materialized Views',
        vizType: 'interactive',
        description: 'Interactive command/query pipeline flow diagram.',
      },
    ],
  },
  {
    id: 'caching',
    title: '5. Caching',
    routes: [
      {
        id: 'cache-layers',
        path: '/caching/layers',
        title: 'Caching Layers Depth',
        topicsCovered: 'Client, CDN, Server, App, DB Caching',
        vizType: 'interactive',
        description: 'Multi-tier step-through lookup depth across system caching layers.',
      },
      {
        id: 'cache-strategies',
        path: '/caching/strategies',
        title: 'Caching Strategies & Eviction',
        topicsCovered: 'Cache-Aside, Write-Through, Write-Behind, LRU/LFU',
        vizType: 'simulation',
        description: 'Catalog #1 memory grid visualization with real-time eviction policies.',
      },
    ],
  },
  {
    id: 'messaging',
    title: '6. Asynchronism & Messaging',
    routes: [
      {
        id: 'background-jobs',
        path: '/messaging/background-jobs',
        title: 'Background Jobs & Task Queues',
        topicsCovered: 'Event-driven vs Schedule-driven Jobs',
        vizType: 'interactive',
        description: 'Worker pool execution timeline diagram.',
      },
      {
        id: 'queues-pubsub',
        path: '/messaging/queues-pubsub',
        title: 'Message Queues & Pub/Sub',
        topicsCovered: 'Point-to-Point Queue vs. Fan-out Pub/Sub',
        vizType: 'simulation',
        description: 'Catalog #7 decoupled producer/consumer buffer with message fan-out.',
      },
      {
        id: 'load-leveling',
        path: '/messaging/load-leveling',
        title: 'Queue Load Leveling & Back Pressure',
        topicsCovered: 'Spike Absorption & Back Pressure',
        vizType: 'simulation',
        description: 'Catalog #8 traffic burst absorption preventing downstream service collapse.',
      },
      {
        id: 'messaging-patterns',
        path: '/messaging/patterns',
        title: 'Advanced Messaging Patterns',
        topicsCovered: 'Priority Queue, Claim Check, Choreography',
        vizType: 'interactive',
        description: 'Annotated message routing flow diagrams with detail toggles.',
      },
    ],
  },
  {
    id: 'architecture',
    title: '7. Architecture & Cloud Patterns',
    routes: [
      {
        id: 'microservices',
        path: '/architecture/microservices',
        title: 'Microservices & Blast Radius',
        topicsCovered: 'Monolith vs Microservices Blast Radius',
        vizType: 'simulation',
        description: 'Catalog #12 side-by-side failure isolation and blast radius comparison.',
      },
      {
        id: 'service-discovery',
        path: '/architecture/service-discovery',
        title: 'Service Discovery',
        topicsCovered: 'Service Registry & Dynamic Routing',
        vizType: 'interactive',
        description: 'Dynamic service registration and heartbeating diagram.',
      },
      {
        id: 'cloud-patterns',
        path: '/architecture/cloud-patterns',
        title: 'Cloud & Integration Patterns',
        topicsCovered: 'Sidecar, BFF, Strangler Fig, Gateway',
        vizType: 'interactive',
        description: 'Structural component topology graphs for cloud architectural patterns.',
      },
    ],
  },
  {
    id: 'antipatterns',
    title: '8. Performance Antipatterns',
    routes: [
      {
        id: 'antipatterns-main',
        path: '/antipatterns',
        title: 'Performance Antipatterns Diagnostic',
        topicsCovered: 'Busy DB, Chatty I/O, Noisy Neighbor, Retry Storm',
        vizType: 'interactive',
        description: 'Consolidated diagnostic panel comparing bad path vs fixed path metrics.',
      },
    ],
  },
  {
    id: 'security',
    title: '9. Security Patterns',
    routes: [
      {
        id: 'security-main',
        path: '/security',
        title: 'Security & Access Patterns',
        topicsCovered: 'Federated Identity, Gatekeeper, Valet Key',
        vizType: 'interactive',
        description: 'Interactive token exchange and access delegation flow sequence.',
      },
    ],
  },
  {
    id: 'observability',
    title: '10. Monitoring & Observability',
    routes: [
      {
        id: 'observability-main',
        path: '/observability',
        title: 'Observability & Telemetry',
        topicsCovered: 'Metrics, Logs, Traces, Health Endpoints',
        vizType: 'interactive',
        description: 'Mock telemetry dashboard with trace waterfall and alerting metrics.',
      },
    ],
  },
  {
    id: 'bonus',
    title: 'Bonus — Beyond Core Roadmap',
    routes: [
      {
        id: 'consistent-hashing',
        path: '/bonus/consistent-hashing',
        title: 'Consistent Hashing Ring',
        topicsCovered: 'Consistent Hashing vs Modulo Partitioning',
        vizType: 'simulation',
        description: 'Bonus #1 hash ring with dynamic node addition and minimal key remapping.',
      },
      {
        id: 'connection-protocols',
        path: '/bonus/connection-protocols',
        title: 'Polling vs. WebSockets vs. SSE',
        topicsCovered: 'Long Polling, WebSockets, Server-Sent Events',
        vizType: 'simulation',
        description: 'Bonus #2 synchronized connection lifecycle timelines.',
      },
    ],
  },
];

export const ALL_CURRICULUM_ROUTES: CurriculumRoute[] = CURRICULUM_GROUPS.flatMap(
  (group) => group.routes
);

export function findRouteByPath(path: string): CurriculumRoute | undefined {
  return ALL_CURRICULUM_ROUTES.find((r) => r.path === path);
}

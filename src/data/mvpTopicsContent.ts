import { TopicPageProps } from '../types/topic';

export const MVP_TOPICS_CONTENT: Record<string, Omit<TopicPageProps, 'Visualizer'>> = {
  // Keyed by route ID or path
  'scaling': {
    topicId: 'scaling',
    title: 'Horizontal vs. Vertical Scaling',
    group: '1. Foundations',
    explanation:
      'Scaling is the mechanism of expanding system capacity to handle increasing traffic load. Vertical scaling (scaling up) adds CPU and RAM to an existing single machine, while horizontal scaling (scaling out) provisions multiple independent server instances behind a load balancer.',
    realWorldExamples: [
      {
        name: 'NGINX + AWS EC2',
        description: 'Auto-scaling stateless web application pools behind elastic load balancers.',
      },
      {
        name: 'Redis Enterprise',
        description: 'Distributing key-value pairs across horizontally scaled cluster nodes.',
      },
      {
        name: 'AWS RDS DB Instances',
        description: 'Vertical scaling up to 1TB+ RAM instances for monolith database workloads.',
      },
    ],
    tradeoffs: {
      pros: [
        'Horizontal scaling provides zero-downtime elastic capacity additions',
        'Eliminates single point of hardware failure',
        'Vertical scaling requires no application architecture or load balancing changes initially',
      ],
      cons: [
        'Horizontal scaling introduces state synchronization and load balancing overhead',
        'Vertical scaling hits a hard physical hardware ceiling',
        'Vertical upgrades require server restarts and planned downtime',
      ],
      whenNotToUse:
        'Do not build complex horizontal auto-scaling infrastructure for simple single-server hobby applications where vertical headroom is plentiful and downtime for upgrades is acceptable.',
    },
    relatedTopicIds: ['/networking/load-balancers', '/caching/strategies', '/data/sharding'],
  },

  'load-balancers': {
    topicId: 'load-balancers',
    title: 'Load Balancers & Routing Algorithms',
    group: '3. Networking & Delivery',
    explanation:
      'A load balancer acts as a reverse proxy traffic director distributing client requests across a pool of backend servers. It prevents any single server from becoming a bottleneck while routing traffic around unhealthy instances.',
    realWorldExamples: [
      {
        name: 'AWS Application Load Balancer',
        description: 'Layer 7 HTTP routing & path-based microservice traffic distribution.',
      },
      {
        name: 'HAProxy / NGINX',
        description: 'High-performance Layer 4 TCP and Layer 7 HTTP reverse proxying.',
      },
      {
        name: 'Envoy Proxy',
        description: 'Service mesh sidecar load balancer for microservice communication.',
      },
    ],
    tradeoffs: {
      pros: [
        'Eliminates single point of server failure and enables horizontal scaling',
        'Provides health checking and automatic failover around dead instances',
        'Offloads SSL/TLS termination from application servers',
      ],
      cons: [
        'Adds an extra network hop latency to every incoming request',
        'Load balancer cluster itself must be configured for high availability',
        'Session affinity (sticky sessions) can lead to uneven load distribution',
      ],
      whenNotToUse:
        'Avoid placing dedicated load balancing layers in front of monolithic single-node architectures with low static traffic where direct routing suffices.',
    },
    relatedTopicIds: ['/foundations/scaling', '/networking/cdn', '/availability/resiliency'],
  },

  'cache-strategies': {
    topicId: 'cache-strategies',
    title: 'Caching Strategies & Eviction Policies',
    group: '5. Caching',
    explanation:
      'Caching places frequently accessed data in high-speed, temporary storage (like RAM) to serve reads with microsecond latency and relieve downstream database stress. Caching strategies dictate when data is written to cache, while eviction policies choose which keys to discard when capacity is reached.',
    realWorldExamples: [
      {
        name: 'Redis / Memcached',
        description: 'In-memory key-value stores for application session and query caching.',
      },
      {
        name: 'Cloudflare / Varnish',
        description: 'Edge HTTP caching for static assets and API responses.',
      },
      {
        name: 'MySQL Buffer Pool',
        description: 'In-memory database page cache for accelerating disk reads.',
      },
    ],
    tradeoffs: {
      pros: [
        'Dramatically reduces query latency from milliseconds to microseconds',
        'Protects primary databases from traffic spikes and read amplification',
        'Improves system availability during database degradation',
      ],
      cons: [
        'Introduces stale data risks and cache invalidation complexity',
        'Write-Through and Write-Behind strategies add write latency or event risk',
        'Cache stampede / thundering herd risks on key eviction',
      ],
      whenNotToUse:
        'Do not cache rapidly changing, highly transactional data where stale reads cause business financial errors (e.g. real-time bank account balances).',
    },
    relatedTopicIds: ['/data/sharding', '/foundations/latency-vs-throughput', '/caching/layers'],
  },

  'sharding': {
    topicId: 'sharding',
    title: 'Database Sharding & Partitioning',
    group: '4. Data & Storage',
    explanation:
      'Sharding partitions a monolithic dataset horizontally across multiple database nodes, with each shard storing a subset of rows. A partition key determines which shard holds specific records.',
    realWorldExamples: [
      {
        name: 'Vitess (YouTube)',
        description: 'Horizontal MySQL sharding framework managing billions of rows.',
      },
      {
        name: 'CockroachDB / Spanner',
        description: 'Distributed SQL databases using automatic range partitioning.',
      },
      {
        name: 'MongoDB Sharded Clusters',
        description: 'Config servers and mongos routers distributing documents.',
      },
    ],
    tradeoffs: {
      pros: [
        'Bypasses single-database memory and storage volume limits',
        'Distributes write throughput across multiple hardware nodes',
        'Isolates database failures to a fraction of the user base',
      ],
      cons: [
        'Cross-shard joins and distributed transactions become slow and complex',
        'Bad partition key choices lead to hot shard bottlenecks',
        'Resharding and cluster management overhead is significant',
      ],
      whenNotToUse:
        'Do not shard your database prematurely when indexing, vertical hardware upgrades, or read replicas can satisfy your traffic demands.',
    },
    relatedTopicIds: ['/foundations/scaling', '/caching/strategies', '/bonus/consistent-hashing'],
  },

  'queues-pubsub': {
    topicId: 'queues-pubsub',
    title: 'Message Queues & Pub/Sub',
    group: '6. Asynchronism & Messaging',
    explanation:
      'Message queues and Pub/Sub brokers decouple request producers from async consumers. Producers push messages into a queue or topic without waiting for execution, allowing consumers to process tasks asynchronously at their own pace.',
    realWorldExamples: [
      {
        name: 'Apache Kafka',
        description: 'High-throughput event streaming platform for event-driven architectures.',
      },
      {
        name: 'RabbitMQ',
        description: 'AMQP message broker for background job routing and worker pools.',
      },
      {
        name: 'AWS SQS / SNS',
        description: 'Cloud queue and fan-out notification messaging services.',
      },
    ],
    tradeoffs: {
      pros: [
        'Decouples microservice dependencies and absorbs bursty traffic spikes',
        'Guarantees task execution persistence even during consumer crashes',
        'Allows easy horizontal scaling of consumer worker pools',
      ],
      cons: [
        'Introduces eventual consistency and out-of-order message processing risks',
        'Requires idempotent consumer handlers to manage duplicate delivery',
        'Increases operational complexity and debugging difficulty',
      ],
      whenNotToUse:
        'Do not use asynchronous message queues for synchronous request-response workflows where the user client immediately requires immediate HTTP response data.',
    },
    relatedTopicIds: ['/messaging/load-leveling', '/messaging/background-jobs', '/architecture/microservices'],
  },
};

export function getMvpTopicContent(routeId: string) {
  return MVP_TOPICS_CONTENT[routeId] || null;
}

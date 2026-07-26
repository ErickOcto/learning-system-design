import { TopicPageProps } from '../types/topic';
import LoadBalancerVisualizer from '../components/visualizers/LoadBalancerVisualizer';
import ScalingVisualizer from '../components/visualizers/ScalingVisualizer';
import CachingVisualizer from '../components/visualizers/CachingVisualizer';
import ShardingVisualizer from '../components/visualizers/ShardingVisualizer';
import MessagingVisualizer from '../components/visualizers/MessagingVisualizer';
import CdnVisualizer from '../components/visualizers/CdnVisualizer';
import ReplicationVisualizer from '../components/visualizers/ReplicationVisualizer';
import CapTheoremVisualizer from '../components/visualizers/CapTheoremVisualizer';
import ConsistencyVisualizer from '../components/visualizers/ConsistencyVisualizer';
import LoadLevelingVisualizer from '../components/visualizers/LoadLevelingVisualizer';
import TokenBucketVisualizer from '../components/visualizers/TokenBucketVisualizer';
import LbVsProxyVisualizer from '../components/visualizers/LbVsProxyVisualizer';
import CircuitBreakerVisualizer from '../components/visualizers/CircuitBreakerVisualizer';
import MicroservicesVisualizer from '../components/visualizers/MicroservicesVisualizer';
import DnsVisualizer from '../components/visualizers/DnsVisualizer';
import L4VsL7Visualizer from '../components/visualizers/L4VsL7Visualizer';
import ConsistentHashingVisualizer from '../components/visualizers/ConsistentHashingVisualizer';
import RealtimeCommVisualizer from '../components/visualizers/RealtimeCommVisualizer';

export const MVP_TOPICS_CONTENT: Record<string, TopicPageProps> = {
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
    Visualizer: ScalingVisualizer,
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
    Visualizer: LoadBalancerVisualizer,
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
    Visualizer: CachingVisualizer,
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
    Visualizer: ShardingVisualizer,
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
    Visualizer: MessagingVisualizer,
  },

  'cdn': {
    topicId: 'cdn',
    title: 'Content Delivery Networks (CDN)',
    group: '3. Networking & Delivery',
    explanation:
      'A Content Delivery Network (CDN) is a geographically distributed network of proxy servers and POP edge data centers. By caching static assets and dynamic responses near end users, CDNs dramatically reduce round-trip latency (RTT) and shield origin infrastructure from heavy traffic loads.',
    realWorldExamples: [
      {
        name: 'Cloudflare Edge Network',
        description: 'Global reverse proxy providing DDoS protection, static caching, and edge computing.',
      },
      {
        name: 'AWS CloudFront',
        description: 'Low-latency content delivery network seamlessly integrated with S3 origins.',
      },
      {
        name: 'Fastly / Akamai',
        description: 'High-performance edge caching platforms for real-time cache invalidation and video streaming.',
      },
    ],
    tradeoffs: {
      pros: [
        'Dramatically reduces HTTP request latency by serving content from nearby POPs',
        'Offloads bandwidth overhead and read traffic from origin databases & app servers',
        'Improves global application availability during origin hardware outages',
      ],
      cons: [
        'Cache invalidation and purge propagation across global POP nodes is notoriously difficult',
        'Increases architecture complexity and third-party vendor operational costs',
        'First request in a Pull CDN model suffers cold start latency',
      ],
      whenNotToUse:
        'Avoid using heavy CDN caching layers for highly transactional, real-time user-personalized data APIs where every request must return immediately updated database state.',
    },
    relatedTopicIds: ['/caching/strategies', '/caching/layers', '/networking/load-balancers'],
    Visualizer: CdnVisualizer,
  },

  'data-replication': {
    topicId: 'data-replication',
    title: 'Database Replication & Failover',
    group: '4. Data & Storage',
    explanation:
      'Database replication streams Write-Ahead Log (WAL) modifications from a primary leader node to follower replicas. Asynchronous replication provides fast write responses but introduces replication lag and stale reads, while synchronous replication guarantees data consistency at the expense of higher write latency. When a primary node fails, consensus mechanisms automatically promote a follower to primary.',
    realWorldExamples: [
      {
        name: 'PostgreSQL Streaming Replication',
        description: 'WAL-based asynchronous and synchronous leader-follower streaming replication.',
      },
      {
        name: 'MySQL Group Replication / InnoDB Cluster',
        description: 'Multi-master and single-primary automated failover clusters with Paxos/Raft consensus.',
      },
      {
        name: 'Amazon Aurora Multi-AZ RDS',
        description: 'Shared storage auto-healing replication across 6 storage nodes in 3 Availability Zones.',
      },
    ],
    tradeoffs: {
      pros: [
        'Offloads read query throughput across multiple replica follower instances',
        'Provides high availability and automated failover recovery during primary hardware crashes',
        'Asynchronous mode keeps client write latency low',
      ],
      cons: [
        'Asynchronous replication introduces replication lag and risk of reading stale data',
        'Synchronous mode blocks writes until follower ACKs arrive, increasing write latency',
        'Failover consensus elections can cause brief write interruption and split-brain risks',
      ],
      whenNotToUse:
        'Do not configure multi-region synchronous replication over long geographic distances where network RTT latency will unacceptably degrade application write performance.',
    },
    relatedTopicIds: ['/availability/failover-replication', '/data/sharding', '/availability/consistency-patterns'],
    Visualizer: ReplicationVisualizer,
  },

  'cap-theorem': {
    topicId: 'cap-theorem',
    title: 'CAP Theorem & Network Partitions',
    group: '2. Availability & Consistency',
    explanation:
      'The CAP Theorem states that a distributed system cannot simultaneously guarantee Consistency (every read receives the most recent write or an error), Availability (every non-failing node returns a response), and Partition Tolerance (system operates despite network message loss). When a network partition occurs, the system MUST choose between Consistency (CP) or Availability (AP).',
    realWorldExamples: [
      {
        name: 'Apache Cassandra (AP)',
        description: 'Tunable eventual consistency preferring node availability during inter-datacenter partitions.',
      },
      {
        name: 'CockroachDB / HBase (CP)',
        description: 'Raft/Paxos consensus clusters refusing reads/writes on minority partitions to enforce strong consistency.',
      },
      {
        name: 'Amazon DynamoDB (Tunable)',
        description: 'Allows applications to choose strongly consistent reads (CP) vs eventually consistent reads (AP).',
      },
    ],
    tradeoffs: {
      pros: [
        'CP mode guarantees zero stale reads across nodes, ensuring financial & transactional accuracy',
        'AP mode maintains 100% read uptime even during physical submarine cable cuts or datacenter isolation',
        'Provides an explicit mathematical framework for distributed database selection',
      ],
      cons: [
        'CP mode causes application HTTP 503 errors during network split-brain partitions',
        'AP mode causes temporary data divergence and requires application conflict resolution (LWW / CRDTs)',
        'Partition Tolerance (P) is non-negotiable in real-world distributed networks',
      ],
      whenNotToUse:
        'Do not design for AP eventual consistency in core accounting system ledgers where serving outdated balance data causes double-spending or financial loss.',
    },
    relatedTopicIds: ['/availability/overview', '/availability/cap-theorem', '/data/replication'],
    Visualizer: CapTheoremVisualizer,
  },

  'consistency-patterns': {
    topicId: 'consistency-patterns',
    title: 'Consistency Patterns (Weak, Eventual & Strong)',
    group: '2. Availability & Consistency',
    explanation:
      'Consistency patterns define the guarantees a distributed data store provides regarding when data writes become visible to subsequent reads. Weak consistency provides fire-and-forget execution with no guarantees; Eventual consistency converges background replicas after a transient stale read window; Strong consistency uses quorum mathematics (W + R > N) to eliminate stale reads at the cost of higher write latency.',
    realWorldExamples: [
      {
        name: 'Memcached / Voip Audio (Weak)',
        description: 'Fire-and-forget caching and real-time streaming where occasional lost updates or stale reads are ignored.',
      },
      {
        name: 'Amazon DynamoDB / DNS (Eventual)',
        description: 'Global asynchronous replication ensuring high write throughput while converging replicas over time.',
      },
      {
        name: 'Spanner / CockroachDB Quorum (Strong)',
        description: 'Strict quorum consensus (W + R > N) guaranteeing linearizable strong consistency for financial transactions.',
      },
    ],
    tradeoffs: {
      pros: [
        'Strong consistency eliminates stale reads and data corruption in transactional workloads',
        'Eventual consistency provides maximum write throughput and low latency',
        'Quorum configuration (W, R, N) allows precise tuning of read vs write latency priorities',
      ],
      cons: [
        'Strong consistency increases write latency by requiring synchronous ACKs from W nodes',
        'Eventual consistency exposes applications to race conditions during the convergence window',
        'Weak consistency can cause permanent update loss if nodes crash before background sync',
      ],
      whenNotToUse:
        'Do not use Weak or Eventual consistency for inventory reservation or banking software where stale reads cause negative balances or double-booked inventory.',
    },
    relatedTopicIds: ['/availability/cap-theorem', '/data/replication', '/availability/overview'],
    Visualizer: ConsistencyVisualizer,
  },

  'load-leveling': {
    topicId: 'load-leveling',
    title: 'Queue-Based Load Leveling & Back Pressure',
    group: '6. Asynchronism & Messaging',
    explanation:
      'Queue-based load leveling places a message buffer between an unpredictable, bursty traffic producer and a rate-limited downstream consumer (like a database or legacy API). Instead of flooding and crashing fragile downstream services during sudden traffic spikes, the queue absorbs incoming message bursts and allows consumers to process tasks steadily at their maximum safe rate.',
    realWorldExamples: [
      {
        name: 'AWS SQS + Lambda / Worker Pool',
        description: 'Buffering bursty web webhook traffic before processing background tasks.',
      },
      {
        name: 'Shopify Flash Sale Queue',
        description: 'Absorbing Black Friday order checkout floods into an in-memory queue to protect database inventory tables.',
      },
      {
        name: 'Logstash / Kafka Buffer',
        description: 'Buffering millions of log lines per second before writing to ElasticSearch clusters.',
      },
    ],
    tradeoffs: {
      pros: [
        'Shields fragile downstream databases and microservices from 100% CPU crashes and HTTP 503 drops',
        'Converts unpredictable traffic spikes into smooth, flat consumption profiles',
        'Guarantees message persistence and zero data loss during burst events',
      ],
      cons: [
        'Introduces async processing delay and end-to-end task completion latency',
        'Requires queue buffer size management to prevent infinite memory growth',
        'Requires backpressure mechanisms when queue capacity threshold (>80%) is breached',
      ],
      whenNotToUse:
        'Do not place asynchronous load-leveling queues in front of strict synchronous real-time user HTTP requests (e.g. credit card charge authorization where user expects immediate response).',
    },
    relatedTopicIds: ['/messaging/queues-pubsub', '/messaging/background-jobs', '/availability/resiliency'],
    Visualizer: LoadLevelingVisualizer,
  },

  'resiliency': {
    topicId: 'resiliency',
    title: 'Circuit Breaker & Rate Limiting (Token Bucket)',
    group: '2. Availability & Consistency',
    explanation:
      'Rate limiting and throttling algorithms like Token Bucket control the rate of traffic sent to or received by a network service. A Token Bucket holds a maximum capacity of tokens refilled at a constant rate. Each incoming API request consumes a token; if the bucket is empty, requests are instantly rejected with HTTP 429 Too Many Requests, protecting backend servers from denial-of-service degradation.',
    realWorldExamples: [
      {
        name: 'Stripe API Rate Limiter',
        description: 'Redis-backed token bucket rate limiting providing per-merchant API key quotas.',
      },
      {
        name: 'NGINX limit_req module',
        description: 'Leaky bucket / Token bucket HTTP request throttling per IP address.',
      },
      {
        name: 'AWS API Gateway Throttling',
        description: 'Account-level and route-level token bucket throttling (Default: 10,000 RPS burst).',
      },
    ],
    tradeoffs: {
      pros: [
        'Guarantees hard upper limits on incoming request rates to protect backend infrastructure',
        'Allows temporary burst traffic up to full bucket capacity while maintaining long-term rate limits',
        'Provides instant HTTP 429 feedback to abusive or runaway clients',
      ],
      cons: [
        'Legitimate users experience 429 error rejections during unexpected traffic bursts',
        'Requires distributed synchronization (e.g. Redis Lua scripts) in multi-region API gateways',
        'Improperly configured bucket capacity can cause false-positive throttling',
      ],
      whenNotToUse:
        'Do not place aggressive rate limiters in front of critical internal microservice RPC calls where a 429 rejection causes cascading failures across the entire system.',
    },
    relatedTopicIds: ['/availability/overview', '/availability/nines', '/messaging/load-leveling'],
    Visualizer: TokenBucketVisualizer,
  },

  'lb-vs-proxy': {
    topicId: 'lb-vs-proxy',
    title: 'Load Balancer vs. Reverse Proxy',
    group: '4. Networking & Routing',
    explanation:
      'While Reverse Proxies and Load Balancers often run on the exact same software engines (NGINX, HAProxy, Envoy), they perform fundamentally different architectural roles. A Reverse Proxy acts as an Edge Gateway facing external clients to terminate TLS/SSL, mask internal backend IPs, cache responses, and enforce security. A Load Balancer sits between clients and server pools to distribute traffic evenly across multiple identical worker instances using algorithms like Round Robin or Least Connections.',
    realWorldExamples: [
      {
        name: 'NGINX as Edge Reverse Proxy',
        description: 'Terminating SSL certificates, compressing Gzip assets, and proxying requests to internal 10.x.x.x microservice IPs.',
      },
      {
        name: 'HAProxy Layer 7 Load Balancer',
        description: 'Distributing thousands of incoming HTTP requests per second across 20 web server worker instances.',
      },
      {
        name: 'Envoy Service Mesh (Dual Role)',
        description: 'Acting as both edge ingress gateway (Reverse Proxy) and sidecar load balancer across Kubernetes pods.',
      },
    ],
    tradeoffs: {
      pros: [
        'Reverse proxies obscure internal server topology and offload expensive cryptographic TLS handshakes',
        'Load balancers eliminate single points of failure and scale horizontal compute capacity infinitely',
        'Modern proxies (NGINX/Envoy) seamlessly combine both roles into a single efficient deployment layer',
      ],
      cons: [
        'Introduces an additional network hop (+1-5ms latency) between client and origin',
        'Single gateway instance without high-availability VIP floating IP becomes a single point of failure',
        'Requires careful header forwarding configuration (X-Forwarded-For, X-Forwarded-Proto)',
      ],
      whenNotToUse:
        'Do not place complex reverse proxies in front of low-latency internal microservice IPC if direct gRPC connections with client-side load balancing (e.g. gRPC Lookaside) meet performance targets.',
    },
    relatedTopicIds: ['/networking/load-balancers', '/networking/cdn', '/foundations/scaling'],
    Visualizer: LbVsProxyVisualizer,
  },

  'resiliency-advanced': {
    topicId: 'resiliency-advanced',
    title: 'Circuit Breaker & Bulkhead Thread Isolation',
    group: '2. Availability & Consistency',
    explanation:
      'Circuit Breakers and Bulkhead patterns prevent localized component failures from cascading into system-wide outages. A Circuit Breaker monitors downstream microservices; when consecutive failures cross a threshold (N failures), the circuit trips to OPEN, instantly failing-fast subsequent requests (HTTP 503) without waiting for downstream timeouts. A Bulkhead partitions system resources (thread pools or worker queues) into isolated pools so a slow or failing service (e.g. Recommendations) cannot exhaust shared threads and freeze healthy services (e.g. Payment and Inventory).',
    realWorldExamples: [
      {
        name: 'Netflix Hystrix / Resilience4j',
        description: 'Isolated thread pool bulkheads and circuit breakers protecting microservice IPC across thousands of instances.',
      },
      {
        name: 'Istio Service Mesh Envoy Circuit Breakers',
        description: 'Outlier detection tripping circuit breakers at the sidecar proxy level to eject failing pods.',
      },
      {
        name: 'Amazon Prime Day Isolation Bulkheads',
        description: 'Segregating checkout payment execution threads from product recommendation recommendation compute pools.',
      },
    ],
    tradeoffs: {
      pros: [
        'Eliminates cascading failures by insulating healthy microservice thread pools from failing dependencies',
        'Provides instant fail-fast (HTTP 503) responses, freeing up upstream client threads immediately',
        'Auto-recovers via Half-Open state probes once downstream services heal',
      ],
      cons: [
        'Increases architecture complexity with configurable failure thresholds, recovery timeouts, and thread limits',
        'Requires fallback handler implementation (e.g. returning cached recommendations or default response)',
        'Improperly tuned thresholds cause false-positive circuit trips under normal traffic spikes',
      ],
      whenNotToUse:
        'Do not apply aggressive circuit breakers on non-redundant core payment processor APIs where failing fast without retry attempts prevents critical customer checkouts.',
    },
    relatedTopicIds: ['/availability/resiliency', '/availability/cap-theorem', '/availability/nines'],
    Visualizer: CircuitBreakerVisualizer,
  },

  'microservices': {
    topicId: 'microservices',
    title: 'Microservices & Blast Radius Isolation',
    group: '7. System Architecture & Patterns',
    explanation:
      'System architecture dictates the "Blast Radius" of a component failure. In a monolithic architecture, all application modules (User, Order, Payment, Inventory) share a single operating process and database connection pool; an unhandled exception or database crash in one module (e.g. User DB) crashes the entire process (100% total outage, Blast Radius = 4/4 down). In a microservices architecture, services run in independent containers with isolated database boundaries; a failure in the User service is strictly contained (Blast Radius = 25% down), allowing Order, Payment, and Inventory services to continue functioning with graceful degradation.',
    realWorldExamples: [
      {
        name: 'Amazon Monolith to Distributed Services',
        description: 'Migrating the Obidos monolithic C++ executable into decoupled SOA microservices to stop single-module site crashes.',
      },
      {
        name: 'Netflix Microservices Architecture',
        description: 'Over 1,000 independent microservices running in AWS containers with automated cell-based fault isolation.',
      },
      {
        name: 'Uber Domain-Driven Services (DOMA)',
        description: 'Grouped microservice domains bounded by domain-level database isolation.',
      },
    ],
    tradeoffs: {
      pros: [
        'Drastically reduces failure blast radius by isolating faults within single microservice boundaries',
        'Enables independent scaling, deployment, and tech stack choices per team',
        'Prevents single-module memory leaks or DB crashes from downing unrelated core features',
      ],
      cons: [
        'Introduces network RPC latency and inter-service network serialization overhead',
        'Requires complex distributed transaction management (Saga pattern) instead of ACID SQL joins',
        'Significantly increases operational deployment and observability overhead (Kubernetes, Service Mesh)',
      ],
      whenNotToUse:
        'Do not build a complex multi-repo microservices architecture for early-stage startup MVPs where domain boundaries are fluid and operational overhead distracts from product velocity.',
    },
    relatedTopicIds: ['/availability/resiliency-advanced', '/foundations/scaling', '/networking/lb-vs-proxy'],
    Visualizer: MicroservicesVisualizer,
  },

  'dns': {
    topicId: 'dns',
    title: 'Domain Name System (DNS) Resolution Lifecycle',
    group: '4. Networking & Routing',
    explanation:
      'The Domain Name System (DNS) translates human-readable domain names (e.g. example.com) into numerical IP addresses (e.g. 93.184.216.34) required for TCP/IP network routing. DNS resolution proceeds through a 5-step hierarchical lookup: Browser Cache -> OS Resolver (8.8.8.8) -> Root Nameserver (.) -> TLD Nameserver (.com) -> Authoritative Nameserver (ns1.example.com). Responses are cached at every layer using TTL (Time To Live) headers to minimize lookup latency for subsequent requests.',
    realWorldExamples: [
      {
        name: 'Google Public DNS (8.8.8.8 / 8.8.4.4)',
        description: 'Global high-performance recursive resolver handling hundreds of billions of queries per day with geo-routed caching.',
      },
      {
        name: 'Cloudflare 1.1.1.1 & Authoritative DNS',
        description: 'Ultra-fast authoritative DNS service offering 10ms global resolution time and DNSSEC validation.',
      },
      {
        name: 'Amazon Route 53',
        description: 'Cloud DNS web service providing latency-based routing, geo-DNS steering, and health-check failover.',
      },
    ],
    tradeoffs: {
      pros: [
        'Decouples human-rememberable brand URLs from changing underlying physical server IP addresses',
        'Hierarchical caching drastically speeds up repeat domain resolutions to under 2ms',
        'Enables Geo-DNS traffic steering, global load balancing, and failover failover switching',
      ],
      cons: [
        'DNS TTL caching delays propagation of emergency server IP updates across worldwide resolvers',
        'Vulnerable to DNS spoofing / poisoning attacks if DNSSEC security validation is omitted',
        'Single authoritative DNS provider outage breaks domain resolution for all worldwide clients',
      ],
      whenNotToUse:
        'Do not rely solely on public DNS for internal microservice-to-microservice RPC discovery; use internal Service Discovery registries (e.g. Consul, CoreDNS in K8s) with sub-second health convergence.',
    },
    relatedTopicIds: ['/networking/cdn', '/networking/lb-vs-proxy', '/networking/load-balancers'],
    Visualizer: DnsVisualizer,
  },

  'l4-vs-l7': {
    topicId: 'l4-vs-l7',
    title: 'Layer 4 vs. Layer 7 Routing & Inspection',
    group: '4. Networking & Routing',
    explanation:
      'Layer 4 (Transport Layer) load balancing operates at the TCP/UDP level, inspecting only Source/Destination IP and Port headers to hash and forward raw packet streams with ultra-low latency (0.2ms). Layer 7 (Application Layer) load balancing performs deep HTTP packet inspection, parsing URL paths (/api vs /static), HTTP headers, and cookies to execute smart, content-aware routing to specialized server pools (e.g., CDN static pools or dedicated VIP compute clusters).',
    realWorldExamples: [
      {
        name: 'AWS Network Load Balancer (NLB - Layer 4)',
        description: 'Ultra-low latency TCP/UDP load balancer handling millions of requests per second with static IP addresses.',
      },
      {
        name: 'AWS Application Load Balancer (ALB - Layer 7)',
        description: 'Content-based HTTP/HTTPS routing inspecting URL paths (/api/v1/*), host headers, and gRPC calls.',
      },
      {
        name: 'HAProxy L4 vs L7 Mode',
        description: 'Configurable mode=tcp (L4 passthrough) vs mode=http (L7 deep packet inspection and header rewrite).',
      },
    ],
    tradeoffs: {
      pros: [
        'Layer 4 provides maximum throughput and minimal CPU overhead (0.2ms latency) without decrypting TLS',
        'Layer 7 enables intelligent path-based microservice routing, cookie-based VIP prioritization, and A/B test routing',
        'Layer 7 provides granular HTTP health checks and header manipulation',
      ],
      cons: [
        'Layer 4 cannot route based on URL paths, HTTP headers, or session cookies',
        'Layer 7 requires expensive TLS decryption/re-encryption and deep packet parsing overhead (1-3ms)',
        'Layer 7 consumes significantly more memory and CPU cycles per connection than Layer 4',
      ],
      whenNotToUse:
        'Do not use Layer 7 HTTP routing for non-HTTP raw TCP/UDP protocols (like database connections or video streaming) where Layer 4 TCP proxying is mandatory.',
    },
    relatedTopicIds: ['/networking/load-balancers', '/networking/lb-vs-proxy', '/networking/cdn'],
    Visualizer: L4VsL7Visualizer,
  },

  'consistent-hashing': {
    topicId: 'consistent-hashing',
    title: 'Consistent Hashing Ring & Virtual Nodes',
    group: '4. Data & Storage',
    explanation:
      'Consistent Hashing maps both data keys and cache/database storage nodes to a 360-degree virtual hash ring. Unlike traditional modulo hashing (key % N) where adding or removing a node causes a catastrophic 100% cache miss storm by remapping virtually all keys, Consistent Hashing guarantees that adding or removing a node remaps only a fraction (1/N) of the keys to neighbor nodes. Virtual nodes (e.g. Node A-v1, Node A-v2) spread node placement evenly across the ring to prevent hot-spot load imbalance.',
    realWorldExamples: [
      {
        name: 'Amazon DynamoDB Consistent Hash Ring',
        description: 'Partitioning key ranges across storage nodes in distributed Dynamo storage clusters.',
      },
      {
        name: 'Discord Voice Gateway Router',
        description: 'Using consistent hashing to route millions of concurrent WebSockets to media server pools with minimal connection dropping during autoscaling.',
      },
      {
        name: 'Apache Cassandra Partitioning (Murmur3Partitioner)',
        description: 'Token ring distribution mapping 64-bit token ranges across cluster nodes.',
      },
    ],
    tradeoffs: {
      pros: [
        'Dramatically reduces cache miss storms during node additions/removals by remapping only 1/N keys',
        'Virtual nodes eliminate non-uniform key clustering and hot-spot server overload',
        'Allows dynamic elastic scaling of cache and database clusters without full cluster reshuffling',
      ],
      cons: [
        'Increases hash ring lookup metadata overhead and complexity',
        'Heterogeneous server capacities require tuning virtual node weights',
        'Cascading remapping on node failure can temporarily increase load on neighboring nodes',
      ],
      whenNotToUse:
        'Do not use Consistent Hashing for small, fixed 2-node primary/replica database setups where standard primary-write / replica-read routing is simpler.',
    },
    relatedTopicIds: ['/data/sharding', '/caching/strategies', '/foundations/scaling'],
    Visualizer: ConsistentHashingVisualizer,
  },

  'connection-protocols': {
    topicId: 'connection-protocols',
    title: 'Real-time Communication: Polling vs. WebSockets vs. SSE',
    group: 'Bonus — Beyond Core Roadmap',
    explanation:
      'Real-time web communication provides dynamic live updates using four main architectural patterns: 1) Short Polling (HTTP GET every N seconds, high header overhead), 2) Long Polling (Server holds request open until event fires), 3) WebSockets (persistent full-duplex bi-directional TCP connection after a 101 Upgrade handshake), and 4) Server-Sent Events (SSE: HTTP text/event-stream unidirectional server push). Selecting the right pattern depends on stream directionality, connection scale, and firewall traversal requirements.',
    realWorldExamples: [
      {
        name: 'Slack / Discord Live Chat (WebSockets)',
        description: 'Full-duplex low-latency chat messaging and presence sync over persistent WebSocket connections.',
      },
      {
        name: 'Twitter / Financial Stock Ticker (Server-Sent Events)',
        description: 'Unidirectional live price tick updates streamed continuously over HTTP SSE.',
      },
      {
        name: 'Legacy Notification Polling (Short Polling)',
        description: 'Periodic background HTTP GET requests for low-frequency notification updates.',
      },
    ],
    tradeoffs: {
      pros: [
        'WebSockets eliminate HTTP header overhead (2-byte frames) and provide instant sub-millisecond bi-directional communication',
        'Server-Sent Events (SSE) feature automatic reconnection and native browser EventSource API support over HTTP/2',
        'Long Polling falls back gracefully across restrictive corporate firewalls that block WS ports',
      ],
      cons: [
        'WebSockets require complex stateful server infrastructure and load balancer sticky connections',
        'Short Polling creates massive CPU and network bandwidth waste with empty 200 OK polling responses',
        'SSE is strictly unidirectional (Server -> Client) and requires separate HTTP calls for client upstream data',
      ],
      whenNotToUse:
        'Do not open persistent WebSockets for rare background tasks executed once a day where standard REST HTTP calls suffice.',
    },
    relatedTopicIds: ['/networking/load-balancers', '/messaging/load-leveling', '/networking/lb-vs-proxy'],
    Visualizer: RealtimeCommVisualizer,
  },

  'protocols': {
    topicId: 'protocols',
    title: 'Networking Protocols (HTTP/1.1, HTTP/2, HTTP/3, TCP, UDP)',
    group: '3. Networking & Delivery',
    explanation:
      'Modern network communication layers stack from IP (routing) -> TCP/UDP (transport) -> HTTP (application). TCP provides reliable, ordered, byte-stream transmission via a 3-way SYN/SYN-ACK/ACK handshake. UDP trades reliability for raw speed and zero connection latency (used in streaming & WebRTC). HTTP/2 introduced binary framing, multiplexing multiple requests over a single TCP connection, while HTTP/3 runs over QUIC (UDP-based) to solve TCP head-of-line blocking.',
    realWorldExamples: [
      {
        name: 'HTTP/2 Multiplexing in Web Browsers',
        description: 'Multiplexing hundreds of static assets simultaneously over a single TCP connection.',
      },
      {
        name: 'HTTP/3 QUIC in Google Search & YouTube',
        description: 'Using QUIC over UDP to eliminate head-of-line blocking latency on mobile networks.',
      },
      {
        name: 'UDP for Voice & Video (Zoom, WebRTC)',
        description: 'Prioritizing low-latency packet delivery over packet retransmission for live media.',
      },
    ],
    tradeoffs: {
      pros: [
        'TCP guarantees zero packet loss and strict byte order delivery',
        'HTTP/2 multiplexing eliminates browser 6-connection limits',
        'HTTP/3 QUIC provides fast 0-RTT connection establishment',
      ],
      cons: [
        'TCP 3-way handshake adds latency overhead on new connections',
        'TCP head-of-line blocking delays all streams if a single packet drops',
        'UDP requires application-level packet loss handling',
      ],
      whenNotToUse:
        'Do not build custom UDP transport protocols for standard REST APIs where standard HTTP/2 over TLS is secure and fast.',
    },
    relatedTopicIds: ['/networking/dns', '/networking/cdn', '/networking/load-balancers'],
  },

  'api-styles': {
    topicId: 'api-styles',
    title: 'API Styles: REST, gRPC, GraphQL, and WebSockets',
    group: '3. Networking & Delivery',
    explanation:
      'API design paradigms define client-server communication contracts. REST utilizes standard HTTP verbs (GET, POST, PUT, DELETE) and JSON payloads. gRPC uses HTTP/2 multiplexing with Protocol Buffers for high-performance, strongly-typed binary RPC microservice communication. GraphQL allows clients to request exact JSON schema shapes in a single query, eliminating over-fetching. WebSockets provide full-duplex persistent stream communication.',
    realWorldExamples: [
      {
        name: 'Stripe REST API',
        description: 'Predictable resource-oriented URLs with HTTP status codes and JSON response objects.',
      },
      {
        name: 'Netflix Internal Microservice gRPC',
        description: 'High-throughput low-latency inter-service RPC calls using Protobuf binary payloads.',
      },
      {
        name: 'GitHub GraphQL API v4',
        description: 'Single endpoint allowing clients to query nested repositories, issues, and PRs in 1 request.',
      },
    ],
    tradeoffs: {
      pros: [
        'REST is universally understood with native HTTP caching support',
        'gRPC reduces payload size by up to 80% with strongly typed Protobuf schemas',
        'GraphQL eliminates client over-fetching and under-fetching',
      ],
      cons: [
        'REST can lead to over-fetching or multiple round-trip requests for nested data',
        'gRPC browser support requires gRPC-Web proxy translation',
        'GraphQL complicates server-side query execution and caching layer design',
      ],
      whenNotToUse:
        'Do not implement GraphQL for simple CRUD microservices where standard REST controllers are faster to develop.',
    },
    relatedTopicIds: ['/networking/protocols', '/architecture/microservices', '/bonus/connection-protocols'],
  },

  'sql-vs-nosql': {
    topicId: 'sql-vs-nosql',
    title: 'SQL vs. NoSQL Databases',
    group: '4. Data & Storage',
    explanation:
      'Relational (SQL) databases (e.g. PostgreSQL, MySQL) store data in strict tabular schemas with ACID transactional guarantees and complex SQL JOIN capabilities. Non-relational (NoSQL) databases prioritize horizontal scalability and high write throughput, categorizing into Key-Value (Redis), Document (MongoDB), Wide-Column (Cassandra), and Graph (Neo4j) engines with flexible schemas and eventual consistency models.',
    realWorldExamples: [
      {
        name: 'PostgreSQL for Financial Transactions',
        description: 'Strict ACID compliance, foreign key constraints, and relational joins.',
      },
      {
        name: 'MongoDB for User Profiles & Catalogs',
        description: 'Flexible JSON document schemas with dynamic attributes and horizontal sharding.',
      },
      {
        name: 'Redis for Caching & Leaderboards',
        description: 'In-memory key-value data structures with sub-millisecond read/write latency.',
      },
    ],
    tradeoffs: {
      pros: [
        'SQL guarantees strict ACID data consistency and powerful declarative JOIN queries',
        'NoSQL scales horizontally across hundreds of commodity nodes with high throughput',
        'NoSQL document stores accommodate rapidly evolving unstructured schemas',
      ],
      cons: [
        'SQL horizontal sharding across complex joined tables is difficult',
        'NoSQL lacks cross-document ACID transactions and multi-table JOINs',
        'NoSQL eventual consistency can lead to temporary stale reads',
      ],
      whenNotToUse:
        'Do not use NoSQL for core banking or ledger accounting systems requiring strict multi-table ACID guarantees.',
    },
    relatedTopicIds: ['/data/replication', '/data/sharding', '/caching/strategies'],
  },

  'denormalization-tuning': {
    topicId: 'denormalization-tuning',
    title: 'Denormalization & SQL Query Optimization',
    group: '4. Data & Storage',
    explanation:
      'Database normalization (3NF) reduces data redundancy but requires expensive multi-table SQL JOINs at read time. Denormalization intentionally duplicates calculated fields or pre-joined relations into single tables to turn $O(N)$ JOIN queries into $O(1)$ indexed reads. SQL query optimization relies on B-Tree composite indexes, covering indexes, avoiding SELECT *, and analyzing EXPLAIN ANALYZE query plans.',
    realWorldExamples: [
      {
        name: 'E-Commerce Order Item Summary Count',
        description: 'Pre-aggregating total_items directly on orders table to avoid counting child order_items rows.',
      },
      {
        name: 'PostgreSQL B-Tree Composite Indexing',
        description: 'Indexing (user_id, created_at DESC) for fast paginated timeline queries.',
      },
      {
        name: 'Materialized Views in Data Warehouses',
        description: 'Pre-computing complex multi-table analytical aggregations updated on a schedule.',
      },
    ],
    tradeoffs: {
      pros: [
        'Dramatically speeds up read query performance by eliminating expensive runtime JOINs',
        'Composite B-Tree indexes enable instant $O(\\log N)$ index scan lookups',
        'Reduces CPU and RAM consumption on read-heavy database servers',
      ],
      cons: [
        'Requires application-level or trigger logic to keep duplicated data in sync on updates',
        'Increases storage footprint and write overhead for index updates',
        'Risk of data anomaly inconsistency if write updates fail partially',
      ],
      whenNotToUse:
        'Do not denormalize tables in write-heavy transactional systems where write locks and update synchronization overhead outweigh read performance gains.',
    },
    relatedTopicIds: ['/data/sql-vs-nosql', '/data/sharding', '/caching/strategies'],
  },
};

export function getMvpTopicContent(routeId: string) {
  return MVP_TOPICS_CONTENT[routeId] || null;
}

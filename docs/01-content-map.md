# 01 — Curriculum → App Pages Content Map

Maps the ~130 topic nodes from [roadmap.sh/system-design](https://roadmap.sh/system-design) (§3) to concrete app routes. Closely-related leaf nodes are consolidated into single pages where that reads better than 130 separate routes (per §3 last paragraph).

**Legend**:
- 🎯 = Has dedicated interactive visualization (see `02-visualization-catalog.md`)
- 📊 = Static diagram or interactive hover-diagram (not a full simulation)
- 📝 = Primarily prose/explanation (simulation not appropriate for this topic)

---

## Group 1 — Foundations

| Route | Topics covered | Viz type |
|---|---|---|
| `/foundations/what-is-system-design` | What is System Design | 📝 Conceptual overview with a "big picture" static architecture diagram |
| `/foundations/how-to-approach` | How to Approach System Design | 📊 Interactive step-through of a design-interview framework (requirements → estimation → design → trade-offs) |
| `/foundations/perf-vs-scalability` | Performance vs. Scalability | 📊 Two synchronized load-vs-response-time curves |
| `/foundations/latency-vs-throughput` | Latency vs. Throughput | 📊 Pipe-width metaphor: narrow high-pressure pipe (low latency, low throughput) vs. wide pipe |
| `/foundations/scaling` | Horizontal Scaling, Vertical Scaling (as contrast) | 🎯 **Flagship §7.2** — side-by-side scaling panels |

---

## Group 2 — Availability & Consistency

| Route | Topics covered | Viz type |
|---|---|---|
| `/availability/overview` | Availability vs. Consistency (intro) | 📊 Trade-off slider showing the spectrum |
| `/availability/consistency-patterns` | Weak Consistency, Eventual Consistency, Strong Consistency | 🎯 **Catalog #6** — replicas converging over time |
| `/availability/cap-theorem` | CAP Theorem | 🎯 **Catalog #5** — network partition toggle, CP vs. AP |
| `/availability/failover-replication` | Fail-over, Replication (Availability Patterns) | 🎯 **Catalog #3** — primary-replica sync & promotion |
| `/availability/nines` | Availability in Numbers | 📊 Interactive SLA calculator (input nines → output annual downtime) |
| `/availability/resiliency` | Circuit Breaker, Bulkhead, Retry, Throttling | 🎯 **Catalog #11** (circuit breaker/bulkhead) + **Catalog #9** (throttling/token bucket) |
| `/availability/resiliency-advanced` | Health Endpoint Monitoring, Deployment Stamps, Geodes, Compensating Transaction | 📊 Architectural pattern diagrams with hover explanations |

---

## Group 3 — Networking & Delivery

| Route | Topics covered | Viz type |
|---|---|---|
| `/networking/dns` | Domain Name System | 🎯 **Catalog #13** — recursive lookup stepping |
| `/networking/cdn` | Content Delivery Networks, Push CDN, Pull CDN, CDN Caching | 🎯 **Catalog #2** — edge-POP latency map |
| `/networking/protocols` | HTTP, TCP, UDP | 📊 Protocol stack layer diagram with packet inspector |
| `/networking/api-styles` | REST, RPC, gRPC, GraphQL | 📊 Request/response comparison table with interactive examples |
| `/networking/load-balancers` | Load Balancers, Layer 4 vs. Layer 7, Load Balancing Algorithms | 🎯 **Flagship §7.1** (routing) + **Catalog #14** (L4 vs. L7) |
| `/networking/lb-vs-proxy` | Load Balancer vs. Reverse Proxy | 🎯 **Catalog #10** — same box, different job |

---

## Group 4 — Data & Storage

| Route | Topics covered | Viz type |
|---|---|---|
| `/data/sql-vs-nosql` | SQL vs. NoSQL, Key-Value Store, Document Store, Wide Column Store, Graph Databases | 📊 Interactive model explorer — schema layout per DB type, query pattern comparison |
| `/data/replication` | Database Replication | 🎯 **Catalog #3** (shared with Availability group — cross-linked) |
| `/data/sharding` | Sharding, Federation | 🎯 **Catalog #4** — range vs. hash vs. consistent hashing |
| `/data/denormalization-tuning` | Denormalization, SQL Tuning | 📝 Prose + static query-plan diagrams (forced animation inappropriate per §4) |
| `/data/patterns` | CQRS, Event Sourcing, Materialized View, Index Table, Cache-Aside, Static Content Hosting, Valet Key | 📊 Interactive command/query pipeline flow diagram |

---

## Group 5 — Caching

| Route | Topics covered | Viz type |
|---|---|---|
| `/caching/layers` | Client caching, CDN caching, Web Server caching, Database caching, Application caching | 📊 Multi-tier step-through showing cache lookup depth at each layer |
| `/caching/strategies` | Cache-Aside, Write-Through, Write-Behind, Refresh-Ahead + eviction policies (LRU, LFU, FIFO) | 🎯 **Catalog #1** — real-time cache memory grid with eviction |

---

## Group 6 — Asynchronism & Messaging

| Route | Topics covered | Viz type |
|---|---|---|
| `/messaging/background-jobs` | Background Jobs (Event-driven, Schedule-driven), Task Queues | 📊 Worker pool timeline |
| `/messaging/queues-pubsub` | Message Queues, Publisher/Subscriber, Competing Consumers | 🎯 **Catalog #7** — decoupled producer/consumer, fan-out |
| `/messaging/load-leveling` | Queue-Based Load Leveling, Back Pressure | 🎯 **Catalog #8** — spike absorption |
| `/messaging/patterns` | Priority Queue, Claim Check, Choreography, Sequential Convoy, Async Request-Reply, Scheduler Agent Supervisor, Idempotent Operations | 📊 Annotated flow diagrams with hover-to-expand detail |

---

## Group 7 — Architecture & Cloud Design Patterns

| Route | Topics covered | Viz type |
|---|---|---|
| `/architecture/microservices` | Microservices (vs. monolithic baseline) | 🎯 **Catalog #12** — blast radius comparison |
| `/architecture/service-discovery` | Service Discovery | 📊 Dynamic service registry diagram |
| `/architecture/cloud-patterns` | Ambassador, Anti-Corruption Layer, Backends for Frontend, Strangler Fig, Gateway Routing/Aggregation/Offloading, External Config Store, Compute Resource Consolidation, Leader Election, Pipes & Filters, Sidecar | 📊 Interactive structural boundary diagrams — these are structural patterns best served by annotated component graphs, not particle simulations |

---

## Group 8 — Performance Antipatterns

| Route | Topics covered | Viz type |
|---|---|---|
| `/antipatterns` | Busy Database, Busy Frontend, Chatty I/O, Extraneous Fetching, Improper Instantiation, Monolithic Persistence, No Caching, Noisy Neighbor, Retry Storm, Synchronous I/O | 📊 Consolidated diagnostic panel — scenario selector showing "bad path" vs. "fixed path" with latency/throughput metrics. All 10 antipatterns on one page with sub-sections (per §3: "group tightly related leaf nodes"). |

---

## Group 9 — Security

| Route | Topics covered | Viz type |
|---|---|---|
| `/security` | Federated Identity, Gatekeeper, Valet Key | 📊 Token flow diagrams with interactive hover — security patterns are protocol/flow explanations, not simulations |

---

## Group 10 — Monitoring & Observability

| Route | Topics covered | Viz type |
|---|---|---|
| `/observability` | Health Monitoring, Availability Monitoring, Performance Monitoring, Security Monitoring, Usage Monitoring, Instrumentation, Visualization & Alerts | 📊 Mock telemetry dashboard with trace waterfall — sub-sections for each monitoring type |

---

## Bonus Section (explicitly labeled "Beyond the Core Roadmap")

| Route | Topics covered | Viz type |
|---|---|---|
| `/bonus/consistent-hashing` | Consistent Hashing | 🎯 **Bonus #1** — hash ring with node add/remove, contrasted against naive modulo |
| `/bonus/connection-protocols` | Long Polling vs. WebSockets vs. Server-Sent Events | 🎯 **Bonus #2** — synchronized connection lifecycle timelines |

---

## Route Summary

- **Total routes**: ~28 pages (down from 130 nodes through consolidation)
- **Full interactive simulations (🎯)**: 16 visualizations across 14 routes
- **Interactive diagrams (📊)**: ~11 routes
- **Prose-first (📝)**: 2–3 routes

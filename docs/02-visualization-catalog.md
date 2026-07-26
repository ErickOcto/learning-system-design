# 02 — Visualization Catalog

Every entry follows the standard set in §7.1–7.2: learning objective, visual metaphor, concrete controls, contrast/failure states, live readouts, and synced caption triggers.

---

## Flagship §7.1 — Request Routing Across Horizontally-Scaled Servers

**Learning objective**: Understand how a load balancer distributes traffic across a server pool, and how algorithm choice changes both the distribution pattern and resilience to a server going down.

**Visual metaphor**: Client cluster (left) emitting small animated request packets → central load-balancer node → row of server instances (right). Packets travel along curved paths with color-coded routing.

**Controls**:
- Play / Pause toggle
- Request rate slider (1–100 req/s)
- Algorithm selector: Round Robin, Least Connections, Weighted Round Robin, IP Hash — changes routing live
- Server count stepper (1–8) — scale pool in/out mid-simulation
- Click any server to mark it unhealthy (X overlay, grayed out)
- Client distribution toggle: Uniform vs. Skewed IP traffic (to demonstrate IP Hash hotspots)

**States to depict**:
1. *Round Robin even distribution* — requests cycle through servers 1 → 2 → 3 → 1 → …
2. *IP Hash hotspot* — with skewed client IPs, one server's load bar spikes red while others idle; switch to Least Connections and watch it rebalance
3. *Least Connections dynamic routing* — slow server accumulates connections, LB routes away from it
4. *Mid-stream server failure* — server killed while in-flight requests exist; those requests flash red (failed), subsequent requests route around the dead node
5. *Scale-out during load* — add server mid-simulation; traffic immediately includes the new node

**Live readouts** (per server): Active connections, total requests processed, CPU utilization %, current RPS.

**Caption examples**: "Round Robin: routing request #47 to Server 2" → "Server 3 marked unhealthy — removed from pool" → "IP Hash: 72% of traffic hitting Server 1 due to client IP distribution"

---

## Flagship §7.2 — Horizontal vs. Vertical Scaling (Side-by-Side)

**Learning objective**: Understand the mechanical and operational difference between scaling up (bigger machine) and scaling out (more machines), including where each hits a wall.

**Visual metaphor**: Two synchronized panels sharing one load control.
- *Left panel (Vertical)*: Single server box with internal CPU/RAM fill bars. An "Upgrade Hardware" button triggers a brief downtime flash (real hardware upgrades require restart). At a configurable ceiling, it maxes out and visibly drops requests (red packets bouncing off).
- *Right panel (Horizontal)*: Load balancer icon feeding multiple small server boxes. New instances spawn seamlessly with zero downtime as load grows.

**Controls**:
- Shared traffic slider (100–10,000 RPS) driving both panels simultaneously
- "Upgrade Hardware" button (vertical panel only) — increases ceiling but causes 2-second simulated downtime
- Auto-scale threshold slider (horizontal panel) — target CPU % that triggers new instance

**States to depict**:
1. *Low load* — both panels handle it fine; vertical has simplicity advantage (one box)
2. *Hardware ceiling crash* — vertical server hits 100% CPU, drops packets (red), returns 503s
3. *Upgrade downtime* — clicking upgrade pauses vertical processing briefly (red flash)
4. *Horizontal elasticity* — spike spawns 3 additional instances with no interruption
5. *Trade-off callout* — persistent banner on horizontal panel: "⚠ Horizontal scaling requires a load balancer and introduces state-synchronization complexity"

**Live readouts**: Total system capacity (RPS), dropped requests, estimated monthly cost ($), per-instance CPU %.

**Caption examples**: "Load at 3,000 RPS — vertical server at 95% CPU, approaching ceiling" → "Vertical server overloaded! Dropping requests." → "Horizontal: auto-scaled to 4 instances. All requests served."

---

## Catalog #1 — Caching & Eviction Policies

**Learning objective**: See why a cache hit is fast and a miss is slow, and watch eviction policies (LRU/LFU/FIFO) choose victims when the cache is full.

**Visual metaphor**: A memory-slot grid (capacity: 5–10 configurable slots) sitting between a request generator (left) and a slow storage disk (right). Cache hits take a short green path; misses take a long yellow detour through the disk.

**Controls**:
- Caching strategy selector: Cache-Aside, Write-Through, Write-Behind, Refresh-Ahead
- Eviction policy: LRU, LFU, FIFO
- Cache capacity slider (3–10 slots)
- Request buttons for keys A through H (manual) or auto-generate toggle
- Speed control

**States**:
1. *Cache hit* — request key found in grid, green fast-path (labeled ~2ms)
2. *Cache miss* — request key not found, yellow slow-path through disk (labeled ~50ms), then stored in cache
3. *Eviction* — cache full, eviction policy highlights the victim slot (red flash), ejects it, inserts new key
4. *Write-Through vs. Write-Behind contrast* — Write-Through: write waits for both cache + disk before ACK. Write-Behind: write ACKs after cache, disk write queued (with risk callout: "data loss if crash before flush")

**Live readouts**: Hit rate %, total hits, total misses, cache occupancy, eviction count.

---

## Catalog #2 — Content Delivery Networks (Push vs. Pull)

**Learning objective**: Geographic proximity to data determines latency; CDNs place copies at the edge.

**Visual metaphor**: Simplified world map with origin server (US-East) and edge POP nodes (US-West, EU, Asia). User icons in each region send requests. Lines show request paths with latency labels.

**Controls**:
- User region selector (or click map region)
- Mode toggle: No CDN (direct to origin) / Pull CDN / Push CDN
- Cache TTL slider
- "Invalidate cache" button

**States**:
1. *No CDN* — all requests travel long path to origin; high latency for distant users
2. *Pull CDN cold start* — first request from EU goes to origin (miss), subsequent requests served from EU edge (hit)
3. *Push CDN* — content pre-populated at edges before any request; first request is fast too
4. *Cache expiry / invalidation* — TTL expires, next request re-fetches from origin

**Live readouts**: RTT per region (ms), origin load (RPS), bandwidth saved %, cache hit ratio per POP.

---

## Catalog #3 — Database Replication & Failover

**Learning objective**: Writes propagate to replicas with real lag, not instantly; killing the primary triggers automated promotion.

**Visual metaphor**: Primary DB node streaming WAL entries along network wires to 2 replica nodes. Each node shows a "state counter" indicating data freshness.

**Controls**:
- Replication mode: Synchronous vs. Asynchronous
- Network latency slider (0–2000ms)
- "Write data" button (inserts to primary)
- "Read from replica" button (shows stale vs. fresh)
- "Kill primary" button

**States**:
1. *Async replication lag* — primary at version 42, replicas trailing at 39, 40
2. *Stale read* — client reads replica and gets version 40 while primary is at 42 (highlighted discrepancy)
3. *Sync replication* — write waits for replica ACK before returning; higher latency but no stale reads
4. *Primary failure & promotion* — primary goes dark; after consensus timeout, Replica 1 promoted (crown icon), Replica 2 re-points

**Live readouts**: Replication lag (ms), stale-read count, primary uptime, consensus state.

---

## Catalog #4 — Database Sharding & Key Distribution

**Learning objective**: Splitting data across shards can backfire if the shard key is chosen badly.

**Visual metaphor**: Router node distributing user records into 4 shard buckets. Each bucket has a fill-level bar.

**Controls**:
- Strategy: Range-based, Hash (modulo), Consistent Hashing
- Traffic pattern: Random user IDs / Sequential monotonic IDs / "Celebrity user" hotspot
- Data volume slider

**States**:
1. *Even distribution* — hash-based with random IDs spreads data evenly
2. *Hot shard* — range-based with sequential IDs piles everything into Shard 1 (red warning, "95% full while others at 10%")
3. *Celebrity hotspot* — one shard overwhelmed by reads for a popular key
4. *Consistent hashing advantage* — adding a 5th shard remaps only ~20% of keys (contrasted with modulo where ~80% remap)

**Live readouts**: Per-shard record count, imbalance ratio, cross-shard query count.

---

## Catalog #5 — CAP Theorem & Network Partitions

**Learning objective**: A network partition forces a real choice — you can't have both consistency and availability.

**Visual metaphor**: Two data-center nodes (Node A, Node B) connected by a network link. A big "Sever Connection" toggle in the middle.

**Controls**:
- Partition toggle: Connected / Partitioned
- Mode: CP / AP
- "Write to Node A" and "Read from Node B" buttons

**States**:
- *Connected* — both modes work identically, write propagates, read is fresh
- *CP + Partitioned* — write to A succeeds; read from B returns `503 Unavailable` (preserves consistency)
- *AP + Partitioned* — write to A succeeds; read from B returns stale data (preserves availability)
- *Partition heals* — data syncs, both nodes converge

**Live readouts**: System state label (Consistent / Available / Partitioned), last sync timestamp, error count.

---

## Catalog #6 — Consistency Patterns (Weak / Eventual / Strong)

**Learning objective**: "Eventual" has a visible window where reads can be stale; "strong" eliminates the window but pays a latency penalty.

**Visual metaphor**: 3 replica nodes. A write goes to Node 1; propagation ripples outward with visible delay.

**Controls**:
- Consistency level: Weak, Eventual, Strong
- Replica latency sliders (per-node)
- Quorum parameters (W, R, N) — for strong mode, W+R > N

**States**:
1. *Weak* — write returns immediately; replicas may never converge for that write (fire-and-forget)
2. *Eventual* — write returns, replicas show stale (red) for 1–3 seconds, then flip to fresh (green) as background sync completes
3. *Strong* — write blocks until quorum ACKs received; visibly slower but all subsequent reads are fresh

**Live readouts**: Convergence time (ms), read consistency guarantee (yes/no), write latency.

---

## Catalog #7 — Message Queues & Pub/Sub

**Learning objective**: Queues decouple producers from consumers; bursts are absorbed, not dropped.

**Visual metaphor**: Producer node pushing message blocks into a queue pipe; consumer workers pulling from the other end.

**Controls**:
- Producer rate slider
- Consumer speed slider
- Mode: Point-to-Point / Pub/Sub (fan-out to multiple subscriber channels)
- Consumer count stepper (1–5)
- "Burst produce" button (floods 50 messages at once)

**States**:
1. *Steady state* — production and consumption rates balanced, queue depth near zero
2. *Burst absorption* — producer burst fills queue; consumer drains steadily; no messages dropped
3. *Pub/Sub fan-out* — one message duplicated across 3 subscriber channels simultaneously
4. *Consumer overload* — consumer too slow, queue depth climbs (amber warning → red if near capacity)

**Live readouts**: Queue depth, ingestion rate, consumption lag (ms), messages processed.

---

## Catalog #8 — Queue-Based Load Leveling & Backpressure

**Learning objective**: A queue protects a fragile downstream service from traffic spikes.

**Visual metaphor**: Two parallel paths — "unprotected" (API → DB direct) and "protected" (API → Queue → DB). Same incoming traffic feeds both.

**Controls**:
- Incoming traffic spike button (+500% burst)
- DB max processing rate slider
- Queue max depth slider

**States**:
1. *Unprotected path during spike* — DB CPU spikes to 100%, starts dropping requests (red), cascading failure
2. *Protected path during spike* — queue absorbs burst, DB processes at steady rate, zero drops
3. *Backpressure* — queue nears capacity, sends backpressure signal to producer to slow down

**Live readouts**: DB CPU %, queue fill %, messages dropped (unprotected), messages dropped (protected).

---

## Catalog #9 — Throttling / Rate Limiting (Token Bucket)

**Learning objective**: A token bucket enforces a hard ceiling on request rate.

**Visual metaphor**: A bucket that steadily fills with green tokens. Each incoming request consumes one token. When the bucket is empty, requests bounce off (red, labeled 429 Too Many Requests).

**Controls**:
- Token refill rate (tokens/sec)
- Bucket capacity (max burst size)
- "Send request" button (manual rapid clicking)
- "Burst" button (sends 20 requests instantly)

**States**:
1. *Normal flow* — tokens available, requests pass through green
2. *Bucket draining* — rapid requests depleting tokens, bucket level dropping visibly
3. *Rate limited* — empty bucket, requests rejected with 429 (red bounce animation)
4. *Recovery* — tokens refilling over time, requests start passing again

**Live readouts**: Available tokens, accepted count, rejected (429) count, current rate (req/s).

---

## Catalog #10 — Load Balancer vs. Reverse Proxy

**Learning objective**: Same box, different job — one distributes load, the other protects the origin.

**Visual metaphor**: Two side-by-side flow diagrams.
- *Left: Reverse Proxy view* — external clients → proxy → origin servers. Proxy hides internal IPs, terminates TLS, compresses responses.
- *Right: Load Balancer view* — internal service A → LB → pool of service B instances. LB distributes traffic evenly.

**Controls**:
- Focus toggle: "What does the client see?" / "What does the internal service see?"
- Feature highlights: TLS termination, compression, IP masking, health checks

**States**:
1. Reverse proxy hiding server topology from external clients
2. Load balancer splitting internal microservice calls
3. Highlight: "Same technology (NGINX, HAProxy), different deployment purpose"

**Live readouts**: Visible topology (client-side vs. infra-side), active features.

*Design note*: This is more of an annotated interactive diagram than a particle simulation — appropriate because the distinction is structural/conceptual, not behavioral.

---

## Catalog #11 — Circuit Breaker & Bulkhead

**Learning objective**: Isolating failure stops it from cascading to healthy components.

**Visual metaphor**: API Gateway routing to 3 service pools (Payment, Inventory, Recommendations). Each pool has a circuit breaker icon (closed/open/half-open) and a thread-pool boundary (bulkhead).

**Controls**:
- "Inject failure" on any service (e.g., Recommendations starts returning 500s)
- Failure threshold slider (N failures before trip)
- Recovery timeout slider
- Bulkhead isolation toggle (on/off — to show with vs. without)

**States**:
1. *All healthy (Closed)* — normal traffic flow, all circuits green
2. *Failures accumulate* — Recommendations fails repeatedly, failure counter climbs
3. *Circuit trips Open* — breaker icon flips red; requests to Recommendations fail-fast immediately (no waiting for timeout)
4. *Half-Open probe* — after recovery timeout, single test request sent; if it succeeds, circuit closes
5. *Without bulkhead* — Recommendations failure consumes shared thread pool, Payment and Inventory start timing out too (cascade)
6. *With bulkhead* — Payment and Inventory continue at 100% because they have isolated thread pools

**Live readouts**: Circuit state per service, failure count, thread pool occupancy per bulkhead.

---

## Catalog #12 — Microservices vs. Monolith (Blast Radius)

**Learning objective**: A fault's blast radius depends on the architecture.

**Visual metaphor**: Side-by-side layouts.
- *Left: Monolith* — one big block handling User, Order, Payment, Inventory modules
- *Right: Microservices* — API Gateway → 4 independent service boxes

**Controls**:
- "Inject DB failure in User module" button
- Request type: Place Order / View Profile / Check Inventory

**States**:
1. *Monolith failure* — User DB crash takes down the entire application (all modules in one process)
2. *Microservice isolation* — User service down; Order service continues working (with graceful degradation for user data)
3. *Trade-off callout* — "Microservices add network latency, deployment complexity, and distributed-transaction challenges"

**Live readouts**: System availability %, affected features, blast radius score (1 = isolated, N = total services down).

---

## Catalog #13 — DNS Resolution Lifecycle

**Learning objective**: A domain name becomes an IP through several hierarchical hops.

**Visual metaphor**: Step-by-step packet journey across 5 nodes: Browser Cache → OS Resolver → Root DNS → TLD Server (.com) → Authoritative Server. Each hop timed.

**Controls**:
- Step-by-step mode vs. auto-play
- Cache hit/miss toggle (browser cache, OS cache)
- TTL slider
- Domain input field (cosmetic — e.g., "example.com")

**States**:
1. *Full recursive lookup* — packet visits all 5 nodes, each hop adds latency
2. *Browser cache hit* — resolves immediately at step 1 (fast green)
3. *OS cache hit* — resolves at step 2
4. *TTL expiry* — cached record expires, next lookup goes full recursive again

**Live readouts**: Total resolution time (ms), DNS record type returned (A/AAAA/CNAME), hops taken.

---

## Catalog #14 — Layer 4 vs. Layer 7 Load Balancing

**Learning objective**: L4 only sees TCP/IP headers; L7 can inspect HTTP content and make smarter routing decisions.

**Visual metaphor**: Packet inspector view. Incoming request enters an inspection box.
- *L4 mode*: only Source IP, Dest IP, Port visible (rest of packet grayed out)
- *L7 mode*: full HTTP payload visible — method, path, headers, cookies

**Controls**:
- Layer toggle: L4 / L7
- Request path selector: `/images/cat.jpg` vs. `/api/v1/orders`
- Cookie toggle: `Premium-User: true`

**States**:
1. *L4 routing* — all requests go to same server pool regardless of content (can only hash on IP:Port)
2. *L7 path-based routing* — `/images/*` routed to CDN/static pool, `/api/*` to app pool
3. *L7 header-based routing* — Premium users routed to dedicated high-priority pool

**Live readouts**: Inspected OSI layer, visible metadata fields, routing decision rationale.

---

## Bonus #1 — Consistent Hashing Ring

*Explicitly labeled "Beyond the Core Roadmap" — not presented as part of the source curriculum.*

**Learning objective**: Adding/removing a node on a consistent hash ring remaps only a small slice of keys, unlike modulo hashing where nearly everything remaps.

**Visual metaphor**: Circular ring (0 to 2³²−1) with server nodes and data keys mapped as points on the ring. Keys route to the next clockwise server node.

**Controls**:
- Add Server / Remove Server buttons
- Hash mode toggle: Naive Modulo vs. Consistent Hashing (with virtual nodes)
- Key count slider (10–100)
- "Show virtual nodes" toggle

**States**:
1. *Stable ring* — keys distributed to nearest clockwise node
2. *Add node (consistent)* — only keys between the previous node and the new node remap (~K/N keys)
3. *Add node (modulo)* — nearly all keys remap (red flash on ~80% of keys)
4. *Virtual nodes* — each physical server has multiple ring positions for better balance

**Live readouts**: Keys remapped %, key balance coefficient, virtual-node-to-physical mapping.

---

## Bonus #2 — Long Polling vs. WebSockets vs. Server-Sent Events

*Explicitly labeled "Beyond the Core Roadmap."*

**Learning objective**: Compare connection lifecycle, overhead, and latency across real-time communication strategies.

**Visual metaphor**: Three synchronized vertical timeline charts, each showing request/response frames over time.

**Controls**:
- Server event interval slider (event every N seconds)
- Client count slider
- Protocol selector (show one at a time or all three side-by-side)

**States**:
1. *Short polling* — client hammers server with repeated requests; most return empty 200 (visible overhead)
2. *Long polling* — client sends request, server holds until event; then client re-connects
3. *WebSocket* — single upgrade handshake, then persistent bidirectional frames
4. *SSE* — single connection, server pushes events unidirectionally

**Live readouts**: Network overhead (bytes), active connections, time-to-client latency (ms), total HTTP requests made.

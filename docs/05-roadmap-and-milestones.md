# 05 — Phased Roadmap & Milestones

Three phases. MVP ships first as a usable product (§12: "five great visualizations, not twenty half-finished ones"). Each phase builds on the previous one.

---

## Phase 1 — MVP

**Goal**: Roadmap navigator + both flagships + 3 catalog visualizations + topic template with working notes/resources. A state I'd actually want to sit down and use.

### 1.1 Project Scaffold
- [ ] Initialize Vite + React 18 + TypeScript project
- [ ] Configure path aliases, ESLint, Prettier
- [ ] Set up CSS design tokens (`tokens.css`) and global reset (`global.css`)
- [ ] Self-host fonts: Space Grotesk (display), JetBrains Mono (metrics)
- [ ] Create the dot-grid background canvas texture

### 1.2 Core Layout & Routing
- [ ] Implement `App.tsx` root layout: Header + Sidebar + Content area
- [ ] Set up React Router with route structure from `01-content-map.md`
- [ ] Build `Breadcrumb` component
- [ ] Build responsive layout (sidebar collapses on narrow screens)

### 1.3 Roadmap Navigator
- [ ] Build `RoadmapGraph` component — interactive SVG node graph
- [ ] Render 10 group nodes with topic sub-nodes
- [ ] Click node → navigate to topic route
- [ ] Node color reflects status: not_started (gray), learning (blue), comfortable (amber), mastered (cyan)
- [ ] Hover highlights connected edges

### 1.4 Topic Page Template
- [ ] Build `TopicPage` master layout with all 6 sections
- [ ] Build `ExplanationSection` — renders plain-language text
- [ ] Build `VisualizationSection` wrapper (ControlsBar + Canvas slot + CaptionFeed + TelemetryPanel)
- [ ] Build `RealWorldSection` — bullet list
- [ ] Build `TradeoffsSection` — pros/cons table + "when not to use" callout
- [ ] Build `RelatedTopics` — clickable chips with roadmap hover-highlight
- [ ] Build `ResourceLibrary` — inline status, tags, notes, links

### 1.5 Shared Visualizer Infrastructure
- [ ] Build `ControlsBar` — composable slot-based control strip (sliders, selectors, toggles, steppers)
- [ ] Build `CaptionFeed` — scrolling log synced to simulation events
- [ ] Build `TelemetryPanel` — row of metric readouts with status-colored values
- [ ] Build `useAnimationLoop` hook — requestAnimationFrame with play/pause/speed
- [ ] Build `useIntersectionObserver` hook — auto-pause off-screen viz

### 1.6 Flagship §7.1 — Load Balancer Routing
- [ ] Canvas-based particle flow engine (client → LB → servers)
- [ ] Implement 4 routing algorithms: Round Robin, Least Connections, Weighted, IP Hash
- [ ] Server pool scaling (1–8) with live add/remove
- [ ] Click-to-kill server health toggle
- [ ] Client distribution modes: Uniform vs. Skewed IP
- [ ] Per-server live readouts (connections, RPS, CPU %)
- [ ] Synced caption feed for routing events
- [ ] Failure state: in-flight request to dead server → red flash → reroute

### 1.7 Flagship §7.2 — Horizontal vs. Vertical Scaling
- [ ] Two synchronized canvas panels sharing one load slider
- [ ] Vertical panel: single server with CPU/RAM fill bars, hardware ceiling, downtime on upgrade
- [ ] Horizontal panel: LB icon + auto-spawning server instances, zero-downtime scaling
- [ ] Dropped-packet visualization when vertical maxes out
- [ ] Trade-off banner on horizontal panel (state sync complexity callout)
- [ ] Shared readouts: capacity, drops, cost, latency

### 1.8 Catalog #1 — Caching & Eviction
- [ ] Memory slot grid visualization (5–10 slots)
- [ ] Cache hit (green fast path) vs. miss (yellow slow path through disk)
- [ ] Strategy selector: Cache-Aside, Write-Through, Write-Behind, Refresh-Ahead
- [ ] Eviction policy: LRU, LFU, FIFO with victim highlight
- [ ] Key request buttons (A–H) + auto-generate mode
- [ ] Readouts: hit rate %, eviction count, cache occupancy

### 1.9 Catalog #4 — Database Sharding
- [ ] Router node distributing records into 4 shard buckets with fill bars
- [ ] Strategy selector: Range, Hash (modulo), Consistent Hashing
- [ ] Traffic patterns: Random IDs, Sequential (monotonic), Celebrity hotspot
- [ ] Hot shard warning state (red, imbalance ratio readout)
- [ ] Consistent hashing advantage: show % keys remapped on node add vs. modulo

### 1.10 Catalog #7 — Message Queues & Pub/Sub
- [ ] Producer → Queue buffer → Consumer workers visualization
- [ ] Producer/consumer rate sliders
- [ ] Mode toggle: Point-to-Point vs. Pub/Sub fan-out
- [ ] Consumer count stepper (1–5)
- [ ] Burst button (flood 50 messages)
- [ ] Queue depth visualization with amber/red thresholds
- [ ] Fan-out: message duplicated to multiple subscriber channels

### 1.11 Persistence & Data Export
- [ ] Implement `StorageAdapter` interface
- [ ] Implement IndexedDB adapter using `idb-keyval`
- [ ] Wire Zustand `topicStore` with persist middleware
- [ ] Build JSON export (download as `.json` file)
- [ ] Build JSON import (file picker + validation + merge)
- [ ] Auto-save on every state change (debounced 500ms)

### 1.12 Content: MVP Topic Pages
- [ ] Write explanation, real-world examples, trade-offs for:
  - Horizontal Scaling (§7.2)
  - Load Balancers (§7.1)
  - Caching Strategies (Catalog #1)
  - Database Sharding (Catalog #4)
  - Message Queues (Catalog #7)
- [ ] Populate relatedTopicIds for each

---

## Phase 2 — Full Catalog (v1.0)

**Goal**: All 14 catalog visualizations + 2 bonus visualizations complete. Full topic content for all routes that have interactive visualizations.

### 2.1 Remaining Catalog Visualizations
- [ ] Catalog #2 — CDN (Push vs. Pull) latency map
- [ ] Catalog #3 — Database Replication & Failover
- [ ] Catalog #5 — CAP Theorem network partition simulator
- [ ] Catalog #6 — Consistency Patterns (Weak/Eventual/Strong)
- [ ] Catalog #8 — Queue-Based Load Leveling & Backpressure
- [ ] Catalog #9 — Token Bucket Throttling
- [ ] Catalog #10 — Load Balancer vs. Reverse Proxy
- [ ] Catalog #11 — Circuit Breaker & Bulkhead
- [ ] Catalog #12 — Microservices Blast Radius
- [ ] Catalog #13 — DNS Resolution Lifecycle
- [ ] Catalog #14 — Layer 4 vs. Layer 7 Routing

### 2.2 Bonus Visualizations
- [ ] Bonus #1 — Consistent Hashing Ring (labeled "Beyond the Core Roadmap")
- [ ] Bonus #2 — Long Polling vs. WebSockets vs. SSE (labeled "Beyond the Core Roadmap")

### 2.3 Topic Content Expansion
- [ ] Write explanation, examples, trade-offs for all visualization-backed topics
- [ ] Populate relatedTopicIds cross-links

---

## Phase 3 — Full Curriculum & Polish (v2.0)

**Goal**: All ~28 routes have complete content. UI polish, keyboard shortcuts, search.

### 3.1 Content Completion
- [ ] Write content for all remaining routes (static diagram and prose-only topics)
- [ ] Build interactive diagrams (📊) for non-simulation topics
- [ ] Build static SVG diagrams for prose-only topics (📝)

### 3.2 UI Polish & Accessibility
- [ ] Keyboard shortcuts: Space = Play/Pause, R = Reset, F = Inject Failure
- [ ] Related-topic hover → roadmap graph node highlight (cross-component communication)
- [ ] Global search across topic titles, notes, and tags
- [ ] Tag filtering on roadmap view
- [ ] Smooth page transitions between topics
- [ ] Mobile-responsive visualization controls

### 3.3 Performance
- [ ] Audit Canvas rendering at 60fps across all visualizations
- [ ] Lazy-load visualization components (React.lazy + Suspense)
- [ ] Bundle size audit — ensure D3 is tree-shaken to only imported modules

### 3.4 Could-Have Features (if time permits)
- [ ] Self-check questions per topic
- [ ] Supabase persistence adapter for cross-device sync

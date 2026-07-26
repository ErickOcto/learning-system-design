# 03 — Technical Architecture

## Stack Decisions

| Layer | Choice | 1-Line Justification |
|---|---|---|
| **Framework** | React 18 + TypeScript | Heavy interactive stateful UI with many independent visualization components — React's component model fits naturally; TS catches shape errors in simulation state. |
| **Build tool** | Vite | Near-instant HMR for rapid visualization iteration; fast cold start; simple config. |
| **Styling** | Vanilla CSS with CSS Custom Properties (design tokens) + CSS Modules | Full visual control for the Blueprint aesthetic without utility-class bloat; CSS Modules prevent class collisions across 16+ visualization components. |
| **State management** | Zustand | Lightweight (~1KB), works well with TypeScript, trivially persists to storage via middleware; no boilerplate compared to Redux. React Context alone would cause unnecessary re-renders across deeply nested visualization trees. |
| **Persistence** | IndexedDB via `idb-keyval` behind an abstract `StorageAdapter` interface | Zero setup, generous size limits (vs. localStorage's 5MB), async API. Abstract interface per §10 so Supabase can swap in later. |
| **Routing** | React Router v6 | Standard, well-documented; supports nested routes for topic groups. |

---

## Animation Approach by Visualization Type

| Type | Rendering | Library | Examples |
|---|---|---|---|
| **Particle flows** (many moving elements) | HTML5 Canvas 2D + `requestAnimationFrame` | None (custom loop) | §7.1 request packets, §7.2 dropped packets, Catalog #7 messages, Catalog #9 tokens |
| **Structural diagrams** (nodes, edges, state machines) | SVG + CSS transitions | None (hand-rolled SVG) | Catalog #5 CAP nodes, Catalog #10 LB vs. proxy, Catalog #11 circuit breaker states, Catalog #13 DNS tree |
| **Data-driven layouts** (ring, force graph) | SVG rendering, D3 for layout math only | `d3-shape`, `d3-force` (no D3 DOM binding) | Bonus #1 consistent hashing ring, roadmap node graph |
| **Comparative side-by-side** | Canvas or SVG depending on particle density | Mixed | §7.2 scaling panels, Catalog #8 protected vs. unprotected, Catalog #12 monolith vs. micro |
| **Static/editorial diagrams** | SVG with hover interactions | None | Security patterns, cloud patterns, antipattern diagnostic |

**Performance rule (§10)**: Visualizations pause their `requestAnimationFrame` loop when off-screen (IntersectionObserver). Only one full simulation runs at a time on a topic page.

---

## State Management Architecture

```
┌─────────────────────────────────────────────────┐
│                   React Components               │
│  (TopicPage, RoadmapGraph, VisualizerCanvas)     │
└──────────────┬──────────────────┬────────────────┘
               │ useStore()      │ useStore()
               ▼                  ▼
┌──────────────────┐  ┌──────────────────────────┐
│   topicStore     │  │   visualizerStore         │
│ (Zustand)        │  │ (Zustand, per-viz)        │
│                  │  │                            │
│ - userNotes{}    │  │ - isPlaying               │
│ - userLinks{}    │  │ - speed                   │
│ - topicStatus{}  │  │ - activeCaption           │
│ - tags{}         │  │ - telemetryMetrics[]      │
│ - lastUpdated    │  │ - simulationParams        │
└────────┬─────────┘  └────────────────────────────┘
         │ persist middleware
         ▼
┌──────────────────────────────────────────────────┐
│          StorageAdapter (interface)               │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │ IndexedDB    │    │ SupabaseAdapter (v2)   │  │
│  │ (idb-keyval) │    │ (future, same API)     │  │
│  └──────────────┘    └────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

- `topicStore` — persists to IndexedDB. Holds user notes, links, tags, and per-topic completion status.
- `visualizerStore` — ephemeral (not persisted). Each visualization instance manages its own simulation state.

---

## Persistence Layer & Data Model

### StorageAdapter Interface

```typescript
interface StorageAdapter {
  getAll(): Promise<UserDataExport>;
  getTopic(topicId: string): Promise<UserTopicRecord | null>;
  saveTopic(topicId: string, data: UserTopicRecord): Promise<void>;
  exportAll(): Promise<string>;      // JSON string
  importAll(json: string): Promise<void>;
  clear(): Promise<void>;
}
```

### Core Data Types

```typescript
type TopicStatus = 'not_started' | 'learning' | 'comfortable' | 'mastered';

interface UserLink {
  id: string;          // nanoid
  title: string;       // user-editable
  url: string;
  createdAt: string;   // ISO 8601
}

interface UserTopicRecord {
  topicId: string;     // matches route, e.g. 'foundations/scaling'
  status: TopicStatus;
  notes: string;       // markdown
  links: UserLink[];
  tags: string[];
  updatedAt: string;   // ISO 8601
}

interface UserDataExport {
  version: '1.0';
  exportedAt: string;
  topics: Record<string, UserTopicRecord>;
}
```

### Visualizer State Types

```typescript
interface TelemetryMetric {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'healthy' | 'warning' | 'error' | 'neutral';
}

interface CaptionEntry {
  timestamp: number;     // simulation tick
  text: string;
  severity: 'info' | 'warning' | 'error';
}
```

---

## Folder Structure

```
learning-system-design/
├── docs/                          # Planning docs (this folder)
│   ├── 00-overview.md
│   ├── 01-content-map.md
│   ├── 02-visualization-catalog.md
│   ├── 03-technical-architecture.md
│   ├── 04-topic-page-template.md
│   ├── 05-roadmap-and-milestones.md
│   └── 06-open-questions.md
├── public/
│   └── fonts/                     # Space Grotesk, JetBrains Mono (self-hosted)
├── src/
│   ├── main.tsx                   # App entry, router setup
│   ├── App.tsx                    # Root layout (header + roadmap sidebar + content)
│   ├── styles/
│   │   ├── tokens.css             # CSS custom properties (colors, spacing, fonts)
│   │   ├── global.css             # Reset, base typography, scrollbar styling
│   │   └── utilities.css          # Layout helpers (grid, flex shortcuts)
│   ├── components/
│   │   ├── common/                # Button, Slider, Badge, Modal, Card, Toggle
│   │   ├── layout/                # Header, Sidebar, Breadcrumb, Footer
│   │   ├── roadmap/
│   │   │   └── RoadmapGraph.tsx   # Interactive SVG node graph navigator
│   │   ├── topic/
│   │   │   ├── TopicPage.tsx      # Master template (§6 sections)
│   │   │   ├── ExplanationSection.tsx
│   │   │   ├── VisualizationSection.tsx
│   │   │   ├── RealWorldSection.tsx
│   │   │   ├── TradeoffsSection.tsx
│   │   │   ├── RelatedTopics.tsx
│   │   │   └── ResourceLibrary.tsx  # Notes editor, link manager, status, tags
│   │   └── visualizers/
│   │       ├── shared/            # ControlsBar, TelemetryPanel, CaptionFeed, PlayPauseBtn
│   │       ├── flagship/
│   │       │   ├── LoadBalancerViz.tsx
│   │       │   └── ScalingViz.tsx
│   │       ├── catalog/
│   │       │   ├── CacheEvictionViz.tsx
│   │       │   ├── CdnViz.tsx
│   │       │   ├── ReplicationViz.tsx
│   │       │   ├── ShardingViz.tsx
│   │       │   ├── CapTheoremViz.tsx
│   │       │   ├── ConsistencyViz.tsx
│   │       │   ├── MessageQueueViz.tsx
│   │       │   ├── LoadLevelingViz.tsx
│   │       │   ├── ThrottlingViz.tsx
│   │       │   ├── LbVsProxyViz.tsx
│   │       │   ├── CircuitBreakerViz.tsx
│   │       │   ├── MicroservicesViz.tsx
│   │       │   ├── DnsViz.tsx
│   │       │   └── L4L7Viz.tsx
│   │       └── bonus/
│   │           ├── ConsistentHashingViz.tsx
│   │           └── ConnectionProtocolsViz.tsx
│   ├── data/
│   │   ├── curriculum.ts          # Topic metadata, routes, group structure
│   │   └── topicContent/          # Per-topic explanation, real-world examples, trade-offs
│   ├── hooks/
│   │   ├── useAnimationLoop.ts    # requestAnimationFrame wrapper with pause/resume
│   │   ├── useIntersectionObserver.ts  # Auto-pause off-screen visualizations
│   │   └── useTelemetry.ts        # Metric accumulation and formatting
│   ├── services/
│   │   ├── storage.ts             # StorageAdapter interface + IndexedDB implementation
│   │   └── exportImport.ts        # JSON export/import logic
│   ├── store/
│   │   ├── topicStore.ts          # Zustand: notes, links, status, tags (persisted)
│   │   └── types.ts               # Store type definitions
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   └── utils/
│       ├── canvas.ts              # Canvas drawing helpers (circles, paths, glow effects)
│       ├── hash.ts                # Hash functions for sharding/consistent-hashing viz
│       └── format.ts              # Number formatting, time display
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Design System — "Technical Blueprint"

Per §11: clean, legible, diagram-first. No purple-to-blue gradients, no glassmorphism, no stock hero images.

### Visual Direction

**Aesthetic**: Technical Architecture Sheet / Engineering Blueprint
- Dark navy-slate canvas with faint dot-grid background (like graph paper)
- Generous whitespace so diagrams breathe
- Strong typographic hierarchy with two font families
- Colors used *functionally*, never decoratively

### Design Tokens

```css
:root {
  /* === Background === */
  --bg-primary: #0B0F19;          /* Main canvas */
  --bg-secondary: #111827;        /* Cards, panels */
  --bg-tertiary: #1F2937;         /* Hover states, active controls */
  --bg-surface: #0D1117;          /* Visualization canvas area */

  /* === Functional Status Colors (consistent across ALL visualizations) === */
  --color-healthy: #00F5D4;       /* Cyan-teal — healthy, success, cache hit */
  --color-degraded: #FFD166;      /* Warm amber — warning, stale, lagging */
  --color-down: #EF476F;          /* Coral red — failure, dropped, 503, circuit open */
  --color-active: #118AB2;        /* Electric blue — in-flight, processing, active */
  --color-neutral: #6B7280;       /* Gray — idle, not started */

  /* === Text === */
  --text-primary: #F9FAFB;        /* Headings, labels */
  --text-secondary: #D1D5DB;      /* Body text, explanations */
  --text-muted: #6B7280;          /* Captions, timestamps */

  /* === Border / Structure === */
  --border-primary: #1E293B;      /* Panel borders */
  --border-hover: #374151;        /* Hover state borders */

  /* === Typography === */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* === Spacing === */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* === Radii === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Typography Scale

| Element | Font | Weight | Size |
|---|---|---|---|
| Page title (H1) | Space Grotesk | 700 | 28px |
| Section heading (H2) | Space Grotesk | 600 | 20px |
| Body text | Space Grotesk | 400 | 15px |
| Telemetry readouts | JetBrains Mono | 500 | 13px |
| Caption feed | JetBrains Mono | 400 | 12px |
| Control labels | Space Grotesk | 500 | 13px |

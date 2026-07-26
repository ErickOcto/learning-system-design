# 04 — Topic Page Template

Every topic page uses this 6-section layout (§6). No exceptions — consistency is a design principle.

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Foundations › Horizontal Scaling          [🟢 Comfortable] │
│  ═══════════════════════════════════════════════════════════ │
│                                                             │
│  § 1  WHAT IS THIS?                                        │
│  ─────────────────                                         │
│  A load balancer distributes incoming requests across       │
│  multiple servers so no single machine is overwhelmed.      │
│                                                             │
│  § 2  SEE IT IN ACTION                                     │
│  ─────────────────────                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▶ Play  │ Rate: ████░░ 45/s │ Algo: [Round Robin ▾]│   │
│  │ Servers: [- 3 +]   │ Client dist: [Uniform ▾]      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │            ╭─ ● ─── [LB] ─── ■ Server 1  ███░ 34% │   │
│  │   ● ● ●  ─┤                   ■ Server 2  ██░░ 28% │   │
│  │            ╰─ ● ─── [LB] ─── ■ Server 3  ██░░ 31% │   │
│  │                                                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 💬 "Round Robin: routed req #47 to Server 2"       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ RPS: 45 │ CPU avg: 31% │ Latency: 12ms │ Drop: 0  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  § 3  WHERE IS THIS USED?                                  │
│  ────────────────────────                                   │
│  • NGINX upstream pools for web traffic distribution        │
│  • AWS Application Load Balancer (ALB) for HTTP routing     │
│  • Netflix Eureka + Ribbon for inter-service balancing      │
│                                                             │
│  § 4  TRADE-OFFS                                           │
│  ───────────────                                            │
│  ✅ Pros                    ❌ Cons                         │
│  • No single point of       • Adds network hop + latency   │
│    failure (if LB is HA)    • Session affinity can break    │
│  • Easy horizontal scale    • LB itself must be redundant   │
│                                                             │
│  ⚠ When NOT to use: Single-server hobby project where a    │
│  reverse proxy alone handles the load.                      │
│                                                             │
│  § 5  RELATED TOPICS                                       │
│  ───────────────────                                        │
│  [Reverse Proxy] [Consistent Hashing] [Health Checks]       │
│                                                             │
│  § 6  MY RESOURCES                                         │
│  ────────────────                                           │
│  Status: [Not Started ▾ | Learning | Comfortable |Mastered]│
│  Tags:   [#interview-core] [#must-review] [+ add tag]      │
│                                                             │
│  📝 Notes (Markdown)                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Key insight: Round Robin is stateless but ignores   │   │
│  │ connection weight. Least Connections adapts better   │   │
│  │ to heterogeneous backends…                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔗 Saved Links                                            │
│  • "NGINX Load Balancing Docs" — nginx.org/…    [✏️] [🗑] │
│  • "AWS ALB Deep Dive" — docs.aws…              [✏️] [🗑] │
│  [+ Add Link]                                               │
│                                                             │
│  [📥 Export My Data as JSON]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
TopicPage
├── Breadcrumb               // "Foundations › Horizontal Scaling"
├── TopicHeader               // Title + StatusBadge
├── ExplanationSection        // § 1 — 2-4 sentences, plain language
├── VisualizationSection      // § 2 — wraps the specific viz component
│   ├── ControlsBar           // Shared: sliders, selectors, toggles, steppers
│   ├── SimulationCanvas      // The actual viz (Canvas or SVG)
│   ├── CaptionFeed           // Synced explanatory text (scrolling log)
│   └── TelemetryPanel        // Live metric readouts
├── RealWorldSection          // § 3 — bullet list of production examples
├── TradeoffsSection          // § 4 — pros/cons table + "when not to use"
├── RelatedTopics             // § 5 — linked chips, highlight on roadmap on hover
└── ResourceLibrary           // § 6 — inline, no page-leave
    ├── StatusSelector        // Dropdown: not_started → mastered
    ├── TagEditor             // Inline free-form tag chips
    ├── NotesEditor           // Markdown textarea with preview toggle
    ├── LinkManager           // Add/edit/delete bookmarked links
    └── ExportButton          // JSON export for this topic's data
```

---

## Component Props

```typescript
// TopicPage receives all static content as props (from data/topicContent/)
// and the specific visualizer component to render.

interface TopicPageProps {
  topicId: string;
  title: string;
  group: string;                    // For breadcrumb
  explanation: string;              // 2-4 sentences, plain language
  realWorldExamples: {
    name: string;                   // e.g., "NGINX"
    description: string;           // e.g., "upstream pools for web traffic distribution"
  }[];
  tradeoffs: {
    pros: string[];
    cons: string[];
    whenNotToUse: string;
  };
  relatedTopicIds: string[];        // Route-based IDs for linking
  Visualizer?: React.ComponentType; // Optional — some topics are prose-only
}
```

---

## Section-by-Section Requirements

### § 1 — Explanation
- Maximum 4 sentences. No jargon without immediate definition.
- Connects to the learner's existing knowledge where possible.

### § 2 — Visualization
- Renders the assigned component from `src/components/visualizers/`.
- Always includes: ControlsBar (top), SimulationCanvas (center), CaptionFeed (below canvas), TelemetryPanel (bottom strip).
- If topic has no visualization (e.g., "What is System Design"), shows a static SVG diagram with hover callouts instead.
- **Default to simple**: visualization loads with minimal controls visible. Advanced dials (failure injection, edge cases) revealed via "Show more controls" expander.

### § 3 — Real-World Context
- 3-5 bullet points. Company/technology name + one-line description.
- No marketing language; factual.

### § 4 — Trade-offs
- Two-column layout: Pros (✅) | Cons (❌).
- Followed by a "When NOT to use" callout (amber background).
- This is where the honesty lives — no concept is presented as universally good.

### § 5 — Related Topics
- Rendered as clickable chips/pills.
- On hover: the corresponding node on the roadmap graph (if visible in sidebar) highlights with a glow.
- On click: navigates to that topic page.

### § 6 — Resource Library
- **Status selector**: dropdown with 4 values. Change auto-saves to Zustand → IndexedDB.
- **Tags**: inline chip editor. Type and press Enter. Click X to remove.
- **Notes**: Markdown textarea. Auto-saves on blur or after 1-second debounce. Toggle between edit and preview.
- **Links**: Add via inline form (title + URL). Each link has edit/delete buttons. No auto-fetch of metadata for v1 (per §8).
- Everything saves instantly to local storage. No submit button, no separate settings page.

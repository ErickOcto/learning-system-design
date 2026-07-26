# 00 — Vision, Goals & Non-Goals

## Vision

A personal, single-user web app that teaches system design through **interactive, parameter-driven simulations** rather than static text. The curriculum follows [roadmap.sh/system-design](https://roadmap.sh/system-design) (~130 topic nodes across 10 groups). The learner controls variables — traffic rate, algorithm choice, failure toggles, node counts — and watches the system respond in real time with synced captions explaining *why* each state change happened.

## Goals (v1)

1. **Simulation-first learning** — every visualization responds to user-controlled parameters; no decorative fixed-loop animations.
2. **Contrastive teaching** — concepts defined against each other (horizontal vs. vertical scaling, CP vs. AP, strong vs. eventual consistency) share one set of controls so the difference is *visible*, not described.
3. **Synced explanatory captions** — a running text feed tied to simulation state so the learner always knows *why* the diagram just changed.
4. **Consistent topic structure** — every topic page uses the same 6-section template (explanation → visualization → real-world context → trade-offs → related topics → personal notes).
5. **Local-first persistence** — notes, links, tags, and progress stored in the browser with zero backend setup; one-click JSON export/import so data is never locked in.
6. **Visual roadmap navigator** — the curriculum rendered as an interactive node graph (not a sidebar list), with completion status visible at a glance.

## Explicit Non-Goals (v1)

| Out of scope | Rationale |
|---|---|
| Multi-user auth / identity system | Single-user personal tool; no backend needed. |
| Enterprise infra (K8s, multi-region, admin dashboards) | Violates §12 guardrails — personal learning project. |
| Gamification (streaks, badges, XP, guilt mechanics) | §9 — "low-key and motivating, not stressful." |
| Full coverage of all 130 nodes at launch | §12 — "depth over breadth"; MVP ships 5 great visualizations + roadmap + notes, not 20 half-finished ones. |
| Cross-device sync | §5 "could have (later)"; persistence layer is abstracted so Supabase can plug in later. |
| Self-check quizzes | §5 "could have (later)." |
| Forced animations on text-heavy topics | §4 — "use judgment"; topics like *What is System Design* or *SQL Tuning* get clean static diagrams or prose instead. |

## Assumptions (sensible defaults per §0)

1. **Stack**: Vite + React 18 + TypeScript. Justification in `03-technical-architecture.md`.
2. **Animations**: Canvas 2D (`requestAnimationFrame`) for particle-heavy flows; SVG + CSS for structural diagrams; D3 for layout math only (no D3 DOM binding).
3. **State**: Zustand — lightweight, TypeScript-friendly, trivially syncs with browser storage.
4. **Persistence**: IndexedDB via `idb-keyval` behind a thin adapter interface (swappable to Supabase later per §10).
5. **Design language**: "Technical Blueprint" — dark slate background, monospace metrics, functional status colors (cyan = healthy, amber = degraded, coral = down) used consistently across every visualization.

# 06 — Open Questions

## Genuinely Blocking? No.

Per §0: "For everything else, make a reasonable default choice and state your assumption." Nothing below is architecturally blocking. Defaults are stated. I'm listing these so you can override if you have a strong preference.

---

## Decisions Made (with stated defaults)

### 1. Roadmap graph layout approach

**Default chosen**: Fixed/declarative SVG layout with manually positioned node coordinates matching the roadmap.sh visual hierarchy.

**Alternative considered**: D3 force-directed graph with physics simulation. Rejected because: the roadmap structure is a known, stable hierarchy (10 groups, ~28 consolidated routes) — force-directed layout adds jitter, non-determinism, and complexity for a graph that doesn't change shape. Fixed positions also let us tightly control the visual hierarchy and match the spirit of roadmap.sh.

**Override if**: You want the graph to feel more organic/explorable with draggable nodes.

---

### 2. Particle rendering style for request flows

**Default chosen**: Small glowing dots (3–5px circles with subtle radial gradient glow) following bezier paths. Color-coded by status: blue = in-flight, green = delivered, red = failed/dropped.

**Alternative considered**: Tiny HTTP-envelope icons with protocol labels (e.g., `GET /api`). Rejected because: at 50+ simultaneous particles, icons create visual noise; dots scale cleaner at high request rates.

**Override if**: You want the packets to feel more "real" and don't mind limiting max visible particles.

---

### 3. Markdown editor for notes

**Default chosen**: Plain `<textarea>` with a "Preview" toggle button that renders markdown to HTML (using a lightweight parser like `marked` or `markdown-it`). No WYSIWYG, no split pane.

**Rationale**: Keeps the implementation simple for v1. A full rich-text editor (Tiptap, ProseMirror) is heavier than warranted for personal notes.

**Override if**: You want inline formatting toolbar (bold/italic/link buttons) instead of raw markdown syntax.

---

### 4. Fonts — self-hosted vs. Google Fonts CDN

**Default chosen**: Self-hosted in `public/fonts/`. Downloaded woff2 files for Space Grotesk and JetBrains Mono.

**Rationale**: Zero external requests, works fully offline, no FOUT from CDN latency. The app should run with a single `npm run dev` command (§10).

**Override if**: You prefer the simplicity of a `<link>` tag to Google Fonts and don't mind the external dependency.

---

### 5. State management library

**Default chosen**: Zustand.

**Alternatives considered**:
- React Context alone: would work for notes/status, but causes unnecessary re-renders in deeply nested visualization trees.
- Jotai/Recoil: atom-based model adds indirection for what is fundamentally a simple key-value store of topic records.
- Redux Toolkit: overkill for single-user, no middleware needs beyond persistence.

---

## Questions for You (Optional — Won't Block)

1. **Topic content depth**: For the MVP's 5 topic pages, do you want me to write the explanation/real-world/trade-off text myself (best-effort from general knowledge + roadmap context), or would you prefer placeholder text that you fill in later? **Default: I'll write it.**

2. **Deployment target**: You mentioned Vercel as a natural deployment option (§10). Should I include a `vercel.json` or just leave it as a standard Vite SPA that any static host can serve? **Default: No vendor-specific config; standard `npm run build` output.**

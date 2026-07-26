import { create } from 'zustand';
import { SimulationEngineState, SimulationPacket, NodeMetrics } from './types';

let packetCounter = 1;
let lastEmitTimestamp = 0;

export const usePlaygroundSimulationStore = create<SimulationEngineState>((set, get) => ({
  isPlaying: false,
  speedMultiplier: 1,
  tickCount: 0,
  packets: [],
  metrics: {},
  totalEmitted: 0,
  totalProcessed: 0,
  totalDropped: 0,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speedMultiplier) => set({ speedMultiplier }),

  resetSimulation: () => {
    lastEmitTimestamp = 0;
    packetCounter = 1;
    set({
      isPlaying: false,
      tickCount: 0,
      packets: [],
      metrics: {},
      totalEmitted: 0,
      totalProcessed: 0,
      totalDropped: 0,
    });
  },

  stepSimulation: (deltaMs: number, nodes: any[], edges: any[]) => {
    const state = get();
    if (!state.isPlaying && deltaMs === 0) return;

    const effectiveDelta = (deltaMs / 1000) * state.speedMultiplier;
    const now = performance.now();

    // 1. Client Emission: Find all client nodes and emit packets to outbound edges
    const clientNodes = nodes.filter((n) => n.data?.componentType === 'client');
    const newPackets: SimulationPacket[] = [];

    // Emit packet every ~800ms per client node (or immediately on first tick)
    if (lastEmitTimestamp === 0 || now - lastEmitTimestamp > 800 / state.speedMultiplier) {
      lastEmitTimestamp = now;

      clientNodes.forEach((clientNode) => {
        const outboundEdges = edges.filter((e) => e.source === clientNode.id);
        outboundEdges.forEach((edge) => {
          newPackets.push({
            id: `pkt-${packetCounter++}`,
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            progress: 0,
            speed: 0.8, // 0.8 travel progress per second
            status: 'in_flight',
            color: 'var(--color-accent-primary)',
          });
        });
      });
    }

    let emittedIncrement = newPackets.length;
    let processedIncrement = 0;
    let droppedIncrement = 0;

    // 2. Update existing packets
    const updatedPackets: SimulationPacket[] = [];
    const newMetrics = { ...state.metrics };

    [...state.packets, ...newPackets].forEach((pkt) => {
      const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

      if (nextProgress >= 1) {
        // Packet reached destination node
        const targetNode = nodes.find((n) => n.id === pkt.targetNodeId);
        const isTargetHealthy = targetNode?.data?.status !== 'down';

        const nodeMetric: NodeMetrics = newMetrics[pkt.targetNodeId] || {
          totalProcessed: 0,
          totalDropped: 0,
          currentRps: 0,
        };

        if (isTargetHealthy) {
          nodeMetric.totalProcessed += 1;
          processedIncrement += 1;
        } else {
          nodeMetric.totalDropped += 1;
          droppedIncrement += 1;
        }

        newMetrics[pkt.targetNodeId] = nodeMetric;
      } else {
        // Still in flight
        updatedPackets.push({
          ...pkt,
          progress: nextProgress,
        });
      }
    });

    set((s) => ({
      tickCount: s.tickCount + 1,
      packets: updatedPackets,
      metrics: newMetrics,
      totalEmitted: s.totalEmitted + emittedIncrement,
      totalProcessed: s.totalProcessed + processedIncrement,
      totalDropped: s.totalDropped + droppedIncrement,
    }));
  },
}));

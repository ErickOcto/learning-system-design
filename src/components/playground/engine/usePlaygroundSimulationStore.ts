import { create } from 'zustand';
import { SimulationEngineState, SimulationPacket, NodeMetrics } from './types';
import { LoadBalancerAlgorithm, ClientPattern, DatabaseType } from '../types';

let packetCounter = 1;
let lastEmitTimestampMap: Record<string, number> = {};
let lbRrIndices: Record<string, number> = {};
let rateLimiterTokensMap: Record<string, number> = {};
let mqBufferMap: Record<string, number> = {};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
    lastEmitTimestampMap = {};
    lbRrIndices = {};
    rateLimiterTokensMap = {};
    mqBufferMap = {};
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

    const nodeMap = new Map<string, any>(nodes.map((n) => [n.id, n]));

    // Refill Rate Limiter tokens over time
    nodes.forEach((node) => {
      if (node.data?.componentType === 'rate_limiter') {
        const config = node.data?.config || {};
        const bucketSize = config.bucketSize ?? 10;
        const refillRate = config.refillRate ?? 5;

        const currentTokens = rateLimiterTokensMap[node.id] ?? bucketSize;
        const refilled = Math.min(bucketSize, currentTokens + refillRate * effectiveDelta);
        rateLimiterTokensMap[node.id] = refilled;
      }
    });

    // 1. Client Emission
    const clientNodes = nodes.filter((n) => n.data?.componentType === 'client');
    const newPackets: SimulationPacket[] = [];

    clientNodes.forEach((clientNode) => {
      if (clientNode.data?.status === 'down') return;

      const config = clientNode.data?.config || {};
      const requestRate = config.requestRate || 5;
      const pattern: ClientPattern = config.pattern || 'steady';

      let emitIntervalMs = 1000 / requestRate;
      if (pattern === 'bursty') {
        const sineMultiplier = Math.max(0.2, Math.sin(now / 1000) + 1);
        emitIntervalMs = emitIntervalMs / sineMultiplier;
      }

      const lastEmit = lastEmitTimestampMap[clientNode.id] || 0;
      if (lastEmit === 0 || now - lastEmit > emitIntervalMs / state.speedMultiplier) {
        lastEmitTimestampMap[clientNode.id] = now;

        const outboundEdges = edges.filter((e) => e.source === clientNode.id);
        outboundEdges.forEach((edge) => {
          newPackets.push({
            id: `pkt-${packetCounter++}`,
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            progress: 0,
            speed: 0.8,
            status: 'in_flight',
            color: 'var(--color-accent-primary)',
          });
        });
      }
    });

    let emittedIncrement = newPackets.length;
    let processedIncrement = 0;
    let droppedIncrement = 0;

    const updatedPackets: SimulationPacket[] = [];
    const newMetrics = { ...state.metrics };

    const activeConnectionCounts: Record<string, number> = {};
    state.packets.forEach((p) => {
      activeConnectionCounts[p.targetNodeId] = (activeConnectionCounts[p.targetNodeId] || 0) + 1;
    });

    [...state.packets, ...newPackets].forEach((pkt) => {
      const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

      if (nextProgress >= 1) {
        const targetNode = nodeMap.get(pkt.targetNodeId);

        if (!targetNode) return;

        const isTargetHealthy = targetNode.data?.status !== 'down';
        const componentType = targetNode.data?.componentType;

        const nodeMetric: NodeMetrics = newMetrics[pkt.targetNodeId] || {
          totalProcessed: 0,
          totalDropped: 0,
          currentRps: 0,
        };

        if (componentType === 'load_balancer') {
          // --- LOAD BALANCER ---
          const lbConfig = targetNode.data?.config || {};
          const algorithm: LoadBalancerAlgorithm = lbConfig.algorithm || 'round_robin';
          const healthChecks = lbConfig.healthChecks !== false;

          let outboundEdges = edges.filter((e) => e.source === targetNode.id);

          if (healthChecks) {
            outboundEdges = outboundEdges.filter((e) => {
              const destNode = nodeMap.get(e.target);
              return destNode && destNode.data?.status !== 'down';
            });
          }

          if (outboundEdges.length > 0) {
            let selectedEdge = outboundEdges[0];

            if (algorithm === 'round_robin') {
              const index = (lbRrIndices[targetNode.id] || 0) % outboundEdges.length;
              selectedEdge = outboundEdges[index];
              lbRrIndices[targetNode.id] = index + 1;
            } else if (algorithm === 'least_connections') {
              selectedEdge = outboundEdges.reduce((minEdge, currEdge) => {
                const minConns = activeConnectionCounts[minEdge.target] || 0;
                const currConns = activeConnectionCounts[currEdge.target] || 0;
                return currConns < minConns ? currEdge : minEdge;
              }, outboundEdges[0]);
            } else if (algorithm === 'ip_hash') {
              const hashVal = simpleHash(pkt.id);
              selectedEdge = outboundEdges[hashVal % outboundEdges.length];
            } else if (algorithm === 'weighted') {
              const index = Math.floor(Math.random() * outboundEdges.length);
              selectedEdge = outboundEdges[index];
            }

            updatedPackets.push({
              id: pkt.id,
              edgeId: selectedEdge.id,
              sourceNodeId: selectedEdge.source,
              targetNodeId: selectedEdge.target,
              progress: 0,
              speed: 0.9,
              status: 'in_flight',
              color: 'var(--color-status-healthy)',
            });

            nodeMetric.totalProcessed += 1;
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'rate_limiter') {
          // --- RATE LIMITER (Token Bucket) ---
          const tokens = rateLimiterTokensMap[targetNode.id] ?? 10;

          if (isTargetHealthy && tokens >= 1) {
            // Consume 1 token & forward downstream
            rateLimiterTokensMap[targetNode.id] = tokens - 1;
            const outboundEdges = edges.filter((e) => e.source === targetNode.id);

            if (outboundEdges.length > 0) {
              const forwardEdge = outboundEdges[0];
              updatedPackets.push({
                id: pkt.id,
                edgeId: forwardEdge.id,
                sourceNodeId: forwardEdge.source,
                targetNodeId: forwardEdge.target,
                progress: 0,
                speed: 0.9,
                status: 'in_flight',
                color: 'var(--color-status-healthy)',
              });
              nodeMetric.totalProcessed += 1;
            } else {
              nodeMetric.totalProcessed += 1;
              processedIncrement += 1;
            }
          } else {
            // Rate Limited (429) -> drop packet
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'message_queue') {
          // --- MESSAGE QUEUE ---
          const mqConfig = targetNode.data?.config || {};
          const bufferSize = mqConfig.bufferSize || 20;
          const currentBuffer = mqBufferMap[targetNode.id] || 0;

          if (isTargetHealthy && currentBuffer < bufferSize) {
            mqBufferMap[targetNode.id] = currentBuffer + 1;
            const outboundEdges = edges.filter((e) => e.source === targetNode.id);

            if (outboundEdges.length > 0) {
              const forwardEdge = outboundEdges[0];
              updatedPackets.push({
                id: pkt.id,
                edgeId: forwardEdge.id,
                sourceNodeId: forwardEdge.source,
                targetNodeId: forwardEdge.target,
                progress: 0,
                speed: 0.6,
                status: 'in_flight',
                color: 'var(--color-status-info)',
              });
            }
            nodeMetric.totalProcessed += 1;
            processedIncrement += 1;
          } else {
            // Queue buffer full -> drop packet
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'cdn') {
          // --- CDN / EDGE ---
          const cdnConfig = targetNode.data?.config || {};
          const cacheHitRatio = cdnConfig.cacheHitRatio ?? 80;
          const isHit = Math.random() * 100 < cacheHitRatio;

          if (isTargetHealthy) {
            if (isHit) {
              nodeMetric.totalProcessed += 1;
              processedIncrement += 1;
            } else {
              // CDN Miss -> forward to Origin
              const outboundEdges = edges.filter((e) => e.source === targetNode.id);
              if (outboundEdges.length > 0) {
                const forwardEdge = outboundEdges[0];
                updatedPackets.push({
                  id: pkt.id,
                  edgeId: forwardEdge.id,
                  sourceNodeId: forwardEdge.source,
                  targetNodeId: forwardEdge.target,
                  progress: 0,
                  speed: 0.5,
                  status: 'in_flight',
                  color: 'var(--color-status-warning)',
                });
                nodeMetric.totalProcessed += 1;
              } else {
                nodeMetric.totalProcessed += 1;
                processedIncrement += 1;
              }
            }
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'cache') {
          // --- CACHE NODE LOGIC ---
          const cacheConfig = targetNode.data?.config || {};
          const hitRatio = cacheConfig.hitRatio ?? 70;
          const isHit = Math.random() * 100 < hitRatio;

          if (isTargetHealthy) {
            if (isHit) {
              nodeMetric.totalProcessed += 1;
              processedIncrement += 1;
            } else {
              const outboundEdges = edges.filter((e) => e.source === targetNode.id);
              if (outboundEdges.length > 0) {
                const forwardEdge = outboundEdges[0];
                updatedPackets.push({
                  id: pkt.id,
                  edgeId: forwardEdge.id,
                  sourceNodeId: forwardEdge.source,
                  targetNodeId: forwardEdge.target,
                  progress: 0,
                  speed: 0.7,
                  status: 'in_flight',
                  color: 'var(--color-status-warning)',
                });
                nodeMetric.totalProcessed += 1;
              } else {
                nodeMetric.totalProcessed += 1;
                processedIncrement += 1;
              }
            }
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'database') {
          // --- DATABASE ---
          const dbConfig = targetNode.data?.config || {};
          const dbType: DatabaseType = dbConfig.dbType || 'primary';

          if (isTargetHealthy) {
            nodeMetric.totalProcessed += 1;
            processedIncrement += 1;

            if (dbType === 'primary') {
              const replicaEdges = edges.filter((e) => {
                if (e.source !== targetNode.id) return false;
                const destNode = nodeMap.get(e.target);
                return destNode && destNode.data?.componentType === 'database';
              });

              replicaEdges.forEach((edge) => {
                updatedPackets.push({
                  id: `repl-${packetCounter++}`,
                  edgeId: edge.id,
                  sourceNodeId: edge.source,
                  targetNodeId: edge.target,
                  progress: 0,
                  speed: 0.5,
                  status: 'in_flight',
                  color: 'var(--color-status-warning)',
                });
              });
            }
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else if (componentType === 'server') {
          // --- SERVER ---
          const serverConfig = targetNode.data?.config || {};
          const maxCapacity = serverConfig.maxCapacity || 10;
          const currentLoad = activeConnectionCounts[targetNode.id] || 0;

          if (isTargetHealthy && currentLoad <= maxCapacity) {
            nodeMetric.totalProcessed += 1;
            processedIncrement += 1;
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        } else {
          // Default
          if (isTargetHealthy) {
            nodeMetric.totalProcessed += 1;
            processedIncrement += 1;
          } else {
            nodeMetric.totalDropped += 1;
            droppedIncrement += 1;
          }
        }

        newMetrics[pkt.targetNodeId] = nodeMetric;
      } else {
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

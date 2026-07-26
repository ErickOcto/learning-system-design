// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundSimulationStore } from '../engine/usePlaygroundSimulationStore';

describe('Playground Traffic Nodes (Rate Limiter, MQ, CDN)', () => {
  beforeEach(() => {
    usePlaygroundSimulationStore.getState().resetSimulation();
  });

  it('rejects packets when Rate Limiter token bucket is empty', () => {
    usePlaygroundSimulationStore.getState().play();

    const mockNodes = [
      { id: 'c1', data: { componentType: 'client', status: 'healthy' } },
      {
        id: 'rl1',
        data: {
          componentType: 'rate_limiter',
          status: 'healthy',
          config: { bucketSize: 0, refillRate: 0 }, // 0 tokens -> force 429 rejection
        },
      },
      { id: 's1', data: { componentType: 'server', status: 'healthy' } },
    ];

    const mockEdges = [
      { id: 'e-c1-rl', source: 'c1', target: 'rl1' },
      { id: 'e-rl-s1', source: 'rl1', target: 's1' },
    ];

    // Step 1: Emit packet
    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);

    // Step 2: Packet arrives at Rate Limiter with 0 tokens -> rejected
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);

    const metrics = usePlaygroundSimulationStore.getState().metrics;
    expect(metrics['rl1']?.totalDropped).toBeGreaterThan(0);
  });

  it('buffers and forwards messages through Message Queue', () => {
    usePlaygroundSimulationStore.getState().play();

    const mockNodes = [
      { id: 'c1', data: { componentType: 'client', status: 'healthy' } },
      {
        id: 'mq1',
        data: {
          componentType: 'message_queue',
          status: 'healthy',
          config: { bufferSize: 20, consumerRate: 5 },
        },
      },
      { id: 's1', data: { componentType: 'server', status: 'healthy' } },
    ];

    const mockEdges = [
      { id: 'e-c1-mq', source: 'c1', target: 'mq1' },
      { id: 'e-mq-s1', source: 'mq1', target: 's1' },
    ];

    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);

    const packets = usePlaygroundSimulationStore.getState().packets;
    const hasMqForwardPacket = packets.some((p) => p.edgeId === 'e-mq-s1');

    expect(hasMqForwardPacket).toBe(true);
  });
});

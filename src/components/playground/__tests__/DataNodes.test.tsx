// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundSimulationStore } from '../engine/usePlaygroundSimulationStore';

describe('Playground Data Nodes (Database & Cache)', () => {
  beforeEach(() => {
    usePlaygroundSimulationStore.getState().resetSimulation();
  });

  it('emits replication packets from Primary DB to Replica DB', () => {
    usePlaygroundSimulationStore.getState().play();

    const mockNodes = [
      { id: 'c1', data: { componentType: 'client', status: 'healthy' } },
      {
        id: 'db-primary',
        data: {
          componentType: 'database',
          status: 'healthy',
          config: { dbType: 'primary', replicationLagMs: 300 },
        },
      },
      {
        id: 'db-replica',
        data: {
          componentType: 'database',
          status: 'healthy',
          config: { dbType: 'replica' },
        },
      },
    ];

    const mockEdges = [
      { id: 'e-c1-db', source: 'c1', target: 'db-primary' },
      { id: 'e-db-repl', source: 'db-primary', target: 'db-replica' },
    ];

    // Step 1: Emit from Client
    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);

    // Step 2: Packet arrives at Primary DB -> generates replication packet along e-db-repl
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);

    const packets = usePlaygroundSimulationStore.getState().packets;
    const hasReplicationPacket = packets.some((p) => p.edgeId === 'e-db-repl');

    expect(hasReplicationPacket).toBe(true);
  });

  it('handles Cache miss by forwarding packet downstream to DB', () => {
    usePlaygroundSimulationStore.getState().play();

    const mockNodes = [
      { id: 'c1', data: { componentType: 'client', status: 'healthy' } },
      {
        id: 'cache-1',
        data: {
          componentType: 'cache',
          status: 'healthy',
          config: { hitRatio: 0 }, // 0% hit ratio -> force 100% cache miss
        },
      },
      { id: 'db-1', data: { componentType: 'database', status: 'healthy' } },
    ];

    const mockEdges = [
      { id: 'e-c1-cache', source: 'c1', target: 'cache-1' },
      { id: 'e-cache-db', source: 'cache-1', target: 'db-1' },
    ];

    // Step 1: Emit from Client to Cache
    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);

    // Step 2: Packet hits Cache (Miss) -> forwarded along e-cache-db
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);

    const packets = usePlaygroundSimulationStore.getState().packets;
    const hasMissForwardPacket = packets.some((p) => p.edgeId === 'e-cache-db');

    expect(hasMissForwardPacket).toBe(true);
  });
});

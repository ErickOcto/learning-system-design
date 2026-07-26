// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { indexedDbAdapter } from '../../../storage/indexedDbAdapter';
import { SavedArchitecture } from '../../../types/storage';

describe('Playground Architecture Persistence', () => {
  const mockArch: SavedArchitecture = {
    id: 'arch-test-1',
    name: 'Test Load Balancer Arch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    graph: {
      nodes: [{ id: 'node-1', type: 'playgroundNode' }],
      edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
    },
  };

  beforeEach(async () => {
    const current = await indexedDbAdapter.getSavedArchitectures();
    for (const arch of current) {
      await indexedDbAdapter.deleteArchitecture(arch.id);
    }
  });

  it('saves and retrieves an architecture from IndexedDB', async () => {
    await indexedDbAdapter.saveArchitecture(mockArch);

    const saved = await indexedDbAdapter.getSavedArchitectures();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Test Load Balancer Arch');
    expect(saved[0].graph.nodes).toHaveLength(1);
  });

  it('deletes a saved architecture', async () => {
    await indexedDbAdapter.saveArchitecture(mockArch);
    expect(await indexedDbAdapter.getSavedArchitectures()).toHaveLength(1);

    await indexedDbAdapter.deleteArchitecture(mockArch.id);
    expect(await indexedDbAdapter.getSavedArchitectures()).toHaveLength(0);
  });
});

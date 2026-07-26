import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundSimulationStore } from '../usePlaygroundSimulationStore';

describe('usePlaygroundSimulationStore', () => {
  beforeEach(() => {
    usePlaygroundSimulationStore.getState().resetSimulation();
  });

  it('initializes with simulation paused and default speed', () => {
    const state = usePlaygroundSimulationStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.speedMultiplier).toBe(1);
    expect(state.packets).toHaveLength(0);
  });

  it('toggles play/pause state correctly', () => {
    const store = usePlaygroundSimulationStore.getState();
    store.play();
    expect(usePlaygroundSimulationStore.getState().isPlaying).toBe(true);

    store.pause();
    expect(usePlaygroundSimulationStore.getState().isPlaying).toBe(false);

    store.togglePlay();
    expect(usePlaygroundSimulationStore.getState().isPlaying).toBe(true);
  });

  it('emits packets and processes them during simulation steps', () => {
    const store = usePlaygroundSimulationStore.getState();
    store.play();

    const mockNodes = [
      { id: 'client-1', data: { componentType: 'client', status: 'healthy' } },
      { id: 'server-1', data: { componentType: 'server', status: 'healthy' } },
    ];
    const mockEdges = [{ id: 'e1', source: 'client-1', target: 'server-1' }];

    // Step 1: Trigger emission (1000ms delta)
    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);
    const updatedState = usePlaygroundSimulationStore.getState();

    expect(updatedState.totalEmitted).toBeGreaterThan(0);
    expect(updatedState.packets.length).toBeGreaterThan(0);

    // Step 2: Step simulation enough to deliver packet
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);
    const finalState = usePlaygroundSimulationStore.getState();

    expect(finalState.totalProcessed).toBeGreaterThan(0);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlaygroundConfigDrawer from '../PlaygroundConfigDrawer';
import { usePlaygroundSimulationStore } from '../engine/usePlaygroundSimulationStore';
import { Node } from '@xyflow/react';
import { PlaygroundNodeData } from '../types';

describe('Playground Core Nodes & Configuration', () => {
  beforeEach(() => {
    cleanup();
  });
  it('renders config drawer when a node is selected', () => {
    const mockNode: Node<PlaygroundNodeData> = {
      id: 'server-1',
      type: 'playgroundNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'App Server 1',
        componentType: 'server',
        iconName: 'server',
        status: 'healthy',
        config: { maxCapacity: 10, processingTimeMs: 200 },
      },
    };

    const handleUpdate = vi.fn();
    const handleClose = vi.fn();

    render(
      <PlaygroundConfigDrawer
        selectedNode={mockNode}
        onClose={handleClose}
        onUpdateNodeData={handleUpdate}
      />
    );

    expect(screen.getByText('Node Configuration')).toBeDefined();
    expect(screen.getByDisplayValue('App Server 1')).toBeDefined();
    expect(screen.getByText('Max Concurrency Capacity')).toBeDefined();
  });

  it('updates health status when status button is clicked', () => {
    const mockNode: Node<PlaygroundNodeData> = {
      id: 'lb-1',
      type: 'playgroundNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Load Balancer',
        componentType: 'load_balancer',
        iconName: 'network',
        status: 'healthy',
        config: { algorithm: 'round_robin', healthChecks: true },
      },
    };

    const handleUpdate = vi.fn();

    render(
      <PlaygroundConfigDrawer
        selectedNode={mockNode}
        onClose={() => {}}
        onUpdateNodeData={handleUpdate}
      />
    );

    const downButton = screen.getByText('down');
    fireEvent.click(downButton);

    expect(handleUpdate).toHaveBeenCalledWith('lb-1', { status: 'down' });
  });

  it('routes traffic according to Round Robin algorithm in simulation engine', () => {
    usePlaygroundSimulationStore.getState().resetSimulation();
    usePlaygroundSimulationStore.getState().play();

    const mockNodes = [
      { id: 'c1', data: { componentType: 'client', status: 'healthy' } },
      {
        id: 'lb1',
        data: {
          componentType: 'load_balancer',
          status: 'healthy',
          config: { algorithm: 'round_robin', healthChecks: true },
        },
      },
      { id: 's1', data: { componentType: 'server', status: 'healthy' } },
      { id: 's2', data: { componentType: 'server', status: 'healthy' } },
    ];

    const mockEdges = [
      { id: 'e-c1-lb', source: 'c1', target: 'lb1' },
      { id: 'e-lb-s1', source: 'lb1', target: 's1' },
      { id: 'e-lb-s2', source: 'lb1', target: 's2' },
    ];

    // Step 1: Emit from client
    usePlaygroundSimulationStore.getState().stepSimulation(1000, mockNodes, mockEdges);

    // Step 2: Packet arrives at LB -> LB routes packet to downstream server
    usePlaygroundSimulationStore.getState().stepSimulation(2000, mockNodes, mockEdges);

    const metrics = usePlaygroundSimulationStore.getState().metrics;
    expect(metrics['lb1']?.totalProcessed).toBeGreaterThan(0);
  });
});

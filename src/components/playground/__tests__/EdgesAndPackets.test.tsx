// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { validateConnection } from '../utils/validation';
import { Node } from '@xyflow/react';
import { PlaygroundNodeData } from '../types';

describe('Playground Edges & Packet Validation', () => {
  const nodes: Node<PlaygroundNodeData>[] = [
    {
      id: 'client-1',
      type: 'playgroundNode',
      position: { x: 0, y: 0 },
      data: { label: 'Client', componentType: 'client', iconName: 'users' },
    },
    {
      id: 'lb-1',
      type: 'playgroundNode',
      position: { x: 100, y: 0 },
      data: { label: 'LB', componentType: 'load_balancer', iconName: 'network' },
    },
    {
      id: 'db-1',
      type: 'playgroundNode',
      position: { x: 200, y: 0 },
      data: { label: 'DB', componentType: 'database', iconName: 'database' },
    },
  ];

  it('allows valid connection from Client to Load Balancer', () => {
    const connection = { source: 'client-1', target: 'lb-1', sourceHandle: null, targetHandle: null };
    const result = validateConnection(connection, nodes);
    expect(result.isValid).toBe(true);
  });

  it('rejects connection targeting a Client node', () => {
    const connection = { source: 'lb-1', target: 'client-1', sourceHandle: null, targetHandle: null };
    const result = validateConnection(connection, nodes);
    expect(result.isValid).toBe(false);
    expect(result.warning).toContain('Client nodes only initiate traffic');
  });

  it('rejects self-connection', () => {
    const connection = { source: 'lb-1', target: 'lb-1', sourceHandle: null, targetHandle: null };
    const result = validateConnection(connection, nodes);
    expect(result.isValid).toBe(false);
    expect(result.warning).toContain('Cannot connect a node to itself');
  });
});

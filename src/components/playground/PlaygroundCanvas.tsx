import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlaygroundNode from './customNodes/PlaygroundNode';
import PlaygroundEdge from './customEdges/PlaygroundEdge';
import { ComponentNodeType, PlaygroundNodeData } from './types';
import { useSimulationLoop } from './engine/useSimulationLoop';

const initialNodes: Node<PlaygroundNodeData>[] = [
  {
    id: 'client-1',
    type: 'playgroundNode',
    position: { x: 100, y: 150 },
    data: {
      label: 'Web Client',
      componentType: 'client',
      iconName: 'users',
      config: { requestRate: 5, pattern: 'steady' },
    },
  },
  {
    id: 'lb-1',
    type: 'playgroundNode',
    position: { x: 350, y: 150 },
    data: {
      label: 'Load Balancer',
      componentType: 'load_balancer',
      iconName: 'network',
      config: { algorithm: 'round_robin', healthChecks: true },
    },
  },
  {
    id: 'server-1',
    type: 'playgroundNode',
    position: { x: 600, y: 80 },
    data: {
      label: 'App Server 1',
      componentType: 'server',
      iconName: 'server',
      config: { maxCapacity: 10, processingTimeMs: 200 },
    },
  },
  {
    id: 'server-2',
    type: 'playgroundNode',
    position: { x: 600, y: 220 },
    data: {
      label: 'App Server 2',
      componentType: 'server',
      iconName: 'server',
      config: { maxCapacity: 10, processingTimeMs: 200 },
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-c1-lb1', source: 'client-1', target: 'lb-1', type: 'playgroundEdge' },
  { id: 'e-lb1-s1', source: 'lb-1', target: 'server-1', type: 'playgroundEdge' },
  { id: 'e-lb1-s2', source: 'lb-1', target: 'server-2', type: 'playgroundEdge' },
];

let idCounter = 1;

interface PlaygroundCanvasProps {
  onSelectNode: (node: Node<PlaygroundNodeData> | null) => void;
}

export default function PlaygroundCanvas({
  onSelectNode,
}: PlaygroundCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // Run simulation tick loop
  useSimulationLoop(nodes, edges);

  const nodeTypes = useMemo(
    () => ({
      playgroundNode: PlaygroundNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      playgroundEdge: PlaygroundEdge,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'playgroundEdge',
          },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type') as ComponentNodeType;
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `${type}-${idCounter++}`;

      const defaultConfig =
        type === 'client'
          ? { requestRate: 5, pattern: 'steady' }
          : type === 'load_balancer'
          ? { algorithm: 'round_robin', healthChecks: true }
          : type === 'server'
          ? { maxCapacity: 10, processingTimeMs: 200 }
          : {};

      const newNode: Node<PlaygroundNodeData> = {
        id: newNodeId,
        type: 'playgroundNode',
        position,
        data: {
          label: label || type,
          componentType: type,
          iconName: type,
          status: 'healthy',
          config: defaultConfig,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as Node<PlaygroundNodeData>);
    },
    [onSelectNode]
  );

  const onPaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-bg-base)' }} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--bg-grid-color)" />
        <Controls style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', fill: 'var(--color-text-primary)' }} />
        <MiniMap
          nodeColor={() => 'var(--color-accent-primary)'}
          maskColor="rgba(11, 15, 23, 0.7)"
          style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
        />
      </ReactFlow>
    </div>
  );
}

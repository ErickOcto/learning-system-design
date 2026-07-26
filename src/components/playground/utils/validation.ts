import { Connection, Edge, Node } from '@xyflow/react';
import { PlaygroundNodeData } from '../types';

export interface ConnectionValidationResult {
  isValid: boolean;
  warning?: string;
}

export function validateConnection(
  connection: Connection | Edge,
  nodes: Node<PlaygroundNodeData>[]
): ConnectionValidationResult {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return { isValid: false };
  }

  // Rule 1: No self-connections
  if (connection.source === connection.target) {
    return { isValid: false, warning: 'Cannot connect a node to itself.' };
  }

  const sourceType = sourceNode.data.componentType;
  const targetType = targetNode.data.componentType;

  // Rule 2: Client cannot accept inbound connections
  if ((targetType as string) === 'client') {
    return {
      isValid: false,
      warning: 'Client nodes only initiate traffic and cannot accept incoming connections.',
    };
  }

  // Rule 3: Database cannot send traffic to Client directly
  if (sourceType === 'database' && (targetType as string) === 'client') {
    return {
      isValid: false,
      warning: 'Databases typically do not route outbound traffic directly to clients.',
    };
  }

  return { isValid: true };
}

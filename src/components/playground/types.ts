export type ComponentNodeType =
  | 'client'
  | 'load_balancer'
  | 'server'
  | 'database'
  | 'cache'
  | 'message_queue'
  | 'cdn'
  | 'rate_limiter';

export interface ComponentNodeMeta {
  type: ComponentNodeType;
  label: string;
  category: 'traffic' | 'compute' | 'storage' | 'buffer';
  description: string;
  iconName: string;
}

export interface PlaygroundNodeData {
  label: string;
  componentType: ComponentNodeType;
  iconName: string;
  status?: 'healthy' | 'degraded' | 'down';
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

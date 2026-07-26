export type ComponentNodeType =
  | 'client'
  | 'load_balancer'
  | 'server'
  | 'database'
  | 'cache'
  | 'message_queue'
  | 'cdn'
  | 'rate_limiter';

export type LoadBalancerAlgorithm = 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
export type ClientPattern = 'steady' | 'bursty';
export type DatabaseType = 'primary' | 'replica';
export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO';

export interface ClientNodeConfig {
  requestRate: number; // RPS
  pattern: ClientPattern;
}

export interface LoadBalancerNodeConfig {
  algorithm: LoadBalancerAlgorithm;
  healthChecks: boolean;
}

export interface ServerNodeConfig {
  maxCapacity: number;
  processingTimeMs: number;
}

export interface DatabaseNodeConfig {
  dbType: DatabaseType;
  replicationLagMs: number;
  processingTimeMs: number;
  readWriteSplit: number; // % reads (0 to 100)
}

export interface CacheNodeConfig {
  capacity: number;
  evictionPolicy: EvictionPolicy;
  ttlMs: number;
  hitRatio: number; // % hit ratio (0 to 100)
}

export type NodeConfig =
  | ClientNodeConfig
  | LoadBalancerNodeConfig
  | ServerNodeConfig
  | DatabaseNodeConfig
  | CacheNodeConfig
  | Record<string, unknown>;

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
  config?: NodeConfig;
  activeConnections?: number;
  [key: string]: unknown;
}

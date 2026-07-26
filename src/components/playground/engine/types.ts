export type PacketStatus = 'in_flight' | 'processed' | 'dropped';

export interface SimulationPacket {
  id: string;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0.0 to 1.0
  speed: number;    // progress increment per second
  status: PacketStatus;
  color?: string;
}

export interface NodeMetrics {
  totalProcessed: number;
  totalDropped: number;
  currentRps: number;
}

export interface SimulationEngineState {
  isPlaying: boolean;
  speedMultiplier: number;
  tickCount: number;
  packets: SimulationPacket[];
  metrics: Record<string, NodeMetrics>;
  totalEmitted: number;
  totalProcessed: number;
  totalDropped: number;
  
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  resetSimulation: () => void;
  stepSimulation: (deltaMs: number, nodes: any[], edges: any[]) => void;
}

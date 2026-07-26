import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Database, Zap, Clock, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export type ReplicationMode = 'async' | 'sync';

export interface DbNode {
  id: string;
  name: string;
  role: 'primary' | 'replica';
  version: number;
  isDead: boolean;
  x: number;
  y: number;
}

export interface WalPacket {
  id: string;
  targetNodeId: string;
  version: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
}

export default function ReplicationVisualizer() {
  const [mode, setMode] = useState<ReplicationMode>('async');
  const [latencyMs, setLatencyMs] = useState<number>(400);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Nodes state
  const [nodes, setNodes] = useState<DbNode[]>([
    { id: 'primary', name: 'Primary (Leader)', role: 'primary', version: 1, isDead: false, x: 200, y: 160 },
    { id: 'replica-1', name: 'Replica 1 (Follower)', role: 'replica', version: 1, isDead: false, x: 550, y: 80 },
    { id: 'replica-2', name: 'Replica 2 (Follower)', role: 'replica', version: 1, isDead: false, x: 550, y: 240 },
  ]);

  const [packets, setPackets] = useState<WalPacket[]>([]);
  const [staleReadCount, setStaleReadCount] = useState<number>(0);
  const [consensusState, setConsensusState] = useState<'healthy' | 'election' | 'promoted'>('healthy');
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const modeRef = useRef<ReplicationMode>(mode);
  modeRef.current = mode;

  const latencyRef = useRef<number>(latencyMs);
  latencyRef.current = latencyMs;

  const nodesRef = useRef<DbNode[]>(nodes);
  popsRef: nodesRef.current = nodes;

  const addCaption = useCallback((text: string, severity: 'info' | 'warning' | 'error' = 'info') => {
    setCaptions((prev) => [
      ...prev.slice(-19),
      {
        id: `cap-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        text,
        severity,
      },
    ]);
  }, []);

  const activePrimary = nodes.find((n) => n.role === 'primary' && !n.isDead);

  // Write Data handler
  const handleWriteData = () => {
    const primaryNode = nodes.find((n) => n.role === 'primary');
    if (!primaryNode || primaryNode.isDead) {
      addCaption('Write rejected! No active Primary node in cluster.', 'error');
      return;
    }

    const nextVersion = primaryNode.version + 1;

    // Increment primary version
    setNodes((prev) =>
      prev.map((n) => (n.id === primaryNode.id ? { ...n, version: nextVersion } : n))
    );

    const followers = nodes.filter((n) => n.role === 'replica' && !n.isDead);

    // Create WAL replication packets traveling from Primary to Followers
    const newPackets: WalPacket[] = followers.map((follower) => ({
      id: `wal-${Date.now()}-${follower.id}`,
      targetNodeId: follower.id,
      version: nextVersion,
      startX: primaryNode.x,
      startY: primaryNode.y,
      targetX: follower.x,
      targetY: follower.y,
      progress: 0,
      speed: Math.max(0.2, 1000 / Math.max(100, latencyMs)),
    }));

    setPackets((prev) => [...prev, ...newPackets]);

    if (mode === 'sync') {
      addCaption(`Synchronous Write v${nextVersion} dispatched. Primary waiting for replica ACK...`, 'info');
    } else {
      addCaption(`Asynchronous Write v${nextVersion} committed to Primary. WAL replicating to ${followers.length} replicas...`, 'info');
    }
  };

  // Read from Replica handler
  const handleReadReplica = () => {
    const primaryNode = nodes.find((n) => n.role === 'primary');
    const replicas = nodes.filter((n) => n.role === 'replica' && !n.isDead);

    if (replicas.length === 0) {
      addCaption('No active replicas available for read.', 'warning');
      return;
    }

    const targetReplica = replicas[Math.floor(Math.random() * replicas.length)];
    const primaryVer = primaryNode ? primaryNode.version : targetReplica.version;

    if (targetReplica.version < primaryVer) {
      setStaleReadCount((s) => s + 1);
      addCaption(
        `STALE READ! Client read ${targetReplica.name} at v${targetReplica.version}, while Primary is at v${primaryVer}.`,
        'warning'
      );
    } else {
      addCaption(
        `FRESH READ! Client read ${targetReplica.name} at v${targetReplica.version} (matches Primary).`,
        'info'
      );
    }
  };

  // Kill/Restore Primary handler
  const handleTogglePrimaryHealth = () => {
    const primaryNode = nodes.find((n) => n.role === 'primary');

    if (primaryNode && !primaryNode.isDead) {
      // Kill Primary
      setNodes((prev) =>
        prev.map((n) => (n.id === primaryNode.id ? { ...n, isDead: true } : n))
      );
      setConsensusState('election');
      addCaption('CRITICAL: Primary DB node crashed! Initiating failover consensus election...', 'error');

      // Trigger automatic failover promotion after timeout
      setTimeout(() => {
        setNodes((prev) => {
          const replica1 = prev.find((n) => n.id === 'replica-1');
          if (!replica1) return prev;

          addCaption(`Consensus reached! ${replica1.name} promoted to new Primary Leader.`, 'info');
          setConsensusState('promoted');

          return prev.map((n) => {
            if (n.id === 'replica-1') {
              return { ...n, role: 'primary', name: 'Replica 1 (Promoted Primary)', x: 200, y: 160 };
            }
            if (n.id === 'primary') {
              return { ...n, role: 'replica', name: 'Failed Leader (Dead)', x: 550, y: 80 };
            }
            return n;
          });
        });
      }, 1500);
    } else {
      // Restore failed Primary as new Replica follower
      setNodes((prev) => {
        const activeLeader = prev.find((n) => n.role === 'primary' && !n.isDead);
        const leaderVer = activeLeader ? activeLeader.version : 1;

        addCaption('Failed node restored and re-joined cluster as a Replica follower.', 'info');
        setConsensusState('healthy');

        return prev.map((n) => {
          if (n.isDead) {
            return {
              ...n,
              isDead: false,
              role: 'replica',
              name: `${n.name.split(' ')[0]} (Restored Follower)`,
              version: leaderVer,
            };
          }
          return n;
        });
      });
    }
  };

  // Simulation tick callback
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const nextPackets: WalPacket[] = [];

        prev.forEach((pkt) => {
          const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

          if (nextProgress >= 1) {
            // WAL Packet arrived at target Replica! Update replica version
            setNodes((nodeList) =>
              nodeList.map((n) =>
                n.id === pkt.targetNodeId ? { ...n, version: Math.max(n.version, pkt.version) } : n
              )
            );
            addCaption(`Replica ${pkt.targetNodeId} synchronized WAL entry v${pkt.version}.`, 'info');
          } else {
            nextPackets.push({ ...pkt, progress: nextProgress });
          }
        });

        return nextPackets;
      });
    },
    [speed, addCaption]
  );

  const { togglePlay, reset: resetAnimLoop } = useAnimationLoop({
    isPlaying,
    speed,
    onTick: handleTick,
  });

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    togglePlay();
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const leaderNode = nodes.find((n) => n.role === 'primary');
    const followers = nodes.filter((n) => n.role === 'replica');

    // 1. Draw Network Replication Wires
    if (leaderNode) {
      followers.forEach((follower) => {
        ctx.beginPath();
        ctx.moveTo(leaderNode.x, leaderNode.y);
        ctx.lineTo(follower.x, follower.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = leaderNode.isDead
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(59, 130, 246, 0.4)';
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 2. Draw Database Nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 28, 0, Math.PI * 2);
      ctx.fillStyle = node.isDead
        ? 'rgba(239, 68, 68, 0.15)'
        : node.role === 'primary'
        ? 'var(--color-bg-elevated)'
        : 'var(--color-bg-surface)';
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = node.isDead
        ? 'var(--color-status-error)'
        : node.role === 'primary'
        ? 'var(--color-accent-primary)'
        : 'var(--color-status-healthy)';
      ctx.stroke();

      // Label
      ctx.fillStyle = node.isDead
        ? 'var(--color-status-error)'
        : 'var(--color-text-primary)';
      ctx.font = 'bold 11px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - 36);

      // Version badge inside node
      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText(node.isDead ? 'DEAD' : `v${node.version}`, node.x, node.y + 4);
    });

    // 3. Draw WAL Packet Dots
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = mode === 'sync' ? 'var(--color-status-healthy)' : 'var(--color-status-warning)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [nodes, packets, mode]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setStaleReadCount(0);
    setConsensusState('healthy');
    setNodes([
      { id: 'primary', name: 'Primary (Leader)', role: 'primary', version: 1, isDead: false, x: 200, y: 160 },
      { id: 'replica-1', name: 'Replica 1 (Follower)', role: 'replica', version: 1, isDead: false, x: 550, y: 80 },
      { id: 'replica-2', name: 'Replica 2 (Follower)', role: 'replica', version: 1, isDead: false, x: 550, y: 240 },
    ]);
    addCaption('Database Replication simulation reset.', 'info');
  };

  const primaryDead = !activePrimary;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'REPLICATION LAG', value: latencyMs, unit: 'ms', status: latencyMs < 500 ? 'healthy' : 'warning' },
    { id: 'm2', label: 'STALE READS', value: staleReadCount, unit: 'reads', status: staleReadCount === 0 ? 'healthy' : 'warning' },
    { id: 'm3', label: 'PRIMARY STATUS', value: primaryDead ? 'OFFLINE' : 'ONLINE', status: primaryDead ? 'error' : 'healthy' },
    { id: 'm4', label: 'CONSENSUS STATE', value: consensusState.toUpperCase(), status: consensusState === 'healthy' ? 'healthy' : 'warning' },
  ];

  return (
    <VisualizationContainer
      isPlaying={isPlaying}
      onTogglePlay={handleTogglePlay}
      onReset={handleReset}
      speed={speed}
      onSpeedChange={setSpeed}
      captions={captions}
      metrics={metrics}
      canvasSlot={
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <canvas ref={canvasRef} width={800} height={320} style={{ width: '100%', height: '320px', display: 'block' }} />
        </div>
      }
    >
      {/* Primary Control Dials */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: 'var(--font-size-xs)' }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>REPLICATION MODE:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ReplicationMode)}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-accent-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="async">Asynchronous (Fast Write, Stale Reads)</option>
            <option value="sync">Synchronous (Strict Consistency, Slow Write)</option>
          </select>
        </div>

        {/* Latency Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} style={{ color: 'var(--color-status-warning)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>LATENCY:</span>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={latencyMs}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--color-accent-primary)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{latencyMs}ms</span>
        </div>

        {/* Write Data Button */}
        <button
          onClick={handleWriteData}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-accent-glow)',
            border: '1px solid var(--color-accent-primary)',
            color: 'var(--color-accent-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Database size={12} />
          Write Data to Primary
        </button>

        {/* Read from Replica Button */}
        <button
          onClick={handleReadReplica}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowRight size={12} />
          Read from Replica
        </button>

        {/* Kill / Restore Primary Button */}
        <button
          onClick={handleTogglePrimaryHealth}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: primaryDead ? 'var(--color-status-healthy-bg)' : 'var(--color-status-error-bg)',
            border: `1px solid ${primaryDead ? 'var(--color-status-healthy)' : 'var(--color-status-error)'}`,
            color: primaryDead ? 'var(--color-status-healthy)' : 'var(--color-status-error)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {primaryDead ? <RefreshCw size={12} /> : <ShieldAlert size={12} />}
          {primaryDead ? 'Restore Failed Primary' : 'Kill Primary Node'}
        </button>
      </div>
    </VisualizationContainer>
  );
}

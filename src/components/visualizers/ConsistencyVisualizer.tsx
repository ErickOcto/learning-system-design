import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Zap, Database, ArrowRight } from 'lucide-react';

export type ConsistencyLevel = 'weak' | 'eventual' | 'strong';

export interface ConsistencyNode {
  id: string;
  name: string;
  version: number;
  isLeader: boolean;
  x: number;
  y: number;
}

export interface PropagationPacket {
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

export default function ConsistencyVisualizer() {
  const [level, setLevel] = useState<ConsistencyLevel>('eventual');
  const [writeQuorumW, setWriteQuorumW] = useState<number>(2);
  const [readQuorumR, setReadQuorumR] = useState<number>(2);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [nodes, setNodes] = useState<ConsistencyNode[]>([
    { id: 'node-1', name: 'Node 1 (Leader)', version: 1, isLeader: true, x: 200, y: 160 },
    { id: 'node-2', name: 'Node 2 (Follower)', version: 1, isLeader: false, x: 560, y: 90 },
    { id: 'node-3', name: 'Node 3 (Follower)', version: 1, isLeader: false, x: 560, y: 230 },
  ]);

  const [packets, setPackets] = useState<PropagationPacket[]>([]);
  const [lastWriteLatency, setLastWriteLatency] = useState<number>(20);
  const [lastReadStatus, setLastReadStatus] = useState<string>('N/A');
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const levelRef = useRef<ConsistencyLevel>(level);
  levelRef.current = level;

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

  useEffect(() => {
    if (level === 'weak') {
      addCaption('Weak Consistency: Fire-and-forget writes. Replicas never receive updates automatically.', 'warning');
    } else if (level === 'eventual') {
      addCaption('Eventual Consistency: Write returns fast; replicas converge asynchronously over 1-3s window.', 'info');
    } else {
      addCaption('Strong Consistency: Write blocks until Write Quorum W is satisfied. Guarantees fresh reads if W + R > N.', 'info');
    }
  }, [level, addCaption]);

  // Handle Write Data
  const handleWriteData = () => {
    const leader = nodes.find((n) => n.isLeader)!;
    const nextVer = leader.version + 1;

    if (level === 'weak') {
      // Weak: only leader updates; zero propagation
      setNodes((prev) =>
        prev.map((n) => (n.id === leader.id ? { ...n, version: nextVer } : n))
      );
      setLastWriteLatency(5);
      addCaption(`WEAK WRITE: Leader updated to v${nextVer}. Fire-and-forget: Followers NOT updated.`, 'warning');
    } else if (level === 'eventual') {
      // Eventual: leader updates immediately, async packets stream to followers
      setNodes((prev) =>
        prev.map((n) => (n.id === leader.id ? { ...n, version: nextVer } : n))
      );
      setLastWriteLatency(25);

      const followers = nodes.filter((n) => !n.isLeader);
      const newPackets: PropagationPacket[] = followers.map((f) => ({
        id: `pkt-${Date.now()}-${f.id}`,
        targetNodeId: f.id,
        version: nextVer,
        startX: leader.x,
        startY: leader.y,
        targetX: f.x,
        targetY: f.y,
        progress: 0,
        speed: 0.5, // 2s travel
      }));

      setPackets((prev) => [...prev, ...newPackets]);
      addCaption(`EVENTUAL WRITE: Leader updated to v${nextVer}. Asynchronous replication streaming to followers...`, 'info');
    } else {
      // Strong: Write Quorum W
      const targetCount = writeQuorumW;
      const calculatedLatency = Math.round(50 + (targetCount - 1) * 120);
      setLastWriteLatency(calculatedLatency);

      // Instantly update W nodes (simulating blocking write ACK)
      setNodes((prev) => {
        const sorted = [...prev];
        return sorted.map((n, idx) => (idx < targetCount ? { ...n, version: nextVer } : n));
      });

      addCaption(`STRONG WRITE: Blocked ${calculatedLatency}ms until Write Quorum W=${writeQuorumW} ACKs received. Cluster updated to v${nextVer}.`, 'info');
    }
  };

  // Handle Read Data
  const handleReadData = () => {
    const leader = nodes.find((n) => n.isLeader)!;

    if (level === 'strong') {
      const isQuorumStrong = writeQuorumW + readQuorumR > 3;
      if (isQuorumStrong) {
        setLastReadStatus(`Fresh (v${leader.version})`);
        addCaption(`STRONG READ: Quorum W(${writeQuorumW}) + R(${readQuorumR}) > N(3). Guaranteed fresh data v${leader.version}!`, 'info');
      } else {
        setLastReadStatus(`Weak Quorum (v${leader.version})`);
        addCaption(`WEAK QUORUM WARNING: W(${writeQuorumW}) + R(${readQuorumR}) <= N(3). Risk of reading stale replica!`, 'warning');
      }
    } else {
      const followers = nodes.filter((n) => !n.isLeader);
      const randomFollower = followers[Math.floor(Math.random() * followers.length)];

      if (randomFollower.version < leader.version) {
        setLastReadStatus(`Stale (v${randomFollower.version})`);
        addCaption(`STALE READ: Client queried ${randomFollower.name} at v${randomFollower.version}, while Leader is at v${leader.version}.`, 'warning');
      } else {
        setLastReadStatus(`Fresh (v${randomFollower.version})`);
        addCaption(`FRESH READ: Client queried ${randomFollower.name} at v${randomFollower.version} (converged).`, 'info');
      }
    }
  };

  // Animation tick callback
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const nextPackets: PropagationPacket[] = [];

        prev.forEach((pkt) => {
          const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

          if (nextProgress >= 1) {
            // Reached target node
            setNodes((nodeList) =>
              nodeList.map((n) =>
                n.id === pkt.targetNodeId ? { ...n, version: Math.max(n.version, pkt.version) } : n
              )
            );
            addCaption(`${pkt.targetNodeId.toUpperCase()} converged to v${pkt.version}.`, 'info');
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

    const leader = nodes.find((n) => n.isLeader)!;
    const followers = nodes.filter((n) => !n.isLeader);

    // 1. Draw Network Replication Wires
    followers.forEach((follower) => {
      ctx.beginPath();
      ctx.moveTo(leader.x, leader.y);
      ctx.lineTo(follower.x, follower.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = level === 'weak' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.3)';
      ctx.setLineDash(level === 'weak' ? [4, 4] : [6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Draw Replica Nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 28, 0, Math.PI * 2);
      ctx.fillStyle = node.isLeader ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)';
      ctx.fill();

      const isStale = node.version < leader.version;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = node.isLeader
        ? 'var(--color-accent-primary)'
        : isStale
        ? 'var(--color-status-warning)'
        : 'var(--color-status-healthy)';
      ctx.stroke();

      // Label
      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 11px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - 36);

      // Version badge
      ctx.fillStyle = isStale ? 'var(--color-status-warning)' : 'var(--color-text-primary)';
      ctx.font = 'bold 13px JetBrains Mono';
      ctx.fillText(`v${node.version}`, node.x, node.y + 4);
    });

    // 3. Draw In-Flight Propagation Packets
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [nodes, packets, level]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setLastWriteLatency(20);
    setLastReadStatus('N/A');
    setNodes([
      { id: 'node-1', name: 'Node 1 (Leader)', version: 1, isLeader: true, x: 200, y: 160 },
      { id: 'node-2', name: 'Node 2 (Follower)', version: 1, isLeader: false, x: 560, y: 90 },
      { id: 'node-3', name: 'Node 3 (Follower)', version: 1, isLeader: false, x: 560, y: 230 },
    ]);
    addCaption('Consistency Patterns simulation reset.', 'info');
  };

  const isQuorumStrong = writeQuorumW + readQuorumR > 3;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'CONSISTENCY LEVEL', value: level.toUpperCase(), status: level === 'strong' ? 'healthy' : level === 'eventual' ? 'neutral' : 'warning' },
    { id: 'm2', label: 'WRITE LATENCY', value: lastWriteLatency, unit: 'ms', status: lastWriteLatency < 100 ? 'healthy' : 'warning' },
    { id: 'm3', label: 'QUORUM FORMULA', value: `W(${writeQuorumW})+R(${readQuorumR}) > N(3)`, status: isQuorumStrong ? 'healthy' : 'warning' },
    { id: 'm4', label: 'READ STATUS', value: lastReadStatus, status: lastReadStatus.includes('Stale') || lastReadStatus.includes('Weak') ? 'warning' : 'healthy' },
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
        {/* Level Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>LEVEL:</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ConsistencyLevel)}
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
            <option value="weak">Weak (Fire &amp; Forget)</option>
            <option value="eventual">Eventual (Async Window)</option>
            <option value="strong">Strong (Quorum W + R &gt; N)</option>
          </select>
        </div>

        {/* Quorum Controls (for Strong Mode) */}
        {level === 'strong' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>W:</span>
              <select
                value={writeQuorumW}
                onChange={(e) => setWriteQuorumW(Number(e.target.value))}
                style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px 4px', fontFamily: 'var(--font-mono)' }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>R:</span>
              <select
                value={readQuorumR}
                onChange={(e) => setReadQuorumR(Number(e.target.value))}
                style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px 4px', fontFamily: 'var(--font-mono)' }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </>
        )}

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
          Write Data
        </button>

        {/* Read Data Button */}
        <button
          onClick={handleReadData}
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
          Read Data
        </button>
      </div>
    </VisualizationContainer>
  );
}

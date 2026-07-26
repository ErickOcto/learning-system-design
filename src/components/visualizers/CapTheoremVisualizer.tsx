import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Zap, Database, ArrowRight, Unplug, Activity } from 'lucide-react';

export type CapMode = 'CP' | 'AP';

export interface CapNode {
  id: string;
  name: string;
  version: number;
  x: number;
  y: number;
}

export interface SyncPacket {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  targetVersion: number;
}

export default function CapTheoremVisualizer() {
  const [mode, setMode] = useState<CapMode>('CP');
  const [isPartitioned, setIsPartitioned] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [nodeA, setNodeA] = useState<CapNode>({ id: 'node-a', name: 'Node A (US-West)', version: 1, x: 220, y: 160 });
  const [nodeB, setNodeB] = useState<CapNode>({ id: 'node-b', name: 'Node B (US-East)', version: 1, x: 580, y: 160 });

  const [packets, setPackets] = useState<SyncPacket[]>([]);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [lastReadStatus, setLastReadStatus] = useState<string>('N/A');
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Handle Mode Toggle
  useEffect(() => {
    if (mode === 'CP') {
      addCaption('CP Mode Active: Prioritizes Consistency over Availability. Rejects reads during partitions (503 Error).', 'info');
    } else {
      addCaption('AP Mode Active: Prioritizes Availability over Consistency. Serves stale data during partitions.', 'warning');
    }
  }, [mode, addCaption]);

  // Handle Write to Node A
  const handleWriteNodeA = () => {
    const nextVer = nodeA.version + 1;
    setNodeA((prev) => ({ ...prev, version: nextVer }));

    if (!isPartitioned) {
      // Replicate to Node B
      setPackets((prev) => [
        ...prev,
        {
          id: `pkt-${Date.now()}-${Math.random()}`,
          fromX: nodeA.x,
          fromY: nodeA.y,
          toX: nodeB.x,
          toY: nodeB.y,
          progress: 0,
          speed: 1.2,
          targetVersion: nextVer,
        },
      ]);
      addCaption(`Write v${nextVer} committed to Node A. Replicating to Node B over network link.`, 'info');
    } else {
      addCaption(`Write v${nextVer} committed to Node A. CANNOT replicate: Network link is SEVERED!`, 'warning');
    }
  };

  // Handle Read from Node B
  const handleReadNodeB = () => {
    if (!isPartitioned) {
      setLastReadStatus(`Fresh (v${nodeB.version})`);
      addCaption(`READ SUCCESS: Client read Node B at v${nodeB.version} (matches Node A).`, 'info');
    } else {
      if (mode === 'CP') {
        // CP Mode during partition: Refuse read to prevent stale data
        setErrorCount((e) => e + 1);
        setLastReadStatus('HTTP 503 (Error)');
        addCaption('CP READ REJECTED: HTTP 503 Service Unavailable. Connection severed; refusing stale read for Consistency.', 'error');
      } else {
        // AP Mode during partition: Return stale data to preserve availability
        setErrorCount((e) => e + 1);
        setLastReadStatus(`Stale (v${nodeB.version})`);
        addCaption(`AP STALE READ: Client read Node B at v${nodeB.version}, while Node A is at v${nodeA.version}. Preserved Availability.`, 'warning');
      }
    }
  };

  // Handle Partition Toggle (Sever / Heal)
  const handleTogglePartition = () => {
    setIsPartitioned((prev) => {
      const nextState = !prev;

      if (nextState) {
        addCaption('NETWORK SEVERED! Partition introduced between Datacenter A and Datacenter B.', 'error');
      } else {
        // Heal network: sync versions
        const maxVer = Math.max(nodeA.version, nodeB.version);
        setNodeA((a) => ({ ...a, version: maxVer }));
        setNodeB((b) => ({ ...b, version: maxVer }));
        setPackets([]);
        addCaption(`NETWORK HEALED! Datacenters reconnected. Data converged to v${maxVer}.`, 'info');
      }

      return nextState;
    });
  };

  // Simulation tick loop
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const nextPackets: SyncPacket[] = [];

        prev.forEach((pkt) => {
          const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

          if (nextProgress >= 1) {
            // Reached Node B
            setNodeB((b) => ({ ...b, version: Math.max(b.version, pkt.targetVersion) }));
            addCaption(`Node B synchronized to v${pkt.targetVersion}.`, 'info');
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

    // 1. Draw Network Connection Wire / Partition Cut
    const midX = (nodeA.x + nodeB.x) / 2;
    const midY = (nodeA.y + nodeB.y) / 2;

    if (!isPartitioned) {
      // Solid/Dashed Healthy Link Wire
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'var(--color-status-healthy)';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Severed Link Wires
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(midX - 25, midY);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'var(--color-status-error)';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(midX + 25, midY);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'var(--color-status-error)';
      ctx.stroke();

      // Red 'X' / Lightning Break at center
      ctx.beginPath();
      ctx.arc(midX, midY, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--color-status-error)';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-status-error)';
      ctx.font = 'bold 14px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ SEVERED', midX, midY + 5);
    }

    // 2. Draw Datacenter Nodes (Node A & Node B)
    [nodeA, nodeB].forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 32, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-bg-elevated)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle =
        isPartitioned && node.id === 'node-b' && mode === 'CP'
          ? 'var(--color-status-error)'
          : 'var(--color-accent-primary)';
      ctx.stroke();

      // Node Name Label
      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 12px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - 42);

      // Node Version Inside
      ctx.fillStyle =
        isPartitioned && nodeA.version !== nodeB.version && node.id === 'node-b'
          ? 'var(--color-status-warning)'
          : 'var(--color-text-primary)';
      ctx.font = 'bold 14px JetBrains Mono';
      ctx.fillText(`v${node.version}`, node.x, node.y + 5);
    });

    // 3. Draw Replication Packets
    packets.forEach((p) => {
      const px = p.fromX + (p.toX - p.fromX) * p.progress;
      const py = p.fromY + (p.toY - p.fromY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [nodeA, nodeB, isPartitioned, mode, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setIsPartitioned(false);
    setErrorCount(0);
    setLastReadStatus('N/A');
    setNodeA({ id: 'node-a', name: 'Node A (US-West)', version: 1, x: 220, y: 160 });
    setNodeB({ id: 'node-b', name: 'Node B (US-East)', version: 1, x: 580, y: 160 });
    addCaption('CAP Theorem simulation reset.', 'info');
  };

  const isStale = nodeA.version !== nodeB.version;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'SYSTEM STATE', value: isPartitioned ? `PARTITIONED (${mode})` : 'HEALTHY (SYNCED)', status: isPartitioned ? 'error' : 'healthy' },
    { id: 'm2', label: 'NODE A VERSION', value: `v${nodeA.version}`, unit: '', status: 'healthy' },
    { id: 'm3', label: 'NODE B VERSION', value: `v${nodeB.version}`, unit: isStale ? '(STALE)' : '(FRESH)', status: isStale ? 'warning' : 'healthy' },
    { id: 'm4', label: 'READ STATUS (FAULTS)', value: `${lastReadStatus} [${errorCount}]`, status: errorCount === 0 ? 'healthy' : 'warning' },
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
        {/* CAP Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CAP MODE:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as CapMode)}
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
            <option value="CP">CP (Consistency over Availability — Reject 503)</option>
            <option value="AP">AP (Availability over Consistency — Serve Stale)</option>
          </select>
        </div>

        {/* Partition Sever / Heal Toggle Button */}
        <button
          onClick={handleTogglePartition}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isPartitioned ? 'var(--color-status-healthy-bg)' : 'var(--color-status-error-bg)',
            border: `1px solid ${isPartitioned ? 'var(--color-status-healthy)' : 'var(--color-status-error)'}`,
            color: isPartitioned ? 'var(--color-status-healthy)' : 'var(--color-status-error)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isPartitioned ? <Activity size={12} /> : <Unplug size={12} />}
          {isPartitioned ? 'Heal Network Link' : 'Sever Network Connection'}
        </button>

        {/* Write Node A Button */}
        <button
          onClick={handleWriteNodeA}
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
          Write to Node A
        </button>

        {/* Read Node B Button */}
        <button
          onClick={handleReadNodeB}
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
          Read from Node B
        </button>
      </div>
    </VisualizationContainer>
  );
}

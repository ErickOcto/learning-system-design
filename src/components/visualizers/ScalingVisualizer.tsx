import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Server, Zap, ArrowUpCircle, Layers } from 'lucide-react';

export interface VerticalHardwareTier {
  tier: number;
  name: string;
  cpus: number;
  ramGB: number;
  maxRps: number;
}

export const VERTICAL_TIERS: VerticalHardwareTier[] = [
  { tier: 1, name: 'Micro (1 vCPU, 2GB)', cpus: 1, ramGB: 2, maxRps: 500 },
  { tier: 2, name: 'Medium (2 vCPU, 8GB)', cpus: 2, ramGB: 8, maxRps: 1200 },
  { tier: 3, name: 'Large (4 vCPU, 16GB)', cpus: 4, ramGB: 16, maxRps: 2500 },
  { tier: 4, name: 'X-Large (8 vCPU, 32GB)', cpus: 8, ramGB: 32, maxRps: 5000 },
  { tier: 5, name: 'MAX Ceil (16 vCPU, 64GB)', cpus: 16, ramGB: 64, maxRps: 7500 },
];

interface ScalingPacket {
  id: string;
  side: 'vertical' | 'horizontal';
  targetNodeId?: number;
  progress: number;
  speed: number;
  isDropped?: boolean;
}

export interface ScalingVisualizerProps {
  autoPlay?: boolean;
}

export default function ScalingVisualizer({ autoPlay = false }: ScalingVisualizerProps) {
  // Shared Load Controls
  const [sharedLoad, setSharedLoad] = useState<number>(2000); // req/sec
  const [speed, setSpeed] = useState<number>(1);

  // Vertical Scaling State
  const [verticalTierIdx, setVerticalTierIdx] = useState<number>(1); // Medium (1,200 RPS)
  const [verticalDropped, setVerticalDropped] = useState<number>(0);

  // Horizontal Scaling State
  const [horizontalNodes, setHorizontalNodes] = useState<number>(2); // 2 nodes initially (1,000 RPS)
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [horizontalDropped, setHorizontalDropped] = useState<number>(0);

  // Animation Particles & Captions
  const [packets, setPackets] = useState<ScalingPacket[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScaleTimeRef = useRef<number>(0);

  const currentVerticalTier = VERTICAL_TIERS[verticalTierIdx];
  const nodeCapacity = 500; // Each small horizontal node handles 500 RPS
  const totalHorizontalCapacity = horizontalNodes * nodeCapacity;

  // Caption logger
  const addCaption = useCallback((text: string, severity: 'info' | 'warning' | 'error' = 'info') => {
    setCaptions((prev) => [
      ...prev.slice(-40),
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        text,
        severity,
      },
    ]);
  }, []);

  // Handle Tick loop
  const handleTick = useCallback(() => {
    const now = Date.now();

    // Auto-scale horizontal nodes if load exceeds totalHorizontalCapacity and autoScale is ON
    if (autoScale && sharedLoad > totalHorizontalCapacity && horizontalNodes < 16) {
      if (now - lastScaleTimeRef.current > 1500) {
        lastScaleTimeRef.current = now;
        const newNodesCount = Math.min(16, Math.ceil(sharedLoad / nodeCapacity));
        setHorizontalNodes(newNodesCount);
        addCaption(
          `⚡ Auto-Scaler: Shared load (${sharedLoad} req/s) exceeded capacity. Auto-scaled pool to ${newNodesCount} instances!`,
          'info'
        );
      }
    }

    // Spawn packets for both sides
    const spawnCount = Math.min(6, Math.max(1, Math.floor(sharedLoad / 600)));

    const newPackets: ScalingPacket[] = [];

    for (let i = 0; i < spawnCount; i++) {
      // Vertical packet
      const isVertDropped = sharedLoad > currentVerticalTier.maxRps;
      if (isVertDropped && Math.random() < 0.3) {
        setVerticalDropped((d) => d + 1);
        if (Math.random() < 0.1) {
          addCaption(
            `🔴 Vertical Server (Max ${currentVerticalTier.maxRps} req/s) overloaded! Dropping packets at ${sharedLoad} req/s load.`,
            'error'
          );
        }
      }

      newPackets.push({
        id: Math.random().toString(36).substring(2, 9),
        side: 'vertical',
        progress: 0,
        speed: 0.02 + Math.random() * 0.01,
        isDropped: isVertDropped,
      });

      // Horizontal packet
      const isHorizDropped = sharedLoad > totalHorizontalCapacity && !autoScale;
      if (isHorizDropped && Math.random() < 0.3) {
        setHorizontalDropped((d) => d + 1);
      }

      newPackets.push({
        id: Math.random().toString(36).substring(2, 9),
        side: 'horizontal',
        targetNodeId: Math.floor(Math.random() * horizontalNodes),
        progress: 0,
        speed: 0.02 + Math.random() * 0.01,
        isDropped: isHorizDropped,
      });
    }

    setPackets((prev) => [
      ...prev.filter((p) => p.progress < 1.0).map((p) => ({ ...p, progress: p.progress + p.speed })),
      ...newPackets,
    ]);
  }, [sharedLoad, totalHorizontalCapacity, horizontalNodes, autoScale, currentVerticalTier, addCaption]);

  const { isPlaying, togglePlay, reset } = useAnimationLoop({
    isPlaying: autoPlay,
    speed,
    onTick: handleTick,
  });

  // Render Canvas graphics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const midX = width / 2;

    // Divider Line
    ctx.strokeStyle = 'var(--color-border-subtle)';
    ctx.lineWidth = 1;
    if (ctx.setLineDash) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 10);
    ctx.lineTo(midX, height - 10);
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);

    // === LEFT PANEL: VERTICAL SCALING ===
    ctx.font = 'bold 12px Space Grotesk, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('VERTICAL SCALING (SCALE UP)', midX / 2, 25);

    // Single Vertical Server Box
    const vServerX = midX / 2 - 60;
    const vServerY = height / 2 - 35;
    const vertCpuLoad = Math.min(100, Math.round((sharedLoad / currentVerticalTier.maxRps) * 100));
    const isVertOverloaded = vertCpuLoad >= 100;

    ctx.fillStyle = isVertOverloaded ? 'rgba(244, 63, 94, 0.15)' : '#111827';
    ctx.strokeStyle = isVertOverloaded ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(vServerX, vServerY, 120, 70, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isVertOverloaded ? '#f43f5e' : '#f9fafb';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(currentVerticalTier.name.split(' (')[0], midX / 2, vServerY + 22);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`${currentVerticalTier.cpus} vCPU | ${currentVerticalTier.ramGB}GB RAM`, midX / 2, vServerY + 38);

    // CPU Bar
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(vServerX + 10, vServerY + 48, 100, 10, 3);
    ctx.fill();

    ctx.fillStyle = isVertOverloaded ? '#f43f5e' : vertCpuLoad > 80 ? '#f59e0b' : '#10b981';
    ctx.beginPath();
    ctx.roundRect(vServerX + 10, vServerY + 48, (100 * Math.min(100, vertCpuLoad)) / 100, 10, 3);
    ctx.fill();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`CPU LOAD: ${vertCpuLoad}%`, midX / 2, vServerY + 68);

    // === RIGHT PANEL: HORIZONTAL SCALING ===
    ctx.font = 'bold 12px Space Grotesk, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('HORIZONTAL SCALING (SCALE OUT)', midX + midX / 2, 25);

    // Load Balancer node on horizontal side
    const hLbX = midX + 40;
    const hLbY = height / 2;

    ctx.beginPath();
    ctx.arc(hLbX, hLbY, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#06b6d4';
    ctx.stroke();

    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('LB', hLbX, hLbY + 3);

    // Horizontal Node Pool
    const hServerX = width - 70;
    const maxDisplayNodes = Math.min(horizontalNodes, 8);
    const startY = 45;
    const spacingY = (height - 80) / Math.max(1, maxDisplayNodes - 1 || 1);

    for (let i = 0; i < maxDisplayNodes; i++) {
      const sY = maxDisplayNodes === 1 ? height / 2 : startY + i * spacingY;

      // Line LB -> Node
      ctx.beginPath();
      ctx.moveTo(hLbX + 16, hLbY);
      ctx.lineTo(hServerX - 35, sY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.stroke();

      // Node box
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hServerX - 35, sY - 12, 70, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f9fafb';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(`Node ${i + 1}`, hServerX, sY + 3);
    }

    if (horizontalNodes > 8) {
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`+${horizontalNodes - 8} more nodes`, hServerX, height - 12);
    }

    // === RENDER PACKETS ===
    packets.forEach((p) => {
      if (p.side === 'vertical') {
        const startX = 30;
        const targetX = vServerX;
        const px = startX + (targetX - startX) * p.progress;
        const py = height / 2;

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.isDropped && p.progress > 0.7 ? '#f43f5e' : '#38bdf8';
        ctx.fill();
      } else {
        // Horizontal path: Left edge of right panel -> LB -> Target Node
        let px = midX + 15;
        let py = height / 2;

        if (p.progress <= 0.4) {
          const t = p.progress / 0.4;
          px = midX + 15 + (hLbX - (midX + 15)) * t;
          py = height / 2;
        } else {
          const t = (p.progress - 0.4) / 0.6;
          const nodeIdx = Math.min(p.targetNodeId || 0, maxDisplayNodes - 1);
          const targetY = maxDisplayNodes === 1 ? height / 2 : startY + nodeIdx * spacingY;
          px = hLbX + (hServerX - 35 - hLbX) * t;
          py = height / 2 + (targetY - height / 2) * t;
        }

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.isDropped && p.progress > 0.7 ? '#f43f5e' : '#06b6d4';
        ctx.fill();
      }
    });
  }, [sharedLoad, verticalTierIdx, currentVerticalTier, horizontalNodes, packets]);

  const handleUpgradeVertical = () => {
    if (verticalTierIdx < VERTICAL_TIERS.length - 1) {
      const nextIdx = verticalTierIdx + 1;
      setVerticalTierIdx(nextIdx);
      addCaption(
        `⬆️ Vertical Scaled Up: Upgraded hardware instance to ${VERTICAL_TIERS[nextIdx].name} (Capacity: ${VERTICAL_TIERS[nextIdx].maxRps} req/s)`,
        'info'
      );
    }
  };

  const handleResetSimulation = () => {
    reset();
    setSharedLoad(2000);
    setVerticalTierIdx(1);
    setVerticalDropped(0);
    setHorizontalNodes(2);
    setHorizontalDropped(0);
    setPackets([]);
    addCaption('Simulation reset to default state.', 'info');
  };

  const vertCpuLoadPct = Math.min(100, Math.round((sharedLoad / currentVerticalTier.maxRps) * 100));

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'SHARED LOAD', value: sharedLoad, unit: 'req/s', status: 'healthy' },
    { id: 'm2', label: 'VERT CPU', value: `${vertCpuLoadPct}%`, unit: vertCpuLoadPct >= 100 ? 'OVERLOAD' : '', status: vertCpuLoadPct >= 100 ? 'error' : 'healthy' },
    { id: 'm3', label: 'VERT DROPPED', value: verticalDropped, unit: 'reqs', status: verticalDropped > 0 ? 'error' : 'neutral' },
    { id: 'm4', label: 'HORIZ NODES', value: horizontalNodes, unit: `(${totalHorizontalCapacity} req/s)`, status: 'healthy' },
    { id: 'm5', label: 'HORIZ DROPPED', value: horizontalDropped, unit: 'reqs', status: horizontalDropped > 0 ? 'error' : 'neutral' },
  ];

  return (
    <VisualizationContainer
      isPlaying={isPlaying}
      onTogglePlay={togglePlay}
      onReset={handleResetSimulation}
      speed={speed}
      onSpeedChange={setSpeed}
      captions={captions}
      metrics={metrics}
      canvasSlot={
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <canvas ref={canvasRef} width={750} height={320} style={{ width: '100%', height: '320px', display: 'block' }} />
        </div>
      }
      advancedControls={
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', fontSize: 'var(--font-size-xs)' }}>
          {/* Vertical Upgrade Action */}
          <button
            onClick={handleUpgradeVertical}
            disabled={verticalTierIdx >= VERTICAL_TIERS.length - 1}
            className="status-badge status-badge--healthy"
            style={{
              cursor: verticalTierIdx >= VERTICAL_TIERS.length - 1 ? 'not-allowed' : 'pointer',
              opacity: verticalTierIdx >= VERTICAL_TIERS.length - 1 ? 0.5 : 1,
              padding: '0.3rem 0.6rem',
            }}
          >
            <ArrowUpCircle size={13} />
            Scale Up Vertical Machine ({currentVerticalTier.cpus * 2} vCPU)
          </button>

          {/* Horizontal Auto-Scaler Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={13} style={{ color: 'var(--color-accent-primary)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>AUTO-SCALER:</span>
            <button
              onClick={() => setAutoScale((prev) => !prev)}
              className={`status-badge ${autoScale ? 'status-badge--healthy' : 'status-badge--warning'}`}
              style={{ cursor: 'pointer', padding: '0.2rem 0.6rem' }}
            >
              {autoScale ? 'ON (Auto Pool)' : 'OFF (Fixed Pool)'}
            </button>
          </div>

          {/* Manual Horizontal Stepper */}
          {!autoScale && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Server size={13} style={{ color: 'var(--color-accent-primary)' }} />
              <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>NODES:</span>
              <button
                onClick={() => setHorizontalNodes((n) => Math.max(1, n - 1))}
                style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center' }}>{horizontalNodes}</span>
              <button
                onClick={() => setHorizontalNodes((n) => Math.min(16, n + 1))}
                style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          )}
        </div>
      }
    >
      {/* Primary Shared Load Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-size-xs)' }}>
        <Zap size={14} style={{ color: 'var(--color-status-warning)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>SHARED TRAFFIC LOAD:</span>
        <input
          type="range"
          min="500"
          max="10000"
          step="250"
          value={sharedLoad}
          onChange={(e) => setSharedLoad(Number(e.target.value))}
          style={{ accentColor: 'var(--color-accent-primary)', cursor: 'pointer', width: '180px' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
          {sharedLoad} req/s
        </span>
      </div>
    </VisualizationContainer>
  );
}

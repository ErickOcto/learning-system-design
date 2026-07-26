import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Zap, ArrowRight } from 'lucide-react';

export type RoutingLayer = 'L4' | 'L7';

interface PacketItem {
  id: string;
  path: string;
  isVip: boolean;
  layer: RoutingLayer;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  targetPoolName: string;
}

export default function L4VsL7Visualizer() {
  const [layer, setLayer] = useState<RoutingLayer>('L7');
  const [requestPath, setRequestPath] = useState<string>('/api/v1/orders');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [packets, setPackets] = useState<PacketItem[]>([]);
  const [lastTargetPool, setLastTargetPool] = useState<string>('None');
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

  useEffect(() => {
    if (layer === 'L4') {
      addCaption('Layer 4 Routing: Inspects ONLY IP:Port TCP headers. Fast packet forwarding; blind to HTTP URL paths or headers.', 'info');
    } else {
      addCaption('Layer 7 Routing: Performs DEEP HTTP packet inspection. Routes smartly based on URL paths (/api vs /static) and headers/cookies.', 'info');
    }
  }, [layer, addCaption]);

  // Dispatch Packet
  const handleDispatchPacket = () => {
    const clientX = 100;
    const clientY = 160;

    let targetY = 160;
    let poolName = 'General Pool';

    if (layer === 'L4') {
      // L4: Blind IP:Port hashing -> sends to General Pool regardless of path
      targetY = 160;
      poolName = 'General Server Pool (L4 Hashed)';
      addCaption(`L4 ROUTE: Inspected IP:Port TCP header. Blindly forwarded "${requestPath}" to General Pool (0.2ms latency).`, 'info');
    } else {
      // L7: Smart HTTP inspection
      if (isVip) {
        targetY = 80;
        poolName = 'VIP Dedicated App Cluster';
        addCaption(`L7 SMART ROUTE: Detected Header "Cookie: VIP=true". Routed "${requestPath}" to VIP Dedicated Cluster!`, 'info');
      } else if (requestPath.startsWith('/static')) {
        targetY = 240;
        poolName = 'Static Asset CDN Pool';
        addCaption(`L7 SMART ROUTE: Matched URL Path "/static/*". Forwarded to Static Asset CDN Pool.`, 'info');
      } else {
        targetY = 160;
        poolName = 'Compute Microservice App Pool';
        addCaption(`L7 SMART ROUTE: Matched URL Path "/api/*". Forwarded to Compute Microservice App Pool.`, 'info');
      }
    }

    setLastTargetPool(poolName);
    setPackets((prev) => [
      ...prev,
      {
        id: `pkt-${Date.now()}-${Math.random()}`,
        path: requestPath,
        isVip,
        layer,
        startX: clientX,
        startY: clientY,
        targetX: 700,
        targetY,
        progress: 0,
        speed: 1.1,
        targetPoolName: poolName,
      },
    ]);
  };

  // Simulation tick loop
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const next: PacketItem[] = [];
        prev.forEach((p) => {
          const nextProg = p.progress + p.speed * effectiveDelta;
          if (nextProg < 1) {
            next.push({ ...p, progress: nextProg });
          }
        });
        return next;
      });
    },
    [speed]
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

    const clientX = 100;
    const clientY = 160;
    const routerX = 380;
    const routerY = 160;

    const pools = [
      { y: 80, name: 'VIP Dedicated Pool', color: 'var(--color-status-healthy)' },
      { y: 160, name: layer === 'L4' ? 'General Server Pool' : 'Compute App Pool', color: 'var(--color-accent-primary)' },
      { y: 240, name: 'Static Asset CDN Pool', color: 'var(--color-status-info)' },
    ];

    // 1. Draw Connection Wires
    pools.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(clientX, clientY);
      ctx.lineTo(routerX, routerY);
      ctx.lineTo(700, p.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--color-border-subtle)';
      ctx.stroke();
    });

    // 2. Client Node
    ctx.beginPath();
    ctx.arc(clientX, clientY, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('CLIENT', clientX, clientY + 4);

    // 3. Router Node
    ctx.beginPath();
    ctx.arc(routerX, routerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = layer === 'L4' ? 'var(--color-status-warning)' : 'var(--color-status-healthy)';
    ctx.stroke();

    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText(layer === 'L4' ? 'L4 ROUTER' : 'L7 SMART ROUTER', routerX, routerY - 42);

    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.fillText(layer === 'L4' ? 'TCP/IP (IP:Port)' : 'HTTP Payload Inspect', routerX, routerY + 4);

    // 4. Target Server Pools
    pools.forEach((p) => {
      ctx.beginPath();
      ctx.arc(700, p.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-bg-surface)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.color;
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, 700, p.y - 28);
    });

    // 5. Draw Particles
    packets.forEach((pkt) => {
      const px = pkt.startX + (pkt.targetX - pkt.startX) * pkt.progress;
      const py = pkt.startY + (pkt.targetY - pkt.startY) * pkt.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = pkt.layer === 'L4' ? 'var(--color-status-warning)' : 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [layer, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setLastTargetPool('None');
    addCaption('L4 vs. L7 Routing simulation reset.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'ROUTING LAYER', value: layer === 'L4' ? 'LAYER 4 (TCP)' : 'LAYER 7 (HTTP)', status: layer === 'L7' ? 'healthy' : 'neutral' },
    { id: 'm2', label: 'PAYLOAD INSPECTION', value: layer === 'L4' ? 'DISABLED (IP:PORT)' : 'DEEP PACKET (FULL)', status: layer === 'L7' ? 'healthy' : 'warning' },
    { id: 'm3', label: 'ROUTED TARGET POOL', value: lastTargetPool, status: 'healthy' },
    { id: 'm4', label: 'OVERHEAD LATENCY', value: layer === 'L4' ? '0.2ms (ULTRA FAST)' : '1.5ms (INSPECTION)', status: 'healthy' },
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
        {/* Layer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>LAYER:</span>
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value as RoutingLayer)}
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
            <option value="L4">Layer 4 (TCP / IP:Port Transport)</option>
            <option value="L7">Layer 7 (HTTP Smart Content Router)</option>
          </select>
        </div>

        {/* Path Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>URL PATH:</span>
          <select
            value={requestPath}
            onChange={(e) => setRequestPath(e.target.value)}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <option value="/api/v1/orders">/api/v1/orders (Compute App)</option>
            <option value="/static/cat.jpg">/static/cat.jpg (Static CDN)</option>
            <option value="/video/stream.mp4">/video/stream.mp4 (Media Asset)</option>
          </select>
        </div>

        {/* VIP Cookie Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={isVip}
            onChange={(e) => setIsVip(e.target.checked)}
          />
          VIP Cookie Header
        </label>

        {/* Dispatch Packet Button */}
        <button
          onClick={handleDispatchPacket}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
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
          <ArrowRight size={12} />
          Dispatch Packet
        </button>
      </div>
    </VisualizationContainer>
  );
}

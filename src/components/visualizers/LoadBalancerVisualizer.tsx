import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Server, Zap } from 'lucide-react';

export type RoutingAlgorithm = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
export type ClientTrafficMode = 'uniform' | 'skewed';

export interface ServerInstance {
  id: number;
  name: string;
  isHealthy: boolean;
  activeConnections: number;
  weight: number;
  totalProcessed: number;
  cpuLoad: number;
}

interface Packet {
  id: string;
  clientIp: string;
  targetServerId: number | null;
  progress: number;
  speed: number;
  color: string;
  isFailed?: boolean;
}

export interface LoadBalancerVisualizerProps {
  autoPlay?: boolean;
}

export default function LoadBalancerVisualizer({ autoPlay = false }: LoadBalancerVisualizerProps) {
  // Controls state
  const [algorithm, setAlgorithm] = useState<RoutingAlgorithm>('round-robin');
  const [serverCount, setServerCount] = useState<number>(3);
  const [requestRate, setRequestRate] = useState<number>(30); // req/sec
  const [clientMode, setClientMode] = useState<ClientTrafficMode>('uniform');
  const [speed, setSpeed] = useState<number>(1);

  // Simulation state
  const [servers, setServers] = useState<ServerInstance[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Server ${i + 1}`,
      isHealthy: true,
      activeConnections: 0,
      weight: (i % 3) + 1, // Weights 1, 2, 3
      totalProcessed: 0,
      cpuLoad: 15 + Math.floor(Math.random() * 20),
    }))
  );

  const [packets, setPackets] = useState<Packet[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [droppedCount, setDroppedCount] = useState<number>(0);

  const rrIndexRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Log caption helper
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

  // Algorithm Routing Logic
  const getNextServerId = useCallback(
    (clientIp: string, activeServers: ServerInstance[]): number | null => {
      const healthy = activeServers.filter((s) => s.isHealthy);
      if (healthy.length === 0) return null;

      switch (algorithm) {
        case 'round-robin': {
          const idx = rrIndexRef.current % healthy.length;
          rrIndexRef.current = (rrIndexRef.current + 1) % healthy.length;
          return healthy[idx].id;
        }

        case 'least-connections': {
          const sorted = [...healthy].sort((a, b) => a.activeConnections - b.activeConnections);
          return sorted[0].id;
        }

        case 'weighted': {
          const totalWeight = healthy.reduce((acc, s) => acc + s.weight, 0);
          let randomWeight = Math.random() * totalWeight;
          for (const s of healthy) {
            randomWeight -= s.weight;
            if (randomWeight <= 0) return s.id;
          }
          return healthy[0].id;
        }

        case 'ip-hash': {
          let hash = 0;
          for (let i = 0; i < clientIp.length; i++) {
            hash = (hash << 5) - hash + clientIp.charCodeAt(i);
          }
          const idx = Math.abs(hash) % healthy.length;
          return healthy[idx].id;
        }
      }
    },
    [algorithm]
  );

  // Generate packet based on requestRate
  const spawnPacket = useCallback(() => {
    const activePool = servers.slice(0, serverCount);
    const clientIps =
      clientMode === 'skewed'
        ? ['192.168.1.100', '192.168.1.100', '192.168.1.100', '192.168.1.100', '10.0.0.5']
        : ['192.168.1.10', '10.0.0.12', '172.16.0.4', '192.168.1.100', '10.0.0.55'];

    const clientIp = clientIps[Math.floor(Math.random() * clientIps.length)];
    const targetId = getNextServerId(clientIp, activePool);

    if (targetId === null) {
      setDroppedCount((prev) => prev + 1);
      addCaption('All backend servers dead! Request dropped (503 Service Unavailable).', 'error');
      return;
    }

    const targetServer = activePool.find((s) => s.id === targetId);

    const newPacket: Packet = {
      id: Math.random().toString(36).substring(2, 9),
      clientIp,
      targetServerId: targetId,
      progress: 0,
      speed: 0.02 + Math.random() * 0.01,
      color: clientIp === '192.168.1.100' ? '#f59e0b' : '#38bdf8',
    };

    setPackets((prev) => [...prev.slice(-30), newPacket]);

    // Update active connection count
    setServers((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              activeConnections: s.activeConnections + 1,
              totalProcessed: s.totalProcessed + 1,
              cpuLoad: Math.min(100, s.cpuLoad + 2),
            }
          : s
      )
    );

    addCaption(
      `[${algorithm.toUpperCase()}] Routed request from ${clientIp} to ${targetServer?.name || 'Server'}`
    );
  }, [servers, serverCount, clientMode, getNextServerId, algorithm, addCaption]);

  // Tick loop update
  const handleTick = useCallback(() => {
    if (Math.random() < requestRate / 60) {
      spawnPacket();
    }

    setPackets((prev) =>
      prev
        .map((p) => {
          const nextProgress = p.progress + p.speed;

          const targetServer = servers.find((s) => s.id === p.targetServerId);
          if (targetServer && !targetServer.isHealthy && nextProgress > 0.5 && !p.isFailed) {
            setDroppedCount((d) => d + 1);
            addCaption(`Server ${targetServer.id} died mid-flight! Request dropped.`, 'error');
            return { ...p, isFailed: true, color: '#f43f5e', progress: nextProgress };
          }

          return { ...p, progress: nextProgress };
        })
        .filter((p) => p.progress < 1.0)
    );

    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        activeConnections: Math.max(0, s.activeConnections - (Math.random() > 0.7 ? 1 : 0)),
        cpuLoad: s.isHealthy
          ? Math.max(10, Math.min(95, s.cpuLoad + (s.activeConnections > 3 ? 1 : -0.5)))
          : 0,
      }))
    );
  }, [requestRate, spawnPacket, servers, addCaption]);

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const clientX = 60;
    const lbX = canvas.width / 2;
    const activePool = servers.slice(0, serverCount);
    const serverX = canvas.width - 90;

    // Draw LB Node
    ctx.beginPath();
    ctx.arc(lbX, canvas.height / 2, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.font = 'bold 11px Space Grotesk, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('LOAD BALANCER', lbX, canvas.height / 2 + 35);
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(algorithm.toUpperCase(), lbX, canvas.height / 2 + 48);

    // Draw Active Servers
    const startY = 40;
    const spacingY = (canvas.height - 80) / Math.max(1, activePool.length - 1 || 1);

    activePool.forEach((server, i) => {
      const sY = activePool.length === 1 ? canvas.height / 2 : startY + i * spacingY;

      ctx.beginPath();
      ctx.moveTo(lbX + 24, canvas.height / 2);
      ctx.lineTo(serverX - 45, sY);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = server.isHealthy ? 'rgba(56, 189, 248, 0.25)' : 'rgba(244, 63, 94, 0.2)';
      ctx.stroke();

      ctx.fillStyle = server.isHealthy ? '#111827' : 'rgba(244, 63, 94, 0.1)';
      ctx.strokeStyle = server.isHealthy ? '#06b6d4' : '#f43f5e';
      ctx.lineWidth = server.isHealthy ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(serverX - 45, sY - 18, 90, 36, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = server.isHealthy ? '#f9fafb' : '#f43f5e';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(server.name, serverX - 35, sY - 2);

      ctx.fillStyle = server.isHealthy ? '#9ca3af' : '#f43f5e';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(
        server.isHealthy ? `Conn: ${server.activeConnections} | CPU: ${Math.round(server.cpuLoad)}%` : 'OFFLINE',
        serverX - 35,
        sY + 11
      );
    });

    // Draw In-Flight Packets
    packets.forEach((p) => {
      let px = clientX;
      let py = canvas.height / 2;

      if (p.progress <= 0.5) {
        const t = p.progress / 0.5;
        px = clientX + (lbX - clientX) * t;
        py = canvas.height / 2;
      } else {
        const t = (p.progress - 0.5) / 0.5;
        const targetIndex = activePool.findIndex((s) => s.id === p.targetServerId);
        if (targetIndex !== -1) {
          const sY = activePool.length === 1 ? canvas.height / 2 : startY + targetIndex * spacingY;
          px = lbX + (serverX - 45 - lbX) * t;
          py = canvas.height / 2 + (sY - canvas.height / 2) * t;
        }
      }

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [servers, serverCount, packets, algorithm]);

  const toggleServerHealth = (serverId: number) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === serverId) {
          const nextHealth = !s.isHealthy;
          addCaption(
            `Server ${serverId} turned ${nextHealth ? 'ONLINE (Healthy)' : 'OFFLINE (Unhealthy)'}`,
            nextHealth ? 'info' : 'warning'
          );
          return { ...s, isHealthy: nextHealth, activeConnections: 0, cpuLoad: 0 };
        }
        return s;
      })
    );
  };

  const handleResetSimulation = () => {
    reset();
    setPackets([]);
    setDroppedCount(0);
    setServers(
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Server ${i + 1}`,
        isHealthy: true,
        activeConnections: 0,
        weight: (i % 3) + 1,
        totalProcessed: 0,
        cpuLoad: 15,
      }))
    );
    addCaption('Simulation reset to default state.', 'info');
  };

  const activePool = servers.slice(0, serverCount);
  const healthyCount = activePool.filter((s) => s.isHealthy).length;
  const totalActiveConns = activePool.reduce((acc, s) => acc + s.activeConnections, 0);

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'TARGET RPS', value: requestRate, unit: 'req/s', status: 'healthy' },
    { id: 'm2', label: 'ACTIVE POOL', value: `${healthyCount}/${serverCount}`, unit: 'nodes', status: healthyCount === serverCount ? 'healthy' : 'warning' },
    { id: 'm3', label: 'ACTIVE CONNS', value: totalActiveConns, unit: 'connections', status: 'neutral' },
    { id: 'm4', label: 'DROPPED REQS', value: droppedCount, unit: 'failed', status: droppedCount > 0 ? 'error' : 'neutral' },
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

          {/* Clickable Server Health Toggles Strip */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '15px',
              display: 'flex',
              gap: '0.35rem',
              backgroundColor: 'var(--color-bg-base)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
              TOGGLE HEALTH:
            </span>
            {activePool.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleServerHealth(s.id)}
                className={`status-badge ${s.isHealthy ? 'status-badge--healthy' : 'status-badge--error'}`}
                style={{ cursor: 'pointer', padding: '1px 5px', fontSize: '10px' }}
                title={`Click to mark ${s.name} ${s.isHealthy ? 'Unhealthy' : 'Healthy'}`}
              >
                S{s.id} {s.isHealthy ? '✓' : '✗'}
              </button>
            ))}
          </div>
        </div>
      }
      advancedControls={
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', fontSize: 'var(--font-size-xs)' }}>
          {/* Traffic Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>TRAFFIC:</span>
            <select
              value={clientMode}
              onChange={(e) => setClientMode(e.target.value as ClientTrafficMode)}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="uniform">Uniform Distribution</option>
              <option value="skewed">Skewed IP Hotspot (80% IP 192.168.1.100)</option>
            </select>
          </div>

          {/* Rate Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={13} style={{ color: 'var(--color-status-warning)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>RATE:</span>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={requestRate}
              onChange={(e) => setRequestRate(Number(e.target.value))}
              style={{ accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{requestRate}/s</span>
          </div>
        </div>
      }
    >
      {/* Primary Control Dials */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: 'var(--font-size-xs)' }}>
        {/* Algorithm Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>ALGO:</span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as RoutingAlgorithm)}
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
            <option value="round-robin">Round Robin</option>
            <option value="least-connections">Least Connections</option>
            <option value="weighted">Weighted Round Robin</option>
            <option value="ip-hash">IP Hash (Sticky IP)</option>
          </select>
        </div>

        {/* Server Count Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Server size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>SERVERS:</span>
          <button
            onClick={() => setServerCount((c) => Math.max(1, c - 1))}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: '22px',
              height: '22px',
              cursor: 'pointer',
            }}
          >
            -
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>
            {serverCount}
          </span>
          <button
            onClick={() => setServerCount((c) => Math.min(8, c + 1))}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: '22px',
              height: '22px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      </div>
    </VisualizationContainer>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { ArrowRight, Zap } from 'lucide-react';

export type ArchRole = 'reverse_proxy' | 'load_balancer' | 'combined';

interface RequestParticle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  serverIdx?: number;
}

export default function LbVsProxyVisualizer() {
  const [role, setRole] = useState<ArchRole>('reverse_proxy');
  const [enableTls, setEnableTls] = useState<boolean>(true);
  const [enableMasking, setEnableMasking] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [rrIndex, setRrIndex] = useState<number>(0);
  const [packets, setPackets] = useState<RequestParticle[]>([]);
  const [requestCount, setRequestCount] = useState<number>(0);
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
    if (role === 'reverse_proxy') {
      addCaption('Reverse Proxy Mode Active: Sits at the edge to terminate TLS, mask internal IPs, and compress responses.', 'info');
    } else if (role === 'load_balancer') {
      addCaption('Load Balancer Mode Active: Sits between clients/services to distribute traffic load across backend pools.', 'info');
    } else {
      addCaption('Combined Mode Active: Modern reverse proxies (NGINX, Envoy, HAProxy) perform both roles simultaneously!', 'info');
    }
  }, [role, addCaption]);

  // Dispatch Request
  const handleDispatchRequest = () => {
    setRequestCount((c) => c + 1);

    const clientX = 100;
    const clientY = 160;

    if (role === 'reverse_proxy') {
      const originX = 700;
      const originY = 160;

      setPackets((prev) => [
        ...prev,
        {
          id: `pkt-${Date.now()}-${Math.random()}`,
          startX: clientX,
          startY: clientY,
          targetX: originX,
          targetY: originY,
          progress: 0,
          speed: 1.2,
        },
      ]);

      const tlsStr = enableTls ? 'HTTPS terminated → decrypted HTTP forwarded.' : 'Cleartext HTTP passed.';
      const maskStr = enableMasking ? 'Backend IP masked (10.0.4.12 hidden).' : 'Backend IP exposed.';
      addCaption(`Reverse Proxy processed request. ${tlsStr} ${maskStr}`, 'info');
    } else {
      // Load Balancer or Combined Mode
      const serversY = [80, 160, 240];
      const targetSrvIdx = rrIndex % 3;
      setRrIndex((prev) => prev + 1);

      const targetX = 700;
      const targetY = serversY[targetSrvIdx];

      setPackets((prev) => [
        ...prev,
        {
          id: `pkt-${Date.now()}-${Math.random()}`,
          startX: clientX,
          startY: clientY,
          targetX,
          targetY,
          progress: 0,
          speed: 1.2,
          serverIdx: targetSrvIdx,
        },
      ]);

      addCaption(`Load Balancer routed request to Server ${targetSrvIdx + 1} (Round Robin).`, 'info');
    }
  };

  // Simulation tick loop
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const next: RequestParticle[] = [];
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
    const proxyX = 400;
    const proxyY = 160;

    // 1. Draw Client Node
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
    ctx.fillText('CLIENT', clientX, clientY - 4);
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.fillText('203.0.113.5', clientX, clientY + 8);

    // 2. Draw Proxy / Load Balancer Central Gateway Node
    ctx.beginPath();
    ctx.arc(proxyX, proxyY, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = role === 'reverse_proxy' ? 'var(--color-status-healthy)' : 'var(--color-accent-primary)';
    ctx.stroke();

    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    const roleTitle = role === 'reverse_proxy' ? 'REVERSE PROXY' : role === 'load_balancer' ? 'LOAD BALANCER' : 'DUAL ROLE (NGINX)';
    ctx.fillText(roleTitle, proxyX, proxyY - 42);

    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.fillText(enableTls ? '🔒 TLS Terminated' : '🔓 HTTP Clear', proxyX, proxyY - 4);
    ctx.fillText(enableMasking ? '🛡️ IPs Masked' : '🌐 IPs Exposed', proxyX, proxyY + 8);

    // 3. Draw Connections & Backend Nodes
    if (role === 'reverse_proxy') {
      const originX = 700;
      const originY = 160;

      // Connection wire
      ctx.beginPath();
      ctx.moveTo(clientX, clientY);
      ctx.lineTo(proxyX, proxyY);
      ctx.lineTo(originX, originY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--color-border-subtle)';
      ctx.stroke();

      // Origin DB/App Node
      ctx.beginPath();
      ctx.arc(originX, originY, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-bg-surface)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'var(--color-status-healthy)';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 11px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText('ORIGIN DB', originX, originY - 4);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = 'var(--color-text-muted)';
      ctx.fillText(enableMasking ? '[10.0.4.12]' : '10.0.4.12', originX, originY + 8);
    } else {
      // Load Balancer or Combined Mode (Server Pool)
      const serversY = [80, 160, 240];
      const serverNames = ['Server 1', 'Server 2', 'Server 3'];

      serversY.forEach((sy, idx) => {
        const sx = 700;

        // Wire to server
        ctx.beginPath();
        ctx.moveTo(proxyX, proxyY);
        ctx.lineTo(sx, sy);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'var(--color-border-subtle)';
        ctx.stroke();

        // Server Node
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--color-bg-surface)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'var(--color-status-healthy)';
        ctx.stroke();

        ctx.fillStyle = 'var(--color-text-primary)';
        ctx.font = 'bold 10px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(serverNames[idx], sx, sy - 2);
        ctx.font = '8px JetBrains Mono';
        ctx.fillStyle = 'var(--color-status-healthy)';
        ctx.fillText('HEALTHY', sx, sy + 8);
      });
    }

    // 4. Draw Particles
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [role, enableTls, enableMasking, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setRrIndex(0);
    setRequestCount(0);
    addCaption('Load Balancer vs. Reverse Proxy simulation reset.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'PRIMARY ROLE', value: role === 'reverse_proxy' ? 'REVERSE PROXY' : role === 'load_balancer' ? 'LOAD BALANCER' : 'DUAL NGINX/ENVOY', status: 'healthy' },
    { id: 'm2', label: 'TLS OFF-LOADING', value: enableTls ? 'ENABLED (HTTPS)' : 'DISABLED (HTTP)', status: enableTls ? 'healthy' : 'warning' },
    { id: 'm3', label: 'TOPOLOGY MASKING', value: enableMasking ? 'HIDDEN (SECURE)' : 'EXPOSED', status: enableMasking ? 'healthy' : 'warning' },
    { id: 'm4', label: 'REQUESTS ROUTED', value: requestCount, unit: 'reqs', status: 'healthy' },
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
        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>ROLE:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ArchRole)}
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
            <option value="reverse_proxy">Reverse Proxy (Edge Protection)</option>
            <option value="load_balancer">Load Balancer (Traffic Distribution)</option>
            <option value="combined">Combined Dual Role (NGINX / Envoy)</option>
          </select>
        </div>

        {/* TLS Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={enableTls}
            onChange={(e) => setEnableTls(e.target.checked)}
          />
          TLS Offloading
        </label>

        {/* IP Masking Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={enableMasking}
            onChange={(e) => setEnableMasking(e.target.checked)}
          />
          IP Topology Masking
        </label>

        {/* Dispatch Request Button */}
        <button
          onClick={handleDispatchRequest}
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
          Dispatch Request
        </button>
      </div>
    </VisualizationContainer>
  );
}

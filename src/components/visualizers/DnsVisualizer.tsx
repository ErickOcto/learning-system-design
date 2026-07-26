import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Globe, ArrowRight, RotateCcw } from 'lucide-react';

export interface DnsHopNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  ip: string;
}

export default function DnsVisualizer() {
  const [domain, setDomain] = useState<string>('example.com');
  const [isCached, setIsCached] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [activeHopIndex, setActiveHopIndex] = useState<number>(-1);
  const [resolvedIp, setResolvedIp] = useState<string>('Unresolved');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hops: DnsHopNode[] = [
    { id: 'browser', name: 'Browser Cache', type: 'Client', x: 100, y: 160, ip: '127.0.0.1' },
    { id: 'resolver', name: 'Recursive Resolver', type: 'ISP (8.8.8.8)', x: 260, y: 160, ip: '8.8.8.8' },
    { id: 'root', name: 'Root Server (.)', type: 'Root NS', x: 420, y: 80, ip: '198.41.0.4' },
    { id: 'tld', name: 'TLD Server (.com)', type: 'TLD NS', x: 560, y: 160, ip: '192.5.6.30' },
    { id: 'authoritative', name: 'Authoritative NS', type: 'ns1.example.com', x: 700, y: 240, ip: '93.184.216.34' },
  ];

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

  // Initiate DNS Lookup
  const handleResolveDns = () => {
    if (isCached) {
      // Local Browser Cache Hit!
      setActiveHopIndex(0);
      setResolvedIp('93.184.216.34');
      setLatencyMs(2);
      addCaption(`CACHE HIT (Browser): Domain "${domain}" resolved locally in 2ms → IP 93.184.216.34.`, 'info');
    } else {
      // Full Recursive DNS Lookup
      setActiveHopIndex(0);
      setResolvedIp('Resolving...');
      setLatencyMs(45);
      addCaption(`CACHE MISS: Initiating full recursive DNS lookup for "${domain}" across 4 hierarchical hops...`, 'info');

      // Hop sequence timers
      setTimeout(() => {
        setActiveHopIndex(1);
        addCaption('Hop 1: Browser queries Recursive Resolver (8.8.8.8).', 'info');
      }, 500 / speed);

      setTimeout(() => {
        setActiveHopIndex(2);
        addCaption('Hop 2: Resolver queries Root Server (.) → Refers to .com TLD NS.', 'info');
      }, 1000 / speed);

      setTimeout(() => {
        setActiveHopIndex(3);
        addCaption('Hop 3: Resolver queries .com TLD Server → Refers to ns1.example.com.', 'info');
      }, 1500 / speed);

      setTimeout(() => {
        setActiveHopIndex(4);
        setResolvedIp('93.184.216.34');
        setIsCached(true); // Cache result locally
        addCaption('Hop 4: Authoritative NS returns A Record: 93.184.216.34. Cached locally.', 'info');
      }, 2000 / speed);
    }
  };

  const handleFlushCache = () => {
    setIsCached(false);
    setActiveHopIndex(-1);
    setResolvedIp('Unresolved');
    setLatencyMs(0);
    addCaption('DNS Caches flushed (Browser & OS). Next lookup will trigger full recursive traversal.', 'warning');
  };

  // Simulation tick loop
  const handleTick = useCallback(() => {}, []);

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

    // 1. Draw Wires connecting hops
    ctx.beginPath();
    ctx.moveTo(hops[0].x, hops[0].y);
    ctx.lineTo(hops[1].x, hops[1].y);
    ctx.lineTo(hops[2].x, hops[2].y);
    ctx.lineTo(hops[3].x, hops[3].y);
    ctx.lineTo(hops[4].x, hops[4].y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-border-subtle)';
    ctx.stroke();

    // 2. Draw Hops
    hops.forEach((hop, idx) => {
      const isActive = idx === activeHopIndex;

      ctx.beginPath();
      ctx.arc(hop.x, hop.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)';
      ctx.fill();
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.strokeStyle = isActive ? 'var(--color-status-healthy)' : 'var(--color-accent-primary)';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(hop.name, hop.x, hop.y - 32);

      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = isActive ? 'var(--color-status-healthy)' : 'var(--color-text-muted)';
      ctx.fillText(hop.type, hop.x, hop.y + 4);
      ctx.fillText(hop.ip, hop.x, hop.y + 36);
    });
  }, [activeHopIndex]);

  const handleReset = () => {
    resetAnimLoop();
    setActiveHopIndex(-1);
    setResolvedIp('Unresolved');
    setLatencyMs(0);
    setIsCached(false);
    addCaption('DNS Resolution Lifecycle simulation reset.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'RESOLVED IP', value: resolvedIp, status: resolvedIp.includes('.') ? 'healthy' : 'neutral' },
    { id: 'm2', label: 'DNS LATENCY', value: latencyMs, unit: 'ms', status: latencyMs < 10 ? 'healthy' : 'neutral' },
    { id: 'm3', label: 'HOPS TRAVERSED', value: activeHopIndex >= 0 ? activeHopIndex + 1 : 0, unit: 'hops', status: 'healthy' },
    { id: 'm4', label: 'CACHE STATUS', value: isCached ? 'LOCAL HIT (FAST)' : 'CACHE MISS', status: isCached ? 'healthy' : 'warning' },
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
        {/* Domain Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Globe size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>DOMAIN:</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontFamily: 'var(--font-mono)',
              width: '110px',
            }}
          />
        </div>

        {/* Resolve DNS Button */}
        <button
          onClick={handleResolveDns}
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
          Resolve DNS
        </button>

        {/* Flush Cache Button */}
        <button
          onClick={handleFlushCache}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} />
          Flush Caches
        </button>
      </div>
    </VisualizationContainer>
  );
}

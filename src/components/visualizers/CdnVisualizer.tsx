import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Globe, RefreshCw, Zap, Clock } from 'lucide-react';

export type CdnMode = 'no_cdn' | 'pull_cdn' | 'push_cdn';
export type ClientRegion = 'all' | 'us_west' | 'eu' | 'asia';

interface CdnPopNode {
  id: string;
  name: string;
  region: 'us_west' | 'eu' | 'asia';
  x: number;
  y: number;
  isCached: boolean;
  hits: number;
  misses: number;
  cachedAt?: number;
}

interface RequestPacket {
  id: string;
  region: 'us_west' | 'eu' | 'asia';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  isHit: boolean;
  destination: 'edge' | 'origin';
  originPath?: {
    edgeX: number;
    edgeY: number;
    originX: number;
    originY: number;
    stage: 'to_edge' | 'to_origin' | 'return_edge' | 'return_user';
  };
}

export default function CdnVisualizer() {
  const [mode, setMode] = useState<CdnMode>('pull_cdn');
  const [selectedRegion, setSelectedRegion] = useState<ClientRegion>('all');
  const [ttlSec, setTtlSec] = useState<number>(15);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [pops, setPops] = useState<CdnPopNode[]>([
    { id: 'pop-us-west', name: 'US-West POP', region: 'us_west', x: 220, y: 140, isCached: false, hits: 0, misses: 0 },
    { id: 'pop-eu', name: 'EU (Frankfurt) POP', region: 'eu', x: 440, y: 100, isCached: false, hits: 0, misses: 0 },
    { id: 'pop-asia', name: 'Asia (Tokyo) POP', region: 'asia', x: 620, y: 160, isCached: false, hits: 0, misses: 0 },
  ]);

  const [packets, setPackets] = useState<RequestPacket[]>([]);
  const [originRequests, setOriginRequests] = useState<number>(0);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [totalHits, setTotalHits] = useState<number>(0);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<CdnMode>(mode);
  modeRef.current = mode;

  const ttlSecRef = useRef<number>(ttlSec);
  ttlSecRef.current = ttlSec;

  const popsRef = useRef<CdnPopNode[]>(pops);
  popsRef.current = pops;

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

  // Mode change handler
  useEffect(() => {
    const now = Date.now();
    if (mode === 'push_cdn') {
      setPops((prev) => prev.map((p) => ({ ...p, isCached: true, cachedAt: now })));
      addCaption('Push CDN mode: Content pre-populated across all global Edge POPs.', 'info');
    } else if (mode === 'no_cdn') {
      setPops((prev) => prev.map((p) => ({ ...p, isCached: false, cachedAt: undefined })));
      addCaption('No CDN mode: All user requests travel directly to US-East Origin.', 'warning');
    } else {
      addCaption('Pull CDN mode: Edge POPs fetch from Origin on first miss (cold start).', 'info');
    }
  }, [mode, addCaption]);

  const handleInvalidateCache = () => {
    setPops((prev) => prev.map((p) => ({ ...p, isCached: false, cachedAt: undefined })));
    addCaption('Cache invalidated! Next requests will trigger Origin fetches (cold start).', 'warning');
  };

  // Tick simulation loop
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;
      const currentMode = modeRef.current;
      const currentPops = popsRef.current;
      const currentTtl = ttlSecRef.current;
      const now = Date.now();

      // 0. TTL Expiry check in Pull CDN mode
      if (currentMode === 'pull_cdn') {
        let expiredAny = false;
        const nextPops = currentPops.map((p) => {
          if (p.isCached && p.cachedAt && now - p.cachedAt > currentTtl * 1000) {
            expiredAny = true;
            return { ...p, isCached: false, cachedAt: undefined };
          }
          return p;
        });

        if (expiredAny) {
          setPops(nextPops);
          addCaption(`Edge cache TTL expired (${currentTtl}s). POPs reverted to cold state.`, 'warning');
        }
      }

      // 1. Emit new client requests
      if (Math.random() < 0.08 * speed) {
        const regions: ('us_west' | 'eu' | 'asia')[] =
          selectedRegion === 'all' ? ['us_west', 'eu', 'asia'] : [selectedRegion as any];

        const region = regions[Math.floor(Math.random() * regions.length)];
        const userCoords = {
          us_west: { x: 70, y: 150 },
          eu: { x: 440, y: 40 },
          asia: { x: 700, y: 260 },
        }[region];

        const originCoords = { x: 260, y: 250 }; // US-East Origin
        const pop = currentPops.find((p) => p.region === region);

        setTotalRequests((t) => t + 1);

        if (currentMode === 'no_cdn') {
          // No CDN: direct to Origin
          setOriginRequests((r) => r + 1);
          setPackets((prev) => [
            ...prev,
            {
              id: `pkt-${Date.now()}-${Math.random()}`,
              region,
              startX: userCoords.x,
              startY: userCoords.y,
              targetX: originCoords.x,
              targetY: originCoords.y,
              progress: 0,
              speed: 0.5,
              isHit: false,
              destination: 'origin',
            },
          ]);
        } else if (pop) {
          if (pop.isCached) {
            // Cache Hit at Edge
            setTotalHits((h) => h + 1);
            setPops((prev) =>
              prev.map((p) => (p.id === pop.id ? { ...p, hits: p.hits + 1 } : p))
            );
            setPackets((prev) => [
              ...prev,
              {
                id: `pkt-${Date.now()}-${Math.random()}`,
                region,
                startX: userCoords.x,
                startY: userCoords.y,
                targetX: pop.x,
                targetY: pop.y,
                progress: 0,
                speed: 1.2, // Fast path
                isHit: true,
                destination: 'edge',
              },
            ]);
          } else {
            // Cache Miss at Edge (Cold start) -> Fetch from Origin
            setOriginRequests((r) => r + 1);
            setPops((prev) =>
              prev.map((p) => (p.id === pop.id ? { ...p, misses: p.misses + 1 } : p))
            );
            setPackets((prev) => [
              ...prev,
              {
                id: `pkt-${Date.now()}-${Math.random()}`,
                region,
                startX: userCoords.x,
                startY: userCoords.y,
                targetX: pop.x,
                targetY: pop.y,
                progress: 0,
                speed: 0.8,
                isHit: false,
                destination: 'edge',
                originPath: {
                  edgeX: pop.x,
                  edgeY: pop.y,
                  originX: originCoords.x,
                  originY: originCoords.y,
                  stage: 'to_edge',
                },
              },
            ]);
          }
        }
      }

      // 2. Advance packets along paths
      setPackets((prev) => {
        const nextPackets: RequestPacket[] = [];

        prev.forEach((pkt) => {
          const nextProgress = pkt.progress + pkt.speed * effectiveDelta;

          if (nextProgress >= 1) {
            // Reached step
            if (pkt.originPath) {
              if (pkt.originPath.stage === 'to_edge') {
                // Reached edge on miss -> next step to origin
                nextPackets.push({
                  ...pkt,
                  startX: pkt.originPath.edgeX,
                  startY: pkt.originPath.edgeY,
                  targetX: pkt.originPath.originX,
                  targetY: pkt.originPath.originY,
                  progress: 0,
                  speed: 0.6,
                  originPath: { ...pkt.originPath, stage: 'to_origin' },
                });
              } else if (pkt.originPath.stage === 'to_origin') {
                // Reached origin -> return to edge & populate cache
                const cachedTime = Date.now();
                setPops((pList) =>
                  pList.map((p) =>
                    p.region === pkt.region ? { ...p, isCached: true, cachedAt: cachedTime } : p
                  )
                );
                addCaption(
                  `Origin fetched & cached at ${pkt.region.toUpperCase()} Edge POP.`,
                  'info'
                );
              }
            }
          } else {
            nextPackets.push({ ...pkt, progress: nextProgress });
          }
        });

        return nextPackets;
      });
    },
    [speed, selectedRegion, addCaption]
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

    // 1. Draw World Map Regions / Labels
    const regionsData = [
      { id: 'us_west', name: 'US-West (User)', x: 70, y: 150 },
      { id: 'eu', name: 'Europe (User)', x: 440, y: 40 },
      { id: 'asia', name: 'Asia (User)', x: 700, y: 260 },
    ];

    const origin = { name: 'US-East (Origin DB/Server)', x: 260, y: 250 };

    // Draw connection lines to origin
    regionsData.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(origin.x, origin.y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw origin server
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-status-warning)';
    ctx.stroke();

    ctx.fillStyle = 'var(--color-status-warning)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('ORIGIN', origin.x, origin.y - 4);
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.fillText('US-East', origin.x, origin.y + 8);

    // Draw POP nodes if CDN active
    if (mode !== 'no_cdn') {
      pops.forEach((pop) => {
        // Line from POP to Origin
        ctx.beginPath();
        ctx.moveTo(pop.x, pop.y);
        ctx.lineTo(origin.x, origin.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = pop.isCached ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pop.x, pop.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--color-bg-elevated)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = pop.isCached
          ? 'var(--color-status-healthy)'
          : 'var(--color-status-warning)';
        ctx.stroke();

        ctx.fillStyle = pop.isCached
          ? 'var(--color-status-healthy)'
          : 'var(--color-status-warning)';
        ctx.font = 'bold 10px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(pop.region.toUpperCase(), pop.x, pop.y - 2);
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(pop.isCached ? 'HIT (Cached)' : 'MISS (Cold)', pop.x, pop.y + 8);
      });
    }

    // Draw User nodes
    regionsData.forEach((r) => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-bg-surface)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'var(--color-accent-primary)';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = '10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(r.name.split(' ')[0], r.x, r.y + 4);
    });

    // Draw in-flight packet dots
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.isHit
        ? 'var(--color-status-healthy)'
        : 'var(--color-status-warning)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [pops, packets, mode]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setOriginRequests(0);
    setTotalRequests(0);
    setTotalHits(0);
    const now = Date.now();
    setPops((prev) =>
      prev.map((p) => ({
        ...p,
        isCached: mode === 'push_cdn',
        cachedAt: mode === 'push_cdn' ? now : undefined,
        hits: 0,
        misses: 0,
      }))
    );
    addCaption('CDN simulation reset.', 'info');
  };

  const hitRatio = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0;
  const bandwidthSaved = mode === 'no_cdn' ? 0 : hitRatio;
  const avgLatency = mode === 'no_cdn' ? 220 : Math.round(20 + (100 - hitRatio) * 2);

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'AVG LATENCY RTT', value: avgLatency, unit: 'ms', status: avgLatency < 50 ? 'healthy' : 'warning' },
    { id: 'm2', label: 'ORIGIN LOAD', value: originRequests, unit: 'reqs', status: mode === 'no_cdn' ? 'error' : 'healthy' },
    { id: 'm3', label: 'BANDWIDTH SAVED', value: bandwidthSaved, unit: '%', status: bandwidthSaved > 50 ? 'healthy' : 'neutral' },
    { id: 'm4', label: 'EDGE HIT RATIO', value: hitRatio, unit: '%', status: hitRatio > 70 ? 'healthy' : 'warning' },
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
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CDN MODE:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as CdnMode)}
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
            <option value="no_cdn">No CDN (Direct to Origin)</option>
            <option value="pull_cdn">Pull CDN (Lazy Cold Start)</option>
            <option value="push_cdn">Push CDN (Pre-Populated)</option>
          </select>
        </div>

        {/* Client Region Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CLIENT REGION:</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as ClientRegion)}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <option value="all">All Regions (Global)</option>
            <option value="us_west">US-West Users</option>
            <option value="eu">Europe Users</option>
            <option value="asia">Asia Users</option>
          </select>
        </div>

        {/* Cache TTL Slider */}
        {mode === 'pull_cdn' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={13} style={{ color: 'var(--color-status-warning)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>TTL:</span>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={ttlSec}
              onChange={(e) => setTtlSec(Number(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--color-accent-primary)' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{ttlSec}s</span>
          </div>
        )}

        {/* Cache Invalidation Button */}
        {mode === 'pull_cdn' && (
          <button
            onClick={handleInvalidateCache}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-status-warning-bg)',
              border: '1px solid var(--color-status-warning-border)',
              color: 'var(--color-status-warning)',
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Invalidate Edge Caches
          </button>
        )}
      </div>
    </VisualizationContainer>
  );
}

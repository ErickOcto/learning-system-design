import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Database, HardDrive, Zap } from 'lucide-react';

export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO';
export type CacheStrategy = 'cache-aside' | 'write-through';

export interface CacheSlot {
  id: string;
  key: string;
  value: string;
  hitCount: number;
  createdAt: number;
  lastAccessedAt: number;
  isFlashHit?: boolean;
  isFlashEvicted?: boolean;
}

export interface CachingVisualizerProps {
  autoPlay?: boolean;
}

export default function CachingVisualizer({ autoPlay = false }: CachingVisualizerProps) {
  // Controls state
  const [policy, setPolicy] = useState<EvictionPolicy>('LRU');
  const [strategy, setStrategy] = useState<CacheStrategy>('cache-aside');
  const [capacity, setCapacity] = useState<number>(6); // 6 slots default
  const [speed, setSpeed] = useState<number>(1);

  // Simulation state
  const [slots, setSlots] = useState<CacheSlot[]>([]);
  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [evictions, setEvictions] = useState<number>(0);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [activeRequestKey, setActiveRequestKey] = useState<string | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotsRef = useRef<CacheSlot[]>([]);
  slotsRef.current = slots;

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

  // Find slot to evict according to policy
  const selectEvictionSlotId = useCallback(
    (currentSlots: CacheSlot[]): string | null => {
      if (currentSlots.length === 0) return null;

      if (policy === 'LRU') {
        // Oldest lastAccessedAt
        const sorted = [...currentSlots].sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
        return sorted[0].id;
      } else if (policy === 'LFU') {
        // Lowest hitCount (tie break on oldest lastAccessedAt)
        const sorted = [...currentSlots].sort(
          (a, b) => a.hitCount - b.hitCount || a.lastAccessedAt - b.lastAccessedAt
        );
        return sorted[0].id;
      } else {
        // FIFO: Oldest createdAt
        const sorted = [...currentSlots].sort((a, b) => a.createdAt - b.createdAt);
        return sorted[0].id;
      }
    },
    [policy]
  );

  // Request Key Action
  const requestKey = useCallback(
    (key: string) => {
      const now = Date.now();
      setActiveRequestKey(key);

      const existingSlot = slotsRef.current.find((s) => s.key === key);

      if (existingSlot) {
        // CACHE HIT (< 5ms)
        setHits((h) => h + 1);
        setLastLatencyMs(2);

        setSlots((prev) =>
          prev.map((s) =>
            s.key === key
              ? {
                  ...s,
                  hitCount: s.hitCount + 1,
                  lastAccessedAt: now,
                  isFlashHit: true,
                }
              : { ...s, isFlashHit: false }
          )
        );

        addCaption(`🟢 CACHE HIT: [Key ${key}] found in RAM grid (< 2ms latency).`, 'info');

        setTimeout(() => {
          setSlots((prev) => prev.map((s) => ({ ...s, isFlashHit: false })));
          setActiveRequestKey(null);
        }, 500);
      } else {
        // CACHE MISS (~150ms DB fetch)
        setMisses((m) => m + 1);
        setLastLatencyMs(150);

        addCaption(`🟡 CACHE MISS: [Key ${key}] not in RAM. Fetching from DB (150ms delay)...`, 'warning');

        setTimeout(() => {
          let updatedSlots = [...slotsRef.current];

          // Check if grid is full
          if (updatedSlots.length >= capacity) {
            const evictId = selectEvictionSlotId(updatedSlots);
            const evictedSlot = updatedSlots.find((s) => s.id === evictId);

            if (evictedSlot) {
              setEvictions((e) => e + 1);
              addCaption(
                `⚡ EVICTION [${policy}]: Memory grid full (${capacity}/${capacity}). Evicted [Key ${evictedSlot.key}] (Hits: ${evictedSlot.hitCount}).`,
                'error'
              );
              updatedSlots = updatedSlots.filter((s) => s.id !== evictId);
            }
          }

          const newSlot: CacheSlot = {
            id: Math.random().toString(36).substring(2, 9),
            key,
            value: `val_${key.toLowerCase()}_${Math.floor(Math.random() * 900 + 100)}`,
            hitCount: 1,
            createdAt: now,
            lastAccessedAt: now,
            isFlashHit: true,
          };

          setSlots([...updatedSlots, newSlot]);
          setActiveRequestKey(null);

          setTimeout(() => {
            setSlots((prev) => prev.map((s) => ({ ...s, isFlashHit: false })));
          }, 500);
        }, 600);
      }
    },
    [capacity, policy, selectEvictionSlotId, addCaption]
  );

  // Auto random requester tick
  const handleTick = useCallback(() => {
    if (Math.random() < 0.25 && !activeRequestKey) {
      const keys = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      requestKey(randomKey);
    }
  }, [activeRequestKey, requestKey]);

  const { isPlaying, togglePlay, reset } = useAnimationLoop({
    isPlaying: autoPlay,
    speed,
    onTick: handleTick,
  });

  // Render Canvas Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Left Node: Client / Application
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(30, height / 2 - 30, 80, 60, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('CLIENT APP', 70, height / 2 - 5);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(activeRequestKey ? `REQ: ${activeRequestKey}` : 'IDLE', 70, height / 2 + 12);

    // Right Node: Primary Database
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 110, height / 2 - 30, 80, 60, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('DATABASE', width - 70, height / 2 - 5);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('DISK (150ms)', width - 70, height / 2 + 12);

    // Center Node: Cache RAM Grid Container
    const gridX = 140;
    const gridY = 30;
    const gridW = width - 270;
    const gridH = height - 60;

    ctx.fillStyle = 'rgba(17, 24, 39, 0.6)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(gridX, gridY, gridW, gridH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Space Grotesk, sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.textAlign = 'center';
    ctx.fillText(`IN-MEMORY CACHE GRID (${slots.length}/${capacity} SLOTS)`, gridX + gridW / 2, gridY + 20);

    // Draw Grid Slots (2 columns x N rows)
    const cols = 2;
    const rows = Math.ceil(capacity / cols);
    const slotW = (gridW - 30) / cols;
    const slotH = (gridH - 40) / rows;

    for (let i = 0; i < capacity; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const sx = gridX + 10 + c * (slotW + 10);
      const sy = gridY + 30 + r * slotH;

      const slotData = slots[i];

      if (slotData) {
        ctx.fillStyle = slotData.isFlashHit ? 'rgba(16, 185, 129, 0.2)' : '#1f2937';
        ctx.strokeStyle = slotData.isFlashHit ? '#10b981' : '#374151';
        ctx.lineWidth = slotData.isFlashHit ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(sx, sy + 2, slotW, slotH - 6, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'left';
        ctx.fillText(`Key: ${slotData.key}`, sx + 8, sy + 16);

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`${slotData.value}`, sx + 8, sy + 28);
        ctx.fillText(`Hits: ${slotData.hitCount}`, sx + slotW - 45, sy + 16);
      } else {
        // Empty Slot
        ctx.fillStyle = 'rgba(31, 41, 55, 0.4)';
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sx, sy + 2, slotW, slotH - 6, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        ctx.fillText(`[EMPTY ${i + 1}]`, sx + slotW / 2, sy + 22);
      }
    }
  }, [slots, capacity, activeRequestKey]);

  const handleResetSimulation = () => {
    reset();
    setSlots([]);
    setHits(0);
    setMisses(0);
    setEvictions(0);
    setActiveRequestKey(null);
    setLastLatencyMs(0);
    addCaption('Cache memory grid reset to empty state.', 'info');
  };

  const totalReqs = hits + misses;
  const hitRatePct = totalReqs > 0 ? Math.round((hits / totalReqs) * 100) : 0;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'CACHE HIT RATE', value: `${hitRatePct}%`, unit: `(${hits}H / ${misses}M)`, status: hitRatePct > 50 ? 'healthy' : 'warning' },
    { id: 'm2', label: 'EVICTIONS', value: evictions, unit: `[${policy}]`, status: evictions > 0 ? 'warning' : 'neutral' },
    { id: 'm3', label: 'MEMORY LOAD', value: `${slots.length}/${capacity}`, unit: 'slots', status: slots.length === capacity ? 'error' : 'healthy' },
    { id: 'm4', label: 'LAST LATENCY', value: lastLatencyMs, unit: 'ms', status: lastLatencyMs < 10 ? 'healthy' : 'warning' },
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

          {/* Key Request Trigger Buttons Strip */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--color-bg-base)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginRight: '4px' }}>
              READ REQUEST:
            </span>
            {['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'].map((k) => (
              <button
                key={k}
                onClick={() => requestKey(k)}
                className="status-badge status-badge--info"
                style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '10px' }}
                title={`Request Key ${k}`}
              >
                Get {k}
              </button>
            ))}
          </div>
        </div>
      }
      advancedControls={
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', fontSize: 'var(--font-size-xs)' }}>
          {/* Strategy Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={13} style={{ color: 'var(--color-status-warning)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>STRATEGY:</span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as CacheStrategy)}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="cache-aside">Cache-Aside (Lazy Load)</option>
              <option value="write-through">Write-Through</option>
            </select>
          </div>

          {/* Grid Capacity Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HardDrive size={13} style={{ color: 'var(--color-accent-primary)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CAPACITY:</span>
            <button
              onClick={() => setCapacity((c) => Math.max(4, c - 2))}
              style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
            >
              -
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center' }}>{capacity}</span>
            <button
              onClick={() => setCapacity((c) => Math.min(12, c + 2))}
              style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
            >
              +
            </button>
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>slots</span>
          </div>
        </div>
      }
    >
      {/* Primary Eviction Policy Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-size-xs)' }}>
        <Database size={14} style={{ color: 'var(--color-accent-primary)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>EVICTION POLICY:</span>
        <select
          value={policy}
          onChange={(e) => setPolicy(e.target.value as EvictionPolicy)}
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
          <option value="LRU">LRU (Least Recently Used)</option>
          <option value="LFU">LFU (Least Frequently Used)</option>
          <option value="FIFO">FIFO (First In First Out)</option>
        </select>
      </div>
    </VisualizationContainer>
  );
}

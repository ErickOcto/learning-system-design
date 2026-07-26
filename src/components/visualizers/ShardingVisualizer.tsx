import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { PlusCircle, Flame, Layers } from 'lucide-react';

export type ShardingStrategy = 'range' | 'hash-modulo' | 'consistent-hashing';

export interface ShardBucket {
  id: number;
  name: string;
  keysCount: number;
  cpuLoad: number;
}

interface ShardingPacket {
  id: string;
  key: string;
  targetShardId: number;
  progress: number; // 0 (Router) -> 1 (Shard)
  speed: number;
  isHot?: boolean;
}

export interface ShardingVisualizerProps {
  autoPlay?: boolean;
}

export default function ShardingVisualizer({ autoPlay = false }: ShardingVisualizerProps) {
  // Controls state
  const [strategy, setStrategy] = useState<ShardingStrategy>('hash-modulo');
  const [shardCount, setShardCount] = useState<number>(3);
  const [isHotKeyActive, setIsHotKeyActive] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Simulation state
  const [shards, setShards] = useState<ShardBucket[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Shard ${i + 1}`,
      keysCount: 0,
      cpuLoad: 10,
    }))
  );

  const [packets, setPackets] = useState<ShardingPacket[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [remappedPct, setRemappedPct] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shardsRef = useRef<ShardBucket[]>([]);
  shardsRef.current = shards;

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

  // Compute shard destination based on strategy
  const getShardForRecord = useCallback(
    (keyId: number, numShards: number): number => {
      if (isHotKeyActive && Math.random() < 0.75) {
        // Hot key usr_9999 hits specific shard
        if (strategy === 'range') return numShards; // Latest shard
        return 1;
      }

      switch (strategy) {
        case 'range': {
          // Range partitioning: 1-100 -> Shard 1, 101-200 -> Shard 2, etc.
          const shardIdx = Math.min(numShards - 1, Math.floor((keyId % (numShards * 100)) / 100));
          return shardIdx + 1;
        }

        case 'hash-modulo': {
          // Modulo partitioning: keyId % numShards
          return (keyId % numShards) + 1;
        }

        case 'consistent-hashing': {
          // Consistent Hashing ring (360 degrees)
          const angle = (keyId * 137.5) % 360; // Golden angle hash distribution
          const step = 360 / numShards;
          const shardIdx = Math.floor(angle / step) % numShards;
          return shardIdx + 1;
        }
      }
    },
    [strategy, isHotKeyActive]
  );

  // Spawn record packet
  const spawnRecord = useCallback(() => {
    const keyId = Math.floor(Math.random() * 1000) + 1;
    const keyStr = isHotKeyActive && Math.random() < 0.75 ? 'usr_9999 (HOT)' : `usr_${keyId}`;
    const targetShardId = getShardForRecord(keyId, shardCount);

    setTotalRecords((r) => r + 1);

    const newPacket: ShardingPacket = {
      id: Math.random().toString(36).substring(2, 9),
      key: keyStr,
      targetShardId,
      progress: 0,
      speed: 0.025 + Math.random() * 0.01,
      isHot: keyStr.includes('HOT'),
    };

    setPackets((prev) => [...prev.slice(-30), newPacket]);

    setShards((prev) =>
      prev.map((s) =>
        s.id === targetShardId
          ? {
              ...s,
              keysCount: s.keysCount + 1,
              cpuLoad: Math.min(100, s.cpuLoad + (newPacket.isHot ? 5 : 2)),
            }
          : s
      )
    );

    if (newPacket.isHot) {
      addCaption(`🔥 HOT SHARD ALERT: Heavy traffic key [usr_9999] flooding Shard ${targetShardId}!`, 'warning');
    }
  }, [shardCount, getShardForRecord, isHotKeyActive, addCaption]);

  // Handle Tick loop
  const handleTick = useCallback(() => {
    if (Math.random() < 0.4) {
      spawnRecord();
    }

    setPackets((prev) =>
      prev.map((p) => ({ ...p, progress: p.progress + p.speed })).filter((p) => p.progress < 1.0)
    );

    // Decay CPU load
    setShards((prev) =>
      prev.map((s) => ({
        ...s,
        cpuLoad: Math.max(10, s.cpuLoad - 0.5),
      }))
    );
  }, [spawnRecord]);

  const { isPlaying, togglePlay, reset } = useAnimationLoop({
    isPlaying: autoPlay,
    speed,
    onTick: handleTick,
  });

  // Action: Add Shard Node and calculate remapping %
  const handleAddShard = () => {
    if (shardCount < 6) {
      const oldNum = shardCount;
      const newNum = shardCount + 1;
      setShardCount(newNum);

      let remappedCount = 0;
      const sampleSize = 1000;

      for (let i = 1; i <= sampleSize; i++) {
        const oldShard = getShardForRecord(i, oldNum);
        const newShard = getShardForRecord(i, newNum);
        if (oldShard !== newShard) {
          remappedCount++;
        }
      }

      const pct = Math.round((remappedCount / sampleSize) * 100);
      setRemappedPct(pct);

      if (strategy === 'hash-modulo') {
        addCaption(
          `🔴 Hash Modulo Scaled (${oldNum} -> ${newNum} shards): ${pct}% keys remapped across shards!`,
          'error'
        );
      } else if (strategy === 'consistent-hashing') {
        addCaption(
          `🟢 Consistent Hashing Scaled (${oldNum} -> ${newNum} shards): Only ${pct}% keys remapped (ring segment shifted).`,
          'info'
        );
      } else {
        addCaption(`⚡ Range Sharding Scaled: Added Shard ${newNum} for high-range keys.`, 'info');
      }
    }
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const activeShards = shards.slice(0, shardCount);

    if (strategy === 'consistent-hashing') {
      // Draw Consistent Hashing Ring View
      const ringX = width / 2;
      const ringY = height / 2;
      const ringR = 100;

      // Draw Hash Ring
      ctx.beginPath();
      ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#06b6d4';
      ctx.stroke();

      ctx.font = 'bold 11px Space Grotesk, sans-serif';
      ctx.fillStyle = '#06b6d4';
      ctx.textAlign = 'center';
      ctx.fillText('CONSISTENT HASH RING (360°)', ringX, ringY - ringR - 15);

      // Draw Shard Virtual Nodes on Ring
      activeShards.forEach((shard, i) => {
        const angle = (i * (2 * Math.PI)) / activeShards.length - Math.PI / 2;
        const nx = ringX + ringR * Math.cos(angle);
        const ny = ringY + ringR * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(nx, ny, 12, 0, Math.PI * 2);
        ctx.fillStyle = shard.cpuLoad > 75 ? '#f43f5e' : '#111827';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = shard.cpuLoad > 75 ? '#f43f5e' : '#38bdf8';
        ctx.stroke();

        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillStyle = '#f9fafb';
        ctx.fillText(`S${shard.id}`, nx, ny + 3.5);
      });

      // Draw In-Flight Packets along ring arc
      packets.forEach((p) => {
        const targetIdx = activeShards.findIndex((s) => s.id === p.targetShardId);
        if (targetIdx !== -1) {
          const angle = (targetIdx * (2 * Math.PI)) / activeShards.length - Math.PI / 2;
          const currentR = ringR * p.progress;
          const px = ringX + currentR * Math.cos(angle);
          const py = ringY + currentR * Math.sin(angle);

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = p.isHot ? '#f43f5e' : '#38bdf8';
          ctx.fill();
        }
      });
    } else {
      // Draw Router -> Shards Bucket Grid View
      const routerX = 70;
      const routerY = height / 2;

      // Router Node
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(routerX - 45, routerY - 30, 90, 60, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px Space Grotesk, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('SHARD ROUTER', routerX, routerY - 5);
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(strategy.toUpperCase(), routerX, routerY + 12);

      // Shard Buckets
      const shardX = width - 100;
      const startY = 40;
      const spacingY = (height - 80) / Math.max(1, activeShards.length - 1 || 1);

      activeShards.forEach((shard, i) => {
        const sY = activeShards.length === 1 ? height / 2 : startY + i * spacingY;
        const isHot = shard.cpuLoad > 75;

        // Line Router -> Shard
        ctx.beginPath();
        ctx.moveTo(routerX + 45, routerY);
        ctx.lineTo(shardX - 45, sY);
        ctx.lineWidth = isHot ? 2 : 1;
        ctx.strokeStyle = isHot ? 'rgba(244, 63, 94, 0.5)' : 'rgba(56, 189, 248, 0.25)';
        ctx.stroke();

        // Shard Bucket Box
        ctx.fillStyle = isHot ? 'rgba(244, 63, 94, 0.15)' : '#111827';
        ctx.strokeStyle = isHot ? '#f43f5e' : '#06b6d4';
        ctx.lineWidth = isHot ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(shardX - 45, sY - 18, 90, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = isHot ? '#f43f5e' : '#f9fafb';
        ctx.textAlign = 'left';
        ctx.fillText(shard.name, shardX - 35, sY - 2);

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = isHot ? '#f43f5e' : '#9ca3af';
        ctx.fillText(`Recs: ${shard.keysCount} | ${Math.round(shard.cpuLoad)}% CPU`, shardX - 35, sY + 11);
      });

      // Draw Packets Router -> Shard
      packets.forEach((p) => {
        const targetIdx = activeShards.findIndex((s) => s.id === p.targetShardId);
        if (targetIdx !== -1) {
          const sY = activeShards.length === 1 ? height / 2 : startY + targetIdx * spacingY;
          const px = routerX + 45 + (shardX - 45 - (routerX + 45)) * p.progress;
          const py = routerY + (sY - routerY) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = p.isHot ? '#f43f5e' : '#38bdf8';
          ctx.fill();
        }
      });
    }
  }, [shards, shardCount, strategy, packets]);

  const handleResetSimulation = () => {
    reset();
    setShardCount(3);
    setIsHotKeyActive(false);
    setPackets([]);
    setTotalRecords(0);
    setRemappedPct(0);
    setShards(
      Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: `Shard ${i + 1}`,
        keysCount: 0,
        cpuLoad: 10,
      }))
    );
    addCaption('Database sharding simulation reset to default state.', 'info');
  };

  const activePool = shards.slice(0, shardCount);
  const maxCpu = Math.max(...activePool.map((s) => s.cpuLoad));
  const minCpu = Math.min(...activePool.map((s) => s.cpuLoad));
  const imbalanceRatio = minCpu > 0 ? (maxCpu / minCpu).toFixed(1) : '1.0';

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'TOTAL RECORDS', value: totalRecords, unit: 'written', status: 'healthy' },
    { id: 'm2', label: 'SHARD COUNT', value: shardCount, unit: 'buckets', status: 'healthy' },
    { id: 'm3', label: 'HOT IMBALANCE', value: `${imbalanceRatio}x`, unit: maxCpu > 75 ? 'HOT SPOTS' : '', status: maxCpu > 75 ? 'error' : 'neutral' },
    { id: 'm4', label: 'KEYS REMAPPED ON SCALE', value: `${remappedPct}%`, unit: strategy === 'consistent-hashing' ? '(LOW)' : '(HIGH)', status: remappedPct > 50 ? 'error' : 'healthy' },
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
          {/* Add Shard Node Action */}
          <button
            onClick={handleAddShard}
            disabled={shardCount >= 6}
            className="status-badge status-badge--healthy"
            style={{
              cursor: shardCount >= 6 ? 'not-allowed' : 'pointer',
              opacity: shardCount >= 6 ? 0.5 : 1,
              padding: '0.3rem 0.6rem',
            }}
          >
            <PlusCircle size={13} />
            Add Shard Node ({shardCount} → {Math.min(6, shardCount + 1)})
          </button>

          {/* Simulate Hot Key Traffic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={13} style={{ color: isHotKeyActive ? 'var(--color-status-error)' : 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>HOT KEY TRAFFIC:</span>
            <button
              onClick={() => setIsHotKeyActive((prev) => !prev)}
              className={`status-badge ${isHotKeyActive ? 'status-badge--error' : 'status-badge--info'}`}
              style={{ cursor: 'pointer', padding: '0.2rem 0.6rem' }}
            >
              {isHotKeyActive ? 'ON (usr_9999 Flooding)' : 'OFF (Uniform Key Traffic)'}
            </button>
          </div>
        </div>
      }
    >
      {/* Primary Sharding Strategy Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-size-xs)' }}>
        <Layers size={14} style={{ color: 'var(--color-accent-primary)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>SHARDING STRATEGY:</span>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as ShardingStrategy)}
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
          <option value="hash-modulo">Hash Modulo (key % N)</option>
          <option value="range">Range-Based (Key Ranges)</option>
          <option value="consistent-hashing">Consistent Hashing Ring</option>
        </select>
      </div>
    </VisualizationContainer>
  );
}

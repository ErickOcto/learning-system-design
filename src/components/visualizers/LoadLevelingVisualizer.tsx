import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Flame, Sliders, Layers } from 'lucide-react';

interface RequestPacket {
  id: string;
  path: 'direct' | 'queue';
  progress: number;
  speed: number;
  isDropped: boolean;
}

export default function LoadLevelingVisualizer() {
  const [dbRate, setDbRate] = useState<number>(3); // req/s
  const [queueCapacity, setQueueCapacity] = useState<number>(25);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [queueBuffer, setQueueBuffer] = useState<number>(0);
  const [unprotectedDrops, setUnprotectedDrops] = useState<number>(0);
  const [protectedDrops, setProtectedDrops] = useState<number>(0);
  const [directDbCpu, setDirectDbCpu] = useState<number>(20);
  const [queueDbCpu, setQueueDbCpu] = useState<number>(20);
  const [packets, setPackets] = useState<RequestPacket[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dbRateRef = useRef<number>(dbRate);
  dbRateRef.current = dbRate;

  const queueCapacityRef = useRef<number>(queueCapacity);
  queueCapacityRef.current = queueCapacity;

  const queueBufferRef = useRef<number>(queueBuffer);
  queueBufferRef.current = queueBuffer;

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

  // Spike Traffic Burst button (+500%)
  const handleSpikeBurst = () => {
    const burstCount = 20;
    addCaption('🔥 TRAFFIC SPIKE (+500%) INJECTED! Flooding both Unprotected and Protected paths...', 'error');

    // 1. Direct path overload: DB cannot handle burst -> spikes CPU & drops excess
    setDirectDbCpu(100);
    const directDropsCount = Math.max(5, burstCount - dbRate * 2);
    setUnprotectedDrops((d) => d + directDropsCount);

    // 2. Queue path: queue absorbs burst
    setQueueBuffer((prev) => {
      const nextBuf = prev + burstCount;
      if (nextBuf > queueCapacity) {
        const overflow = nextBuf - queueCapacity;
        setProtectedDrops((pd) => pd + overflow);
        addCaption(`Queue buffer overflowed by ${overflow} messages!`, 'error');
        return queueCapacity;
      }
      if (nextBuf / queueCapacity >= 0.8) {
        addCaption(`⚠️ BACKPRESSURE WARNING: Queue buffer at ${Math.round((nextBuf / queueCapacity) * 100)}% capacity!`, 'warning');
      } else {
        addCaption(`Queue absorbed burst! Depth now ${nextBuf}/${queueCapacity}. Protected DB running smooth.`, 'info');
      }
      return nextBuf;
    });

    // 3. Dispatch visual packets
    const newPackets: RequestPacket[] = [];
    for (let i = 0; i < 8; i++) {
      newPackets.push({
        id: `pkt-direct-${Date.now()}-${i}`,
        path: 'direct',
        progress: 0,
        speed: 0.8 + Math.random() * 0.4,
        isDropped: i >= dbRate,
      });
      newPackets.push({
        id: `pkt-queue-${Date.now()}-${i}`,
        path: 'queue',
        progress: 0,
        speed: 0.8 + Math.random() * 0.4,
        isDropped: false,
      });
    }
    setPackets((prev) => [...prev, ...newPackets]);
  };

  // Simulation Loop Tick
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;
      const currentRate = dbRateRef.current;
      const currentBuf = queueBufferRef.current;

      // Drain queue buffer at steady DB processing rate
      if (currentBuf > 0) {
        const drained = Math.min(currentBuf, Math.max(1, Math.round(currentRate * effectiveDelta)));
        setQueueBuffer((b) => Math.max(0, b - drained));
        setQueueDbCpu(Math.min(85, Math.round(30 + (currentBuf / queueCapacityRef.current) * 50)));
      } else {
        setQueueDbCpu(15);
      }

      // Cool down direct DB CPU gradually
      setDirectDbCpu((cpu) => Math.max(15, cpu - 5 * effectiveDelta));

      // Advance visual packets
      setPackets((prev) => {
        const next: RequestPacket[] = [];
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

    // Layout coordinates
    const producerX = 80;
    const directDbX = 650;
    const directY = 90;

    const queueX = 360;
    const queueDbX = 650;
    const queueY = 230;

    // --- TOP: DIRECT UNPROTECTED PATH ---
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'left';
    ctx.fillText('PATH 1: UNPROTECTED (API → Direct DB)', 30, 30);

    // Direct wire
    ctx.beginPath();
    ctx.moveTo(producerX, directY);
    ctx.lineTo(directDbX, directY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = directDbCpu > 80 ? 'var(--color-status-error)' : 'var(--color-border-subtle)';
    ctx.stroke();

    // Producer Node A
    ctx.beginPath();
    ctx.arc(producerX, directY, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = '10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('API', producerX, directY + 3);

    // Direct DB Node
    ctx.beginPath();
    ctx.arc(directDbX, directY, 24, 0, Math.PI * 2);
    ctx.fillStyle = directDbCpu > 80 ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = directDbCpu > 80 ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
    ctx.stroke();
    ctx.fillStyle = directDbCpu > 80 ? 'var(--color-status-error)' : 'var(--color-text-primary)';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillText(`DB (${Math.round(directDbCpu)}%)`, directDbX, directY + 3);

    // --- BOTTOM: PROTECTED QUEUE PATH ---
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'left';
    ctx.fillText('PATH 2: PROTECTED (API → Message Queue Buffer → DB)', 30, 175);

    // Wires
    ctx.beginPath();
    ctx.moveTo(producerX, queueY);
    ctx.lineTo(queueX, queueY);
    ctx.lineTo(queueDbX, queueY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-status-healthy)';
    ctx.stroke();

    // Producer Node B
    ctx.beginPath();
    ctx.arc(producerX, queueY, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = '10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('API', producerX, queueY + 3);

    // Queue Buffer Box
    const qWidth = 90;
    const qHeight = 36;
    const fillRatio = queueBuffer / queueCapacity;
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fillRect(queueX - qWidth / 2, queueY - qHeight / 2, qWidth, qHeight);
    ctx.lineWidth = 2;
    ctx.strokeStyle = fillRatio > 0.8 ? 'var(--color-status-warning)' : 'var(--color-accent-primary)';
    ctx.strokeRect(queueX - qWidth / 2, queueY - qHeight / 2, qWidth, qHeight);

    // Queue Fill Level Bar
    ctx.fillStyle = fillRatio > 0.8 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)';
    ctx.fillRect(queueX - qWidth / 2, queueY - qHeight / 2, qWidth * Math.min(1, fillRatio), qHeight);

    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`QUEUE: ${queueBuffer}/${queueCapacity}`, queueX, queueY + 4);

    // Protected DB Node
    ctx.beginPath();
    ctx.arc(queueDbX, queueY, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'var(--color-status-healthy)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillText(`DB (${Math.round(queueDbCpu)}%)`, queueDbX, queueY + 3);

    // Draw In-Flight Packets
    packets.forEach((p) => {
      const y = p.path === 'direct' ? directY : queueY;
      const targetX = p.path === 'direct' ? directDbX : queueX;
      const px = producerX + (targetX - producerX) * p.progress;

      ctx.beginPath();
      ctx.arc(px, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.isDropped ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [directDbCpu, queueDbCpu, queueBuffer, queueCapacity, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setQueueBuffer(0);
    setUnprotectedDrops(0);
    setProtectedDrops(0);
    setDirectDbCpu(20);
    setQueueDbCpu(20);
    addCaption('Load Leveling simulation reset.', 'info');
  };

  const queueFillPct = Math.round((queueBuffer / queueCapacity) * 100);

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'UNPROTECTED DROPS', value: unprotectedDrops, unit: 'reqs', status: unprotectedDrops > 0 ? 'error' : 'healthy' },
    { id: 'm2', label: 'PROTECTED DROPS', value: protectedDrops, unit: 'reqs', status: protectedDrops > 0 ? 'error' : 'healthy' },
    { id: 'm3', label: 'UNPROTECTED DB CPU', value: Math.round(directDbCpu), unit: '%', status: directDbCpu > 80 ? 'error' : 'healthy' },
    { id: 'm4', label: 'QUEUE BUFFER FILL', value: queueFillPct, unit: '%', status: queueFillPct > 80 ? 'warning' : 'healthy' },
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
        {/* Burst Traffic Button */}
        <button
          onClick={handleSpikeBurst}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-status-error-bg)',
            border: '1px solid var(--color-status-error)',
            color: 'var(--color-status-error)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Flame size={13} />
          Inject Traffic Burst (+500%)
        </button>

        {/* DB Rate Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>DB RATE:</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={dbRate}
            onChange={(e) => setDbRate(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--color-accent-primary)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{dbRate}/s</span>
        </div>

        {/* Queue Max Capacity Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>QUEUE MAX:</span>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={queueCapacity}
            onChange={(e) => setQueueCapacity(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--color-status-healthy)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{queueCapacity}</span>
        </div>
      </div>
    </VisualizationContainer>
  );
}

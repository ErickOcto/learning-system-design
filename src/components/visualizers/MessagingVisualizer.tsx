import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { MessageSquare, Users, Zap, Radio } from 'lucide-react';

export type MessagingMode = 'queue' | 'pubsub';

export interface QueueMessage {
  id: string;
  payload: string;
  topic?: string;
  createdAt: number;
}

interface MessagingPacket {
  id: string;
  payload: string;
  channel: 'queue' | 'email' | 'analytics' | 'audit';
  progress: number;
  speed: number;
  workerId?: number;
}

export interface MessagingVisualizerProps {
  autoPlay?: boolean;
}

export default function MessagingVisualizer({ autoPlay = false }: MessagingVisualizerProps) {
  // Controls state
  const [mode, setMode] = useState<MessagingMode>('queue');
  const [workerCount, setWorkerCount] = useState<number>(2);
  const [producerRate, setProducerRate] = useState<number>(10); // msg/sec
  const [speed, setSpeed] = useState<number>(1);

  // Simulation state
  const [queueBuffer, setQueueBuffer] = useState<QueueMessage[]>([]);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [fanOutCount, setFanOutCount] = useState<number>(0);
  const [packets, setPackets] = useState<MessagingPacket[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<QueueMessage[]>([]);
  bufferRef.current = queueBuffer;

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

  // Action: Trigger Producer Traffic Burst
  const triggerBurst = () => {
    const burstSize = 30;
    const now = Date.now();
    const newMessages: QueueMessage[] = Array.from({ length: burstSize }, (_, i) => ({
      id: Math.random().toString(36).substring(2, 9),
      payload: `event_burst_${i + 1}`,
      createdAt: now,
    }));

    setQueueBuffer((prev) => [...prev, ...newMessages]);
    addCaption(
      `💥 TRAFFIC BURST: Injected ${burstSize} messages into ${mode === 'queue' ? 'Queue Buffer' : 'Pub/Sub Exchange'}!`,
      'warning'
    );
  };

  // Spawn producer messages
  const spawnMessage = useCallback(() => {
    const now = Date.now();
    const newMsg: QueueMessage = {
      id: Math.random().toString(36).substring(2, 9),
      payload: `evt_${Math.floor(Math.random() * 900 + 100)}`,
      createdAt: now,
    };

    setQueueBuffer((prev) => [...prev, newMsg]);

    if (mode === 'pubsub') {
      setFanOutCount((f) => f + 3);
      addCaption(`📢 PUB/SUB FAN-OUT: Published [${newMsg.payload}] → Fanned out to 3 Subscriber Queues (Email, Analytics, Audit).`, 'info');
    }
  }, [mode, addCaption]);

  // Handle Tick loop
  const handleTick = useCallback(() => {
    // Producer publishes message based on producerRate
    if (Math.random() < producerRate / 60) {
      spawnMessage();
    }

    // Consumer drain logic
    if (bufferRef.current.length > 0) {
      const drainCount = Math.min(bufferRef.current.length, workerCount);
      setQueueBuffer((prev) => prev.slice(drainCount));
      setProcessedCount((p) => p + drainCount);

      // Create packets flowing to workers
      const newPackets: MessagingPacket[] = [];
      for (let i = 0; i < drainCount; i++) {
        if (mode === 'queue') {
          newPackets.push({
            id: Math.random().toString(36).substring(2, 9),
            payload: `msg_${i}`,
            channel: 'queue',
            workerId: i % workerCount,
            progress: 0,
            speed: 0.03 + Math.random() * 0.01,
          });
        } else {
          // Fan-out 3 channels
          ['email', 'analytics', 'audit'].forEach((ch) => {
            newPackets.push({
              id: Math.random().toString(36).substring(2, 9),
              payload: `fanout_${ch}`,
              channel: ch as 'email' | 'analytics' | 'audit',
              workerId: i % workerCount,
              progress: 0,
              speed: 0.03 + Math.random() * 0.01,
            });
          });
        }
      }

      setPackets((prev) => [
        ...prev.filter((p) => p.progress < 1.0).map((p) => ({ ...p, progress: p.progress + p.speed })),
        ...newPackets,
      ]);
    } else {
      setPackets((prev) =>
        prev.map((p) => ({ ...p, progress: p.progress + p.speed })).filter((p) => p.progress < 1.0)
      );
    }
  }, [producerRate, workerCount, mode, spawnMessage]);

  const { isPlaying, togglePlay, reset } = useAnimationLoop({
    isPlaying: autoPlay,
    speed,
    onTick: handleTick,
  });

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Left: Producer Box
    const prodX = 50;
    const prodY = height / 2;

    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(prodX - 40, prodY - 30, 80, 60, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('PRODUCER', prodX, prodY - 5);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${producerRate} msg/s`, prodX, prodY + 12);

    if (mode === 'queue') {
      // === MODE 1: POINT-TO-POINT QUEUE ===
      const qX = width / 2 - 60;
      const qY = height / 2 - 25;
      const qW = 120;
      const qH = 50;

      ctx.fillStyle = queueBuffer.length > 20 ? 'rgba(245, 158, 11, 0.15)' : '#111827';
      ctx.strokeStyle = queueBuffer.length > 20 ? '#f59e0b' : '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(qX, qY, qW, qH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px Space Grotesk, sans-serif';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('MESSAGE QUEUE', width / 2, qY + 18);

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = queueBuffer.length > 20 ? '#f59e0b' : '#10b981';
      ctx.fillText(`Depth: ${queueBuffer.length} msgs`, width / 2, qY + 36);

      // Right: Worker Pool
      const wX = width - 80;
      const startY = 40;
      const spacingY = (height - 80) / Math.max(1, workerCount - 1 || 1);

      for (let i = 0; i < workerCount; i++) {
        const sY = workerCount === 1 ? height / 2 : startY + i * spacingY;

        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(wX - 35, sY - 15, 70, 30, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Worker ${i + 1}`, wX, sY + 4);
      }

      // Draw Packets Producer -> Queue -> Worker
      packets.forEach((p) => {
        let px = prodX;
        let py = prodY;

        if (p.progress <= 0.4) {
          const t = p.progress / 0.4;
          px = prodX + (qX - prodX) * t;
          py = prodY;
        } else {
          const t = (p.progress - 0.4) / 0.6;
          const wIdx = (p.workerId || 0) % workerCount;
          const targetY = workerCount === 1 ? height / 2 : startY + wIdx * spacingY;
          px = qX + qW + (wX - 35 - (qX + qW)) * t;
          py = qY + qH / 2 + (targetY - (qY + qH / 2)) * t;
        }

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      });
    } else {
      // === MODE 2: PUB/SUB FAN-OUT ===
      const exX = width / 2 - 70;
      const exY = height / 2 - 25;

      // Exchange Node
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(exX, exY, 140, 50, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px Space Grotesk, sans-serif';
      ctx.fillStyle = '#a855f7';
      ctx.fillText('TOPIC EXCHANGE', width / 2, exY + 18);
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('3x FAN-OUT PIPELINE', width / 2, exY + 36);

      // Subscriber Channels (Email, Analytics, Audit)
      const channels = [
        { name: 'Email Queue', color: '#ec4899', y: 50 },
        { name: 'Analytics Queue', color: '#3b82f6', y: height / 2 },
        { name: 'Audit Log Queue', color: '#10b981', y: height - 50 },
      ];

      const chX = width - 90;

      channels.forEach((ch) => {
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(chX - 45, ch.y - 15, 90, 30, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = ch.color;
        ctx.fillText(ch.name, chX, ch.y + 4);
      });

      // Draw Fan-Out Packets
      packets.forEach((p) => {
        let targetY = height / 2;
        let pColor = '#a855f7';

        if (p.channel === 'email') {
          targetY = 50;
          pColor = '#ec4899';
        } else if (p.channel === 'analytics') {
          targetY = height / 2;
          pColor = '#3b82f6';
        } else if (p.channel === 'audit') {
          targetY = height - 50;
          pColor = '#10b981';
        }

        const px = exX + 140 + (chX - 45 - (exX + 140)) * p.progress;
        const py = exY + 25 + (targetY - (exY + 25)) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.fill();
      });
    }
  }, [queueBuffer, workerCount, mode, producerRate, packets]);

  const handleResetSimulation = () => {
    reset();
    setQueueBuffer([]);
    setProcessedCount(0);
    setFanOutCount(0);
    setPackets([]);
    addCaption('Message queue simulation reset to empty state.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'QUEUE BACKLOG', value: queueBuffer.length, unit: 'msgs', status: queueBuffer.length > 20 ? 'warning' : 'healthy' },
    { id: 'm2', label: 'PROCESSED TOTAL', value: processedCount, unit: 'processed', status: 'healthy' },
    { id: 'm3', label: 'WORKER POOL', value: workerCount, unit: 'workers', status: 'neutral' },
    { id: 'm4', label: 'FAN-OUT MULTIPLIER', value: mode === 'pubsub' ? '3x' : '1x', unit: mode === 'pubsub' ? `(${fanOutCount} fanned)` : '(Queue)', status: 'healthy' },
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
          {/* Inject Traffic Burst Action */}
          <button
            onClick={triggerBurst}
            className="status-badge status-badge--warning"
            style={{ cursor: 'pointer', padding: '0.3rem 0.6rem' }}
          >
            <Zap size={13} />
            Inject Traffic Burst (+50 Messages)
          </button>

          {/* Worker Pool Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={13} style={{ color: 'var(--color-accent-primary)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CONSUMERS:</span>
            <button
              onClick={() => setWorkerCount((w) => Math.max(1, w - 1))}
              style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
            >
              -
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', minWidth: '16px', textAlign: 'center' }}>{workerCount}</span>
            <button
              onClick={() => setWorkerCount((w) => Math.min(5, w + 1))}
              style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', width: '20px', height: '20px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          {/* Producer Rate Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={13} style={{ color: 'var(--color-accent-primary)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>PUBLISH RATE:</span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={producerRate}
              onChange={(e) => setProducerRate(Number(e.target.value))}
              style={{ accentColor: 'var(--color-accent-primary)', cursor: 'pointer', width: '100px' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{producerRate}/s</span>
          </div>
        </div>
      }
    >
      {/* Primary Messaging Mode Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-size-xs)' }}>
        <Radio size={14} style={{ color: 'var(--color-accent-primary)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MESSAGING PATTERN:</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as MessagingMode)}
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
          <option value="queue">Point-to-Point Queue (1-to-1 Worker Drain)</option>
          <option value="pubsub">Pub/Sub Fan-Out (1-to-Many Channels)</option>
        </select>
      </div>
    </VisualizationContainer>
  );
}

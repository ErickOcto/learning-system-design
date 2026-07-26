import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Flame, ArrowRight } from 'lucide-react';

interface RequestParticle {
  id: string;
  arch: 'monolith' | 'microservices';
  module: 'user' | 'order' | 'payment' | 'inventory';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  status: 'success' | 'failed';
}

export default function MicroservicesVisualizer() {
  const [userFailed, setUserFailed] = useState<boolean>(false);
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [packets, setPackets] = useState<RequestParticle[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const userFailedRef = useRef<boolean>(userFailed);
  userFailedRef.current = userFailed;

  const paymentFailedRef = useRef<boolean>(paymentFailed);
  paymentFailedRef.current = paymentFailed;

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

  // Toggle User DB Failure
  const handleToggleUserFailure = () => {
    const nextState = !userFailed;
    setUserFailed(nextState);
    if (nextState) {
      addCaption('🔥 FAILURE INJECTED: User DB crash! In Monolith, shared process crashes. In Microservices, only User service degrades.', 'error');
    } else {
      addCaption('HEALED User DB. All systems operational.', 'info');
    }
  };

  // Toggle Payment Failure
  const handleTogglePaymentFailure = () => {
    const nextState = !paymentFailed;
    setPaymentFailed(nextState);
    if (nextState) {
      addCaption('🔥 FAILURE INJECTED: Payment Gateway timeout!', 'error');
    } else {
      addCaption('HEALED Payment service.', 'info');
    }
  };

  // Dispatch Batch Requests
  const handleDispatchBatch = () => {
    const modules: ('user' | 'order' | 'payment' | 'inventory')[] = ['user', 'order', 'payment', 'inventory'];

    const newPackets: RequestParticle[] = [];

    let monoFails = 0;
    let microFails = 0;

    const isMonoCrashed = userFailed || paymentFailed;

    modules.forEach((mod, idx) => {
      // 1. Monolith Packet
      const monoY = 70 + idx * 45;
      const willMonoFail = isMonoCrashed;
      if (willMonoFail) monoFails++;

      newPackets.push({
        id: `pkt-mono-${Date.now()}-${mod}`,
        arch: 'monolith',
        module: mod,
        startX: 40,
        startY: monoY,
        targetX: 340,
        targetY: monoY,
        progress: 0,
        speed: 1.0,
        status: willMonoFail ? 'failed' : 'success',
      });

      // 2. Microservices Packet
      const microY = 70 + idx * 45;
      const willMicroFail = (mod === 'user' && userFailed) || (mod === 'payment' && paymentFailed);
      if (willMicroFail) microFails++;

      newPackets.push({
        id: `pkt-micro-${Date.now()}-${mod}`,
        arch: 'microservices',
        module: mod,
        startX: 440,
        startY: microY,
        targetX: 740,
        targetY: microY,
        progress: 0,
        speed: 1.0,
        status: willMicroFail ? 'failed' : 'success',
      });
    });

    setPackets((prev) => [...prev, ...newPackets]);

    if (isMonoCrashed) {
      addCaption(`MONOLITH: Process crashed! 4/4 requests failed (100% Blast Radius). MICROSERVICES: Isolated failure (${microFails}/4 failed).`, 'warning');
    } else {
      addCaption('Dispatched traffic batch across both architectures. All requests 200 OK.', 'info');
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

    const modules: { id: 'user' | 'order' | 'payment' | 'inventory'; name: string }[] = [
      { id: 'user', name: 'User Module' },
      { id: 'order', name: 'Order Module' },
      { id: 'payment', name: 'Payment Module' },
      { id: 'inventory', name: 'Inventory Module' },
    ];

    const isMonoCrashed = userFailed || paymentFailed;

    // --- LEFT PANEL: MONOLITH ---
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'left';
    ctx.fillText('MONOLITH (Single Shared Process & DB)', 40, 30);

    // Monolith Outer Box
    const monoBoxX = 140;
    const monoBoxY = 45;
    const monoBoxW = 200;
    const monoBoxH = 220;

    ctx.fillStyle = isMonoCrashed ? 'rgba(239, 68, 68, 0.15)' : 'var(--color-bg-elevated)';
    ctx.fillRect(monoBoxX, monoBoxY, monoBoxW, monoBoxH);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isMonoCrashed ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
    ctx.strokeRect(monoBoxX, monoBoxY, monoBoxW, monoBoxH);

    modules.forEach((mod, idx) => {
      const my = 70 + idx * 45;

      // Module inside monolith
      ctx.fillStyle = isMonoCrashed ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-bg-surface)';
      ctx.fillRect(monoBoxX + 15, my - 16, monoBoxW - 30, 32);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isMonoCrashed ? 'var(--color-status-error)' : 'var(--color-border-subtle)';
      ctx.strokeRect(monoBoxX + 15, my - 16, monoBoxW - 30, 32);

      ctx.fillStyle = isMonoCrashed ? 'var(--color-status-error)' : 'var(--color-text-primary)';
      ctx.font = 'bold 10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(mod.name + (isMonoCrashed ? ' (DOWN)' : ''), monoBoxX + monoBoxW / 2, my + 3);
    });

    // --- RIGHT PANEL: MICROSERVICES ---
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'left';
    ctx.fillText('MICROSERVICES (Decoupled Containers & DB Boundaries)', 440, 30);

    const microGwX = 480;

    modules.forEach((mod, idx) => {
      const my = 70 + idx * 45;
      const microSrvX = 660;

      const isSrvFailed = (mod.id === 'user' && userFailed) || (mod.id === 'payment' && paymentFailed);

      // Connection Wire from Gateway
      ctx.beginPath();
      ctx.moveTo(microGwX, 137);
      ctx.lineTo(microSrvX, my);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSrvFailed ? 'var(--color-status-error)' : 'var(--color-border-subtle)';
      ctx.stroke();

      // Independent Service Container Box
      ctx.fillStyle = isSrvFailed ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-surface)';
      ctx.fillRect(microSrvX - 55, my - 16, 110, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isSrvFailed ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
      ctx.strokeRect(microSrvX - 55, my - 16, 110, 32);

      ctx.fillStyle = isSrvFailed ? 'var(--color-status-error)' : 'var(--color-text-primary)';
      ctx.font = 'bold 10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(mod.name + (isSrvFailed ? ' (500)' : ''), microSrvX, my + 3);
    });

    // Draw API Gateway for Microservices
    ctx.beginPath();
    ctx.arc(microGwX, 137, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = '9px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('GW', microGwX, 140);

    // Draw Particles
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.status === 'failed' ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [userFailed, paymentFailed, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setUserFailed(false);
    setPaymentFailed(false);
    addCaption('Microservices vs. Monolith simulation reset.', 'info');
  };

  const isMonoCrashed = userFailed || paymentFailed;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'MONOLITH STATUS', value: isMonoCrashed ? 'CRASHED (OUTAGE)' : 'HEALTHY (4/4 UP)', status: isMonoCrashed ? 'error' : 'healthy' },
    { id: 'm2', label: 'MICROSERVICES STATUS', value: userFailed && paymentFailed ? '2/4 UP' : userFailed || paymentFailed ? '3/4 UP (DEGRADED)' : 'HEALTHY (4/4 UP)', status: userFailed || paymentFailed ? 'warning' : 'healthy' },
    { id: 'm3', label: 'MONOLITH BLAST RADIUS', value: isMonoCrashed ? '100% TOTAL OUTAGE' : '0%', status: isMonoCrashed ? 'error' : 'healthy' },
    { id: 'm4', label: 'MICRO BLAST RADIUS', value: userFailed && paymentFailed ? '50% ISOLATED' : userFailed || paymentFailed ? '25% ISOLATED' : '0%', status: userFailed || paymentFailed ? 'neutral' : 'healthy' },
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
        {/* Dispatch Batch Button */}
        <button
          onClick={handleDispatchBatch}
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
          Dispatch Traffic Batch
        </button>

        {/* Inject Failure Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Flame size={13} style={{ color: 'var(--color-status-error)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>FAIL MODULE:</span>
          <button
            onClick={handleToggleUserFailure}
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: userFailed ? 'var(--color-status-error)' : 'var(--color-bg-surface)',
              color: userFailed ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            User DB {userFailed ? '(CRASHED)' : ''}
          </button>
          <button
            onClick={handleTogglePaymentFailure}
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: paymentFailed ? 'var(--color-status-error)' : 'var(--color-bg-surface)',
              color: paymentFailed ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            Payment {paymentFailed ? '(CRASHED)' : ''}
          </button>
        </div>
      </div>
    </VisualizationContainer>
  );
}

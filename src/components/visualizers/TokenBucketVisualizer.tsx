import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Flame, Sliders, Layers, ArrowRight } from 'lucide-react';

interface RequestParticle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  isAccepted: boolean;
}

export default function TokenBucketVisualizer() {
  const [refillRate, setRefillRate] = useState<number>(5); // tokens / sec
  const [capacity, setCapacity] = useState<number>(15);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [tokens, setTokens] = useState<number>(15);
  const [acceptedCount, setAcceptedCount] = useState<number>(0);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  const [particles, setParticles] = useState<RequestParticle[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const refillRateRef = useRef<number>(refillRate);
  refillRateRef.current = refillRate;

  const capacityRef = useRef<number>(capacity);
  capacityRef.current = capacity;

  const tokensRef = useRef<number>(tokens);
  tokensRef.current = tokens;

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

  // Single Manual Request
  const handleSendRequest = () => {
    const currentTokens = tokensRef.current;
    const clientX = 120;
    const clientY = 160;
    const bucketX = 400;
    const bucketY = 160;
    const backendX = 680;
    const backendY = 160;

    if (currentTokens >= 1) {
      // Consume 1 token -> Accepted (200 OK)
      setTokens((t) => Math.max(0, t - 1));
      setAcceptedCount((a) => a + 1);

      setParticles((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}-${Math.random()}`,
          startX: clientX,
          startY: clientY,
          targetX: backendX,
          targetY: backendY,
          progress: 0,
          speed: 1.2,
          isAccepted: true,
        },
      ]);
      addCaption('200 OK: Token consumed from bucket. Request passed to backend server.', 'info');
    } else {
      // Bucket empty -> Rejected (429 Too Many Requests)
      setRejectedCount((r) => r + 1);

      setParticles((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}-${Math.random()}`,
          startX: clientX,
          startY: clientY,
          targetX: bucketX,
          targetY: bucketY,
          progress: 0,
          speed: 1.2,
          isAccepted: false,
        },
      ]);
      addCaption('⚠️ HTTP 429 TOO MANY REQUESTS: Bucket empty! Request throttled and rejected.', 'error');
    }
  };

  // Rapid Burst (20 Requests)
  const handleBurst = () => {
    addCaption('🔥 BURST INJECTED: Dispatched 20 rapid requests...', 'warning');

    let currentT = tokensRef.current;
    let accepted = 0;
    let rejected = 0;

    const clientX = 120;
    const clientY = 160;
    const bucketX = 400;
    const backendX = 680;

    const newParticles: RequestParticle[] = [];

    for (let i = 0; i < 20; i++) {
      if (currentT >= 1) {
        currentT -= 1;
        accepted++;
        newParticles.push({
          id: `burst-acc-${Date.now()}-${i}`,
          startX: clientX,
          startY: clientY,
          targetX: backendX,
          targetY: clientY + (Math.random() * 40 - 20),
          progress: 0,
          speed: 1.0 + Math.random() * 0.4,
          isAccepted: true,
        });
      } else {
        rejected++;
        newParticles.push({
          id: `burst-rej-${Date.now()}-${i}`,
          startX: clientX,
          startY: clientY,
          targetX: bucketX,
          targetY: clientY + (Math.random() * 40 - 20),
          progress: 0,
          speed: 1.0 + Math.random() * 0.4,
          isAccepted: false,
        });
      }
    }

    setTokens(currentT);
    setAcceptedCount((a) => a + accepted);
    setRejectedCount((r) => r + rejected);
    setParticles((prev) => [...prev, ...newParticles]);

    if (rejected > 0) {
      addCaption(`Burst Result: ${accepted} requests accepted (200 OK), ${rejected} requests throttled (429 Error).`, 'error');
    } else {
      addCaption(`Burst Result: All ${accepted} requests accepted!`, 'info');
    }
  };

  // Simulation tick loop (Refills tokens over time)
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;
      const rate = refillRateRef.current;
      const maxCap = capacityRef.current;

      // Refill tokens
      setTokens((t) => Math.min(maxCap, t + rate * effectiveDelta));

      // Advance particles
      setParticles((prev) => {
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

    const clientX = 120;
    const clientY = 160;
    const bucketX = 400;
    const bucketY = 160;
    const backendX = 680;
    const backendY = 160;

    // 1. Draw Wires
    ctx.beginPath();
    ctx.moveTo(clientX, clientY);
    ctx.lineTo(bucketX, bucketY);
    ctx.lineTo(backendX, backendY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-border-subtle)';
    ctx.stroke();

    // 2. Draw Client Node
    ctx.beginPath();
    ctx.arc(clientX, clientY, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('CLIENT', clientX, clientY + 4);

    // 3. Draw Token Bucket Container
    const bWidth = 100;
    const bHeight = 120;
    const fillRatio = Math.min(1, tokens / capacity);

    // Bucket Box Outline
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fillRect(bucketX - bWidth / 2, bucketY - bHeight / 2, bWidth, bHeight);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = tokens < 1 ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
    ctx.strokeRect(bucketX - bWidth / 2, bucketY - bHeight / 2, bWidth, bHeight);

    // Token Liquid/Stack Fill Level
    const fillH = bHeight * fillRatio;
    ctx.fillStyle = tokens < 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.3)';
    ctx.fillRect(bucketX - bWidth / 2, bucketY + bHeight / 2 - fillH, bWidth, fillH);

    // Bucket Label & Token Count
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 12px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('TOKEN BUCKET', bucketX, bucketY - bHeight / 2 - 10);

    ctx.fillStyle = tokens < 1 ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
    ctx.font = 'bold 14px JetBrains Mono';
    ctx.fillText(`${Math.floor(tokens)} / ${capacity}`, bucketX, bucketY + 5);

    // Refill Rate Label
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`+${refillRate} tokens/sec`, bucketX, bucketY + 22);

    // 4. Draw Backend Server Node
    ctx.beginPath();
    ctx.arc(backendX, backendY, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'var(--color-status-healthy)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('BACKEND', backendX, backendY - 4);
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-status-healthy)';
    ctx.fillText('200 OK', backendX, backendY + 8);

    // 5. Draw Request Particles
    particles.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.isAccepted ? 'var(--color-status-healthy)' : 'var(--color-status-error)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (!p.isAccepted && p.progress > 0.8) {
        // Red 429 bounce badge
        ctx.fillStyle = 'var(--color-status-error)';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText('429 THROTTLED', px, py - 10);
      }
    });
  }, [tokens, capacity, refillRate, particles]);

  const handleReset = () => {
    resetAnimLoop();
    setParticles([]);
    setTokens(capacity);
    setAcceptedCount(0);
    setRejectedCount(0);
    addCaption('Token Bucket simulation reset.', 'info');
  };

  const totalReqs = acceptedCount + rejectedCount;
  const throttlePct = totalReqs > 0 ? Math.round((rejectedCount / totalReqs) * 100) : 0;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'AVAILABLE TOKENS', value: `${Math.floor(tokens)} / ${capacity}`, status: tokens < 1 ? 'error' : 'healthy' },
    { id: 'm2', label: 'ACCEPTED (200 OK)', value: acceptedCount, unit: 'reqs', status: 'healthy' },
    { id: 'm3', label: 'REJECTED (429)', value: rejectedCount, unit: 'reqs', status: rejectedCount > 0 ? 'error' : 'healthy' },
    { id: 'm4', label: 'THROTTLE RATE', value: throttlePct, unit: '%', status: throttlePct > 30 ? 'error' : 'neutral' },
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
        {/* Send Single Request */}
        <button
          onClick={handleSendRequest}
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
          Send Request
        </button>

        {/* Burst 20 Requests Button */}
        <button
          onClick={handleBurst}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
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
          Burst 20 Requests
        </button>

        {/* Refill Rate Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>REFILL RATE:</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={refillRate}
            onChange={(e) => setRefillRate(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--color-status-healthy)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>+{refillRate}/s</span>
        </div>

        {/* Bucket Capacity Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>CAPACITY:</span>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--color-accent-primary)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{capacity}</span>
        </div>
      </div>
    </VisualizationContainer>
  );
}

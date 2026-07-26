import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Flame, Sliders, ArrowRight } from 'lucide-react';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ServicePool {
  id: 'payment' | 'inventory' | 'recommendations';
  name: string;
  circuitState: CircuitState;
  failCount: number;
  isFailing: boolean;
  activeThreads: number;
  maxThreads: number;
  lastTripTime?: number;
}

interface RequestParticle {
  id: string;
  targetServiceId: 'payment' | 'inventory' | 'recommendations';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  status: 'success' | 'failed' | 'tripped';
}

export default function CircuitBreakerVisualizer() {
  const [failThreshold, setFailThreshold] = useState<number>(3);
  const [useBulkhead, setUseBulkhead] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [services, setServices] = useState<ServicePool[]>([
    { id: 'payment', name: 'Payment Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
    { id: 'inventory', name: 'Inventory Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
    { id: 'recommendations', name: 'Recommendations Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
  ]);

  const [sharedThreads, setSharedThreads] = useState<number>(0);
  const [packets, setPackets] = useState<RequestParticle[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const failThresholdRef = useRef<number>(failThreshold);
  failThresholdRef.current = failThreshold;

  const useBulkheadRef = useRef<boolean>(useBulkhead);
  useBulkheadRef.current = useBulkhead;

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

  // Inject Failure on target service
  const handleInjectFailure = (targetId: 'payment' | 'inventory' | 'recommendations') => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === targetId ? { ...s, isFailing: !s.isFailing } : s
      )
    );

    const srv = services.find((s) => s.id === targetId)!;
    if (!srv.isFailing) {
      addCaption(`🔥 INJECTED FAILURE on ${srv.name}! Service is returning 500 errors.`, 'error');
    } else {
      addCaption(`HEALED ${srv.name}. Normal responses restored.`, 'info');
    }
  };

  // Dispatch Traffic batch across all 3 services
  const handleDispatchTraffic = () => {
    const gwX = 140;
    const gwY = 160;
    const srvX = 660;
    const srvYMap = { payment: 80, inventory: 160, recommendations: 240 };

    const newPackets: RequestParticle[] = [];

    services.forEach((srv) => {
      const targetY = srvYMap[srv.id];

      // Check Circuit State
      if (srv.circuitState === 'OPEN') {
        // Fail-fast immediately!
        newPackets.push({
          id: `pkt-${Date.now()}-${srv.id}`,
          targetServiceId: srv.id,
          startX: gwX,
          startY: gwY,
          targetX: 380, // Bounces off gateway breaker
          targetY,
          progress: 0,
          speed: 1.5,
          status: 'tripped',
        });
        addCaption(`🔴 FAIL FAST (503): ${srv.name} circuit OPEN! Request rejected immediately.`, 'warning');
      } else {
        // CLOSED or HALF_OPEN -> Try call
        const willFail = srv.isFailing;
        newPackets.push({
          id: `pkt-${Date.now()}-${srv.id}`,
          targetServiceId: srv.id,
          startX: gwX,
          startY: gwY,
          targetX: srvX,
          targetY,
          progress: 0,
          speed: 1.0,
          status: willFail ? 'failed' : 'success',
        });

        // Thread pool handling
        if (useBulkheadRef.current) {
          // Bulkhead: consume isolated thread
          setServices((prev) =>
            prev.map((s) =>
              s.id === srv.id ? { ...s, activeThreads: Math.min(s.maxThreads, s.activeThreads + 3) } : s
            )
          );
        } else {
          // Without Bulkhead: consume shared thread pool
          setSharedThreads((t) => Math.min(15, t + 4));
        }

        // Circuit state transition math
        if (willFail) {
          setServices((prev) =>
            prev.map((s) => {
              if (s.id !== srv.id) return s;
              const nextFail = s.failCount + 1;
              if (nextFail >= failThresholdRef.current) {
                addCaption(`💥 CIRCUIT TRIP! ${s.name} accumulated ${nextFail} failures. State -> OPEN.`, 'error');
                return { ...s, failCount: nextFail, circuitState: 'OPEN', lastTripTime: Date.now() };
              }
              return { ...s, failCount: nextFail };
            })
          );
        } else if (srv.circuitState === 'HALF_OPEN') {
          // Probe succeeded -> Close circuit!
          setServices((prev) =>
            prev.map((s) =>
              s.id === srv.id ? { ...s, circuitState: 'CLOSED', failCount: 0 } : s
            )
          );
          addCaption(`🟢 HALF-OPEN PROBE PASSED! ${srv.name} recovered. Circuit State -> CLOSED.`, 'info');
        }
      }
    });

    setPackets((prev) => [...prev, ...newPackets]);
  };

  // Simulation tick loop (cools active threads & handles Half-Open recovery timeout)
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      // Cool active threads
      setServices((prev) =>
        prev.map((s) => {
          const nextActive = Math.max(0, s.activeThreads - 3 * effectiveDelta);

          // Check for Half-Open recovery probe
          if (s.circuitState === 'OPEN' && s.lastTripTime && Date.now() - s.lastTripTime > 5000) {
            addCaption(`🟡 RECOVERY TIMEOUT EXPIRED: ${s.name} switching to HALF-OPEN probe...`, 'warning');
            return { ...s, circuitState: 'HALF_OPEN', activeThreads: nextActive };
          }

          return { ...s, activeThreads: nextActive };
        })
      );

      setSharedThreads((st) => Math.max(0, st - 4 * effectiveDelta));

      // Advance particles
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
    [speed, addCaption]
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

    const gwX = 140;
    const gwY = 160;
    const srvX = 660;
    const srvYMap = { payment: 80, inventory: 160, recommendations: 240 };

    // 1. Draw API Gateway Node
    ctx.beginPath();
    ctx.arc(gwX, gwY, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();

    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 11px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('API GATEWAY', gwX, gwY - 4);
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.fillText(useBulkhead ? '🛡️ Bulkhead' : '⚠️ Shared Pool', gwX, gwY + 8);

    // 2. Draw Service Pools & Circuit Breakers
    services.forEach((srv) => {
      const sy = srvYMap[srv.id];
      const cbX = 380; // Circuit Breaker Icon Position

      // Connection Wires
      ctx.beginPath();
      ctx.moveTo(gwX, gwY);
      ctx.lineTo(cbX, sy);
      ctx.lineTo(srvX, sy);
      ctx.lineWidth = 2;
      ctx.strokeStyle = srv.circuitState === 'OPEN' ? 'var(--color-status-error)' : 'var(--color-border-subtle)';
      ctx.stroke();

      // Circuit Breaker Badge
      ctx.beginPath();
      ctx.arc(cbX, sy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-bg-elevated)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle =
        srv.circuitState === 'OPEN'
          ? 'var(--color-status-error)'
          : srv.circuitState === 'HALF_OPEN'
          ? 'var(--color-status-warning)'
          : 'var(--color-status-healthy)';
      ctx.stroke();

      ctx.fillStyle = srv.circuitState === 'OPEN' ? 'var(--color-status-error)' : 'var(--color-text-primary)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(srv.circuitState, cbX, sy + 3);

      // Service Pool Box
      ctx.beginPath();
      ctx.arc(srvX, sy, 26, 0, Math.PI * 2);
      ctx.fillStyle = srv.isFailing ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-surface)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = srv.isFailing ? 'var(--color-status-error)' : 'var(--color-status-healthy)';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 10px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText(srv.name, srvX, sy - 4);

      // Bulkhead Thread Meter per Service
      const threads = useBulkhead ? Math.round(srv.activeThreads) : Math.round(sharedThreads);
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = threads > 8 ? 'var(--color-status-error)' : 'var(--color-text-muted)';
      ctx.fillText(`Threads: ${threads}/10`, srvX, sy + 8);
    });

    // 3. Draw Particles
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle =
        p.status === 'tripped'
          ? 'var(--color-status-warning)'
          : p.status === 'failed'
          ? 'var(--color-status-error)'
          : 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [services, useBulkhead, sharedThreads, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setSharedThreads(0);
    setServices([
      { id: 'payment', name: 'Payment Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
      { id: 'inventory', name: 'Inventory Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
      { id: 'recommendations', name: 'Recommendations Service', circuitState: 'CLOSED', failCount: 0, isFailing: false, activeThreads: 0, maxThreads: 10 },
    ]);
    addCaption('Circuit Breaker & Bulkhead simulation reset.', 'info');
  };

  const paymentSrv = services.find((s) => s.id === 'payment')!;
  const inventorySrv = services.find((s) => s.id === 'inventory')!;
  const recSrv = services.find((s) => s.id === 'recommendations')!;

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'PAYMENT CIRCUIT', value: paymentSrv.circuitState, status: paymentSrv.circuitState === 'OPEN' ? 'error' : 'healthy' },
    { id: 'm2', label: 'INVENTORY CIRCUIT', value: inventorySrv.circuitState, status: inventorySrv.circuitState === 'OPEN' ? 'error' : 'healthy' },
    { id: 'm3', label: 'RECOMMENDATIONS', value: recSrv.circuitState, status: recSrv.circuitState === 'OPEN' ? 'error' : 'healthy' },
    { id: 'm4', label: 'BULKHEAD ISOLATION', value: useBulkhead ? 'ENABLED (ISOLATED)' : 'DISABLED (SHARED RISK)', status: useBulkhead ? 'healthy' : 'warning' },
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
        {/* Dispatch Traffic Button */}
        <button
          onClick={handleDispatchTraffic}
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

        {/* Failure Injection Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Flame size={13} style={{ color: 'var(--color-status-error)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>FAIL:</span>
          <button
            onClick={() => handleInjectFailure('recommendations')}
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: recSrv.isFailing ? 'var(--color-status-error)' : 'var(--color-bg-surface)',
              color: recSrv.isFailing ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            Recs {recSrv.isFailing ? '(Failing)' : ''}
          </button>
        </div>

        {/* Bulkhead Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={useBulkhead}
            onChange={(e) => setUseBulkhead(e.target.checked)}
          />
          Bulkhead Thread Isolation
        </label>

        {/* Failure Threshold Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={13} style={{ color: 'var(--color-accent-primary)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>TRIP THRESHOLD:</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={failThreshold}
            onChange={(e) => setFailThreshold(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--color-accent-primary)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{failThreshold} fails</span>
        </div>
      </div>
    </VisualizationContainer>
  );
}

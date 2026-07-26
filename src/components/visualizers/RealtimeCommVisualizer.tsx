import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Radio, Zap, Send } from 'lucide-react';

export type RealtimeProtocol = 'short-polling' | 'long-polling' | 'websockets' | 'sse';

interface CommPacket {
  id: string;
  direction: 'client-to-server' | 'server-to-client';
  label: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
}

export default function RealtimeCommVisualizer() {
  const [protocol, setProtocol] = useState<RealtimeProtocol>('websockets');
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Simulation State
  const [packets, setPackets] = useState<CommPacket[]>([]);
  const [handshakeCount, setHandshakeCount] = useState<number>(1);
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
    if (protocol === 'short-polling') {
      setHandshakeCount(12);
      addCaption('SHORT POLLING: Client opens brand new HTTP GET connection every 3s. High HTTP header overhead (800B headers per 0B payload).', 'warning');
    } else if (protocol === 'long-polling') {
      setHandshakeCount(4);
      addCaption('LONG POLLING: Server holds HTTP request open until data is ready. Connection closes on response; client immediately re-opens.', 'info');
    } else if (protocol === 'websockets') {
      setHandshakeCount(1);
      addCaption('WEBSOCKETS: Single HTTP 101 Upgrade handshake converts TCP connection to full-duplex framing. Zero HTTP header overhead!', 'info');
    } else {
      setHandshakeCount(1);
      addCaption('SERVER-SENT EVENTS (SSE): Unidirectional HTTP text/event-stream connection. Server pushes updates to client continuously.', 'info');
    }
  }, [protocol, addCaption]);

  // Emit Server Event
  const handleEmitServerEvent = () => {
    setPackets((prev) => [
      ...prev,
      {
        id: `pkt-${Date.now()}-${Math.random()}`,
        direction: 'server-to-client',
        label: protocol === 'websockets' ? 'WS Frame (Payload)' : protocol === 'sse' ? 'data: {msg: "update"}' : '200 OK (Data Payload)',
        startX: 650,
        startY: 160,
        targetX: 150,
        targetY: 160,
        progress: 0,
        speed: 1.2,
        color: 'var(--color-status-healthy)',
      },
    ]);
    addCaption(`SERVER EVENT: Pushed data stream frame down to client.`, 'info');
  };

  // Send Client Message
  const handleSendClientMessage = () => {
    if (protocol === 'sse') {
      addCaption('SSE LIMITATION: Server-Sent Events are unidirectional (Server -> Client only). Client must use separate HTTP POST for upstream.', 'warning');
      return;
    }

    setPackets((prev) => [
      ...prev,
      {
        id: `pkt-${Date.now()}-${Math.random()}`,
        direction: 'client-to-server',
        label: protocol === 'websockets' ? 'WS Frame (Upstream)' : 'HTTP GET /poll',
        startX: 150,
        startY: 160,
        targetX: 650,
        targetY: 160,
        progress: 0,
        speed: 1.2,
        color: 'var(--color-accent-primary)',
      },
    ]);
    addCaption(`CLIENT MESSAGE: Sent message to server.`, 'info');
  };

  // Simulation tick loop
  const handleTick = useCallback(
    (deltaMs: number) => {
      const effectiveDelta = (deltaMs / 1000) * speed;

      setPackets((prev) => {
        const next: CommPacket[] = [];
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

    const clientX = 150;
    const clientY = 160;
    const serverX = 650;
    const serverY = 160;

    // 1. Connection Line
    ctx.beginPath();
    ctx.moveTo(clientX, clientY);
    ctx.lineTo(serverX, serverY);
    ctx.lineWidth = protocol === 'websockets' ? 4 : 2;
    ctx.strokeStyle = protocol === 'websockets' ? 'var(--color-status-healthy)' : 'var(--color-border-subtle)';
    ctx.stroke();

    // 2. Client Box
    ctx.beginPath();
    ctx.arc(clientX, clientY, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-surface)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-accent-primary)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('CLIENT', clientX, clientY + 4);

    // 3. Server Box
    ctx.beginPath();
    ctx.arc(serverX, serverY, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-bg-elevated)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'var(--color-status-healthy)';
    ctx.stroke();
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.font = 'bold 10px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('SERVER', serverX, serverY + 4);

    // 4. Draw Packets
    packets.forEach((p) => {
      const px = p.startX + (p.targetX - p.startX) * p.progress;
      const py = p.startY + (p.targetY - p.startY) * p.progress;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, px, py - 12);
    });
  }, [protocol, packets]);

  const handleReset = () => {
    resetAnimLoop();
    setPackets([]);
    setHandshakeCount(1);
    addCaption('Real-time Communication simulation reset.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'PROTOCOL MODE', value: protocol.toUpperCase(), status: protocol === 'websockets' ? 'healthy' : 'neutral' },
    { id: 'm2', label: 'HTTP HANDSHAKES', value: handshakeCount, status: handshakeCount === 1 ? 'healthy' : 'warning' },
    { id: 'm3', label: 'HEADER OVERHEAD', value: protocol === 'websockets' ? '2 Bytes (Framed)' : '800 Bytes / Req', status: protocol === 'websockets' ? 'healthy' : 'warning' },
    { id: 'm4', label: 'LATENCY', value: protocol === 'short-polling' ? '3000ms (Poll)' : '< 1ms (Instant)', status: protocol === 'short-polling' ? 'warning' : 'healthy' },
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
        {/* Protocol Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Radio size={13} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>PROTOCOL:</span>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as RealtimeProtocol)}
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
            <option value="short-polling">Short Polling (HTTP GET 3s)</option>
            <option value="long-polling">Long Polling (HTTP Hanging GET)</option>
            <option value="websockets">WebSockets (Full Duplex TCP)</option>
            <option value="sse">Server-Sent Events (SSE Unidirectional)</option>
          </select>
        </div>

        {/* Emit Server Event Button */}
        <button
          onClick={handleEmitServerEvent}
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
          <Zap size={12} />
          Emit Server Event
        </button>

        {/* Send Client Message Button */}
        <button
          onClick={handleSendClientMessage}
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
          <Send size={12} />
          Send Client Message
        </button>
      </div>
    </VisualizationContainer>
  );
}

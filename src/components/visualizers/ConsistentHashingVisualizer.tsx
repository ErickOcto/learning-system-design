import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizationContainer from './shared/VisualizationContainer';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { CaptionEntry, TelemetryMetric } from '../../types/visualizer';
import { Plus, Minus, Key, RefreshCw } from 'lucide-react';

export interface RingNode {
  id: string;
  name: string;
  angle: number; // 0 to 2pi
  color: string;
}

export interface RingKey {
  id: string;
  name: string;
  angle: number;
  assignedNodeId: string;
}

export default function ConsistentHashingVisualizer() {
  const [vnodesCount, setVnodesCount] = useState<number>(3);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Nodes & Keys State
  const [physicalNodes, setPhysicalNodes] = useState<string[]>(['Node A', 'Node B', 'Node C']);
  const [keys, setKeys] = useState<RingKey[]>([]);
  const [remappedPct, setRemappedPct] = useState<number>(0);
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

  // Compute ring positions for physical + virtual nodes
  const getRingNodes = useCallback((): RingNode[] => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const result: RingNode[] = [];

    physicalNodes.forEach((nodeName, nodeIdx) => {
      const color = colors[nodeIdx % colors.length];
      for (let v = 0; v < vnodesCount; v++) {
        // Deterministic hash angle mapping
        const seed = nodeName + `-v${v}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
        }
        const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
        result.push({
          id: `${nodeName}-v${v}`,
          name: seed,
          angle,
          color,
        });
      }
    });

    return result.sort((a, b) => a.angle - b.angle);
  }, [physicalNodes, vnodesCount]);

  // Find nearest node clockwise
  const findAssignedNode = useCallback((keyAngle: number, ringNodes: RingNode[]): RingNode => {
    if (ringNodes.length === 0) return { id: 'none', name: 'None', angle: 0, color: '#888888' };
    const next = ringNodes.find((n) => n.angle >= keyAngle);
    return next || ringNodes[0];
  }, []);

  // Add Key to Ring
  const handleAddKey = () => {
    const keyId = `key_${Math.floor(Math.random() * 9000 + 1000)}`;
    const angle = Math.random() * Math.PI * 2;
    const ringNodes = getRingNodes();
    const targetNode = findAssignedNode(angle, ringNodes);

    setKeys((prev) => [
      ...prev,
      {
        id: keyId,
        name: keyId,
        angle,
        assignedNodeId: targetNode.name,
      },
    ]);

    addCaption(`Key "${keyId}" mapped clockwise to ${targetNode.name}.`, 'info');
  };

  // Add Node
  const handleAddNode = () => {
    if (physicalNodes.length >= 5) {
      addCaption('Maximum 5 nodes supported in simulation.', 'warning');
      return;
    }
    const nodeNames = ['Node A', 'Node B', 'Node C', 'Node D', 'Node E'];
    const nextName = nodeNames[physicalNodes.length];
    setPhysicalNodes((prev) => [...prev, nextName]);

    // Recalculate remapped keys percentage (Consistent hashing remaps only ~1/K keys!)
    const oldRing = getRingNodes();
    const newNodes = [...physicalNodes, nextName];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const newRing: RingNode[] = [];
    newNodes.forEach((nName, nIdx) => {
      for (let v = 0; v < vnodesCount; v++) {
        const seed = nName + `-v${v}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
        newRing.push({ id: `${nName}-v${v}`, name: seed, angle: (Math.abs(hash) % 360) * (Math.PI / 180), color: colors[nIdx % colors.length] });
      }
    });
    newRing.sort((a, b) => a.angle - b.angle);

    let moved = 0;
    setKeys((prevKeys) =>
      prevKeys.map((k) => {
        const oldAssigned = findAssignedNode(k.angle, oldRing);
        const newAssigned = findAssignedNode(k.angle, newRing);
        if (oldAssigned.name !== newAssigned.name) moved++;
        return { ...k, assignedNodeId: newAssigned.name };
      })
    );

    const remapped = keys.length > 0 ? Math.round((moved / keys.length) * 100) : Math.round(100 / newNodes.length);
    setRemappedPct(remapped);
    addCaption(`Added ${nextName}. Minimal Key Remapping: Only ~${remapped}% of keys moved!`, 'info');
  };

  // Remove Node
  const handleRemoveNode = () => {
    if (physicalNodes.length <= 1) {
      addCaption('Minimum 1 node required.', 'warning');
      return;
    }
    const removedName = physicalNodes[physicalNodes.length - 1];
    setPhysicalNodes((prev) => prev.slice(0, -1));
    addCaption(`Removed ${removedName}. Keys remapped to surviving neighbor nodes on ring.`, 'warning');
  };

  // Simulation loop tick
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

    const cx = 400;
    const cy = 160;
    const radius = 110;

    // 1. Draw Ring Circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'var(--color-border-subtle)';
    ctx.stroke();

    const ringNodes = getRingNodes();

    // 2. Draw Virtual Nodes on Ring
    ringNodes.forEach((node) => {
      const nx = cx + radius * Math.cos(node.angle);
      const ny = cy + radius * Math.sin(node.angle);

      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Label
      ctx.fillStyle = 'var(--color-text-primary)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, nx, ny - 14);
    });

    // 3. Draw Keys on Ring
    keys.forEach((key) => {
      const kx = cx + (radius - 22) * Math.cos(key.angle);
      const ky = cy + (radius - 22) * Math.sin(key.angle);

      ctx.beginPath();
      ctx.arc(kx, ky, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-status-healthy)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [physicalNodes, vnodesCount, keys, getRingNodes]);

  const handleReset = () => {
    resetAnimLoop();
    setKeys([]);
    setRemappedPct(0);
    setPhysicalNodes(['Node A', 'Node B', 'Node C']);
    addCaption('Consistent Hashing Ring simulation reset.', 'info');
  };

  const metrics: TelemetryMetric[] = [
    { id: 'm1', label: 'PHYSICAL NODES', value: physicalNodes.length, status: 'healthy' },
    { id: 'm2', label: 'VIRTUAL REPLICAS', value: `${vnodesCount}x / node`, status: 'healthy' },
    { id: 'm3', label: 'TOTAL KEYS MAPPED', value: keys.length, status: 'healthy' },
    { id: 'm4', label: 'KEY REMAP COST', value: `${remappedPct}%`, status: remappedPct < 35 ? 'healthy' : 'warning' },
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
        {/* Add Key Button */}
        <button
          onClick={handleAddKey}
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
          <Key size={12} />
          Add Key to Ring
        </button>

        {/* Add Node Button */}
        <button
          onClick={handleAddNode}
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
          <Plus size={12} />
          Add Node
        </button>

        {/* Remove Node Button */}
        <button
          onClick={handleRemoveNode}
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
          <Minus size={12} />
          Remove Node
        </button>

        {/* Virtual Nodes Multiplier Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={12} style={{ color: 'var(--color-status-healthy)' }} />
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>VNODES:</span>
          <select
            value={vnodesCount}
            onChange={(e) => setVnodesCount(Number(e.target.value))}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <option value={1}>1x (No Replicas)</option>
            <option value={3}>3x Virtual Replicas</option>
            <option value={5}>5x Virtual Replicas</option>
          </select>
        </div>
      </div>
    </VisualizationContainer>
  );
}

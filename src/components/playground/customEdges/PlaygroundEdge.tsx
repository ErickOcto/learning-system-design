import { useRef, useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { usePlaygroundSimulationStore } from '../engine/usePlaygroundSimulationStore';

export default function PlaygroundEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    selected,
  } = props;

  const pathRef = useRef<SVGPathElement>(null);
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const allPackets = usePlaygroundSimulationStore((s) => s.packets);

  const packets = useMemo(
    () => allPackets.filter((p) => p.edgeId === id),
    [allPackets, id]
  );

  const pathLength = pathRef.current?.getTotalLength() || 0;

  const handleDeleteEdge = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected
            ? 'var(--color-accent-primary)'
            : packets.length > 0
            ? 'var(--color-accent-primary)'
            : 'var(--color-border-strong)',
          strokeWidth: selected ? 3 : packets.length > 0 ? 2.5 : 1.5,
          opacity: 0.85,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          ...style,
        }}
      />

      {/* Reference SVG Path for getPointAtLength */}
      <path
        ref={pathRef}
        d={edgePath}
        fill="none"
        stroke="transparent"
        style={{ pointerEvents: 'none' }}
      />

      {/* Render in-flight animated packets */}
      {pathLength > 0 &&
        packets.map((pkt) => {
          const point = pathRef.current?.getPointAtLength(pkt.progress * pathLength);
          if (!point) return null;

          const isDropped = pkt.status === 'dropped';
          const packetColor = isDropped
            ? 'var(--color-status-error)'
            : pkt.color || 'var(--color-accent-primary)';

          return (
            <g key={pkt.id} transform={`translate(${point.x}, ${point.y})`}>
              <circle
                r={isDropped ? 6 : 5}
                fill={packetColor}
                style={{
                  filter: `drop-shadow(0 0 8px ${packetColor})`,
                  transition: 'transform 0.1s',
                }}
              />
            </g>
          );
        })}

      {/* Edge Live Telemetry & Delete Button Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            backgroundColor: 'var(--color-bg-surface)',
            border: selected ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border-subtle)',
            color: packets.length > 0 ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            pointerEvents: 'all',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {packets.length > 0 && <span>⚡ {packets.length}</span>}
          <button
            onClick={handleDeleteEdge}
            title="Unattach / Delete Connection"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-status-error)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              lineHeight: 1,
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

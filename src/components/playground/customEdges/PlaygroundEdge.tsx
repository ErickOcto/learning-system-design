import { useRef, useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
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
  } = props;

  const pathRef = useRef<SVGPathElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const allPackets = usePlaygroundSimulationStore((s) => s.packets);
  const isPlaying = usePlaygroundSimulationStore((s) => s.isPlaying);

  const packets = useMemo(
    () => allPackets.filter((p) => p.edgeId === id),
    [allPackets, id]
  );

  const pathLength = pathRef.current?.getTotalLength() || 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: packets.length > 0 ? 'var(--color-accent-primary)' : 'var(--color-border-strong)',
          strokeWidth: packets.length > 0 ? 2.5 : 1.5,
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

      {/* Edge Live Telemetry Badge (In-Flight Count) */}
      {(isPlaying || packets.length > 0) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: packets.length > 0 ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span>⚡</span>
            <span>{packets.length}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

import { useRef, useEffect, useState } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { usePlaygroundSimulationStore } from '../engine/usePlaygroundSimulationStore';

export default function PlaygroundEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState<number>(0);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const packets = usePlaygroundSimulationStore((s) =>
    s.packets.filter((p) => p.edgeId === id)
  );

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [edgePath]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: 'var(--color-accent-primary)',
          strokeWidth: 2,
          opacity: 0.6,
          ...style,
        }}
      />
      {/* Invisible path reference to calculate point at length */}
      <path
        ref={pathRef}
        d={edgePath}
        fill="none"
        stroke="transparent"
        style={{ pointerEvents: 'none' }}
      />

      {/* Render in-flight packets along edge path */}
      {pathLength > 0 &&
        packets.map((pkt) => {
          const point = pathRef.current?.getPointAtLength(pkt.progress * pathLength);
          if (!point) return null;

          return (
            <g key={pkt.id} transform={`translate(${point.x}, ${point.y})`}>
              <circle
                r={5}
                fill={pkt.color || 'var(--color-accent-primary)'}
                style={{
                  filter: 'drop-shadow(0 0 6px var(--color-accent-primary))',
                }}
              />
            </g>
          );
        })}
    </>
  );
}

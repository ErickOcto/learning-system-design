import { useEffect, useRef } from 'react';
import { usePlaygroundSimulationStore } from './usePlaygroundSimulationStore';
import { Node, Edge } from '@xyflow/react';

export function useSimulationLoop(nodes: Node[], edges: Edge[]) {
  const isPlaying = usePlaygroundSimulationStore((s) => s.isPlaying);
  const stepSimulation = usePlaygroundSimulationStore((s) => s.stepSimulation);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const deltaMs = Math.min(now - lastTimeRef.current, 100); // cap delta at 100ms
      lastTimeRef.current = now;

      stepSimulation(deltaMs, nodes, edges);

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isPlaying, nodes, edges, stepSimulation]);
}

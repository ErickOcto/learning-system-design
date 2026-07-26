import { useRef, useEffect, useState, useCallback } from 'react';

export interface UseAnimationLoopOptions {
  isPlaying?: boolean;
  speed?: number;
  onTick?: (deltaTime: number, tick: number) => void;
}

export function useAnimationLoop(options: UseAnimationLoopOptions = {}) {
  const { isPlaying: initialPlaying = true, speed = 1, onTick } = options;

  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const tickRef = useRef(0);
  const [tick, setTick] = useState(0);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);
  const speedRef = useRef(speed);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = (time - previousTimeRef.current) * speedRef.current;
      tickRef.current += 1;
      setTick(tickRef.current);
      if (onTickRef.current) {
        onTickRef.current(deltaTime, tickRef.current);
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      previousTimeRef.current = null;
    }

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isPlaying, animate]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);
  const reset = useCallback(() => {
    tickRef.current = 0;
    setTick(0);
    previousTimeRef.current = null;
  }, []);

  return {
    tick,
    isPlaying,
    play,
    pause,
    togglePlay,
    reset,
  };
}

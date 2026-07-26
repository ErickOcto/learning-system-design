import { useRef, useEffect, useState, useCallback } from 'react';

export interface UseAnimationLoopOptions {
  isPlaying?: boolean;
  speed?: number;
  onTick?: (deltaTime: number, tick: number) => void;
}

export function useAnimationLoop(options: UseAnimationLoopOptions = {}) {
  const { isPlaying: initialPlaying = true, speed = 1, onTick } = options;

  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [tick, setTick] = useState(0);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) * speed;
        setTick((prev) => prev + 1);
        if (onTickRef.current) {
          onTickRef.current(deltaTime, tick);
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [speed, tick]
  );

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
      }
    };
  }, [isPlaying, animate]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);
  const reset = useCallback(() => {
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

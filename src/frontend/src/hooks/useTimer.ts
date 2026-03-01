import { useCallback, useEffect, useRef, useState } from "react";
import {
  addToAccumulatedSeconds,
  clearAccumulatedSeconds,
  clearTimerState,
  getAccumulatedSecondsForToday,
  getTimerState,
  saveTimerState,
} from "../lib/storage";

export interface TimerHook {
  /** Elapsed seconds for the CURRENT session only (resets to 0 on each new start). */
  currentSessionElapsed: number;
  /** Sum of all completed sessions today (does NOT include the current running session). */
  accumulatedSeconds: number;
  isRunning: boolean;
  start: () => void;
  /** Stops the timer and returns the current session's elapsed seconds. */
  stop: () => number;
  reset: () => void;
}

export function useTimer(): TimerHook {
  const [currentSessionElapsed, setCurrentSessionElapsed] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const sessionBaseRef = useRef<number>(0); // base elapsed for current session (for page-reload restore)

  // Restore timer state on mount
  useEffect(() => {
    const saved = getTimerState();
    const accumulated = getAccumulatedSecondsForToday();
    setAccumulatedSeconds(accumulated);

    if (saved.isRunning && saved.startedAt !== null) {
      // Restore current session elapsed (time since startedAt + any pre-reload session base)
      const now = Date.now();
      const additionalSeconds = Math.floor((now - saved.startedAt) / 1000);
      const sessionElapsed = saved.elapsed + additionalSeconds;
      sessionBaseRef.current = saved.elapsed;
      startedAtRef.current = saved.startedAt;
      setCurrentSessionElapsed(sessionElapsed);
      setIsRunning(true);
    } else {
      sessionBaseRef.current = saved.elapsed;
      setCurrentSessionElapsed(saved.elapsed);
      setIsRunning(false);
    }
  }, []);

  // Tick interval — only updates currentSessionElapsed
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current !== null) {
          const now = Date.now();
          const additional = Math.floor((now - startedAtRef.current) / 1000);
          setCurrentSessionElapsed(sessionBaseRef.current + additional);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    const now = Date.now();
    // Each new session starts from 0
    sessionBaseRef.current = 0;
    startedAtRef.current = now;
    setCurrentSessionElapsed(0);
    setIsRunning(true);
    saveTimerState({ startedAt: now, elapsed: 0, isRunning: true });
  }, []);

  const stop = useCallback((): number => {
    let sessionSeconds = 0;
    if (startedAtRef.current !== null) {
      const now = Date.now();
      const additional = Math.floor((now - startedAtRef.current) / 1000);
      sessionSeconds = sessionBaseRef.current + additional;
    } else {
      sessionSeconds = sessionBaseRef.current;
    }

    // Add this session to accumulated total
    addToAccumulatedSeconds(sessionSeconds);
    const newAccumulated = getAccumulatedSecondsForToday();
    setAccumulatedSeconds(newAccumulated);

    // Reset current session display
    sessionBaseRef.current = 0;
    startedAtRef.current = null;
    setCurrentSessionElapsed(0);
    setIsRunning(false);
    saveTimerState({ startedAt: null, elapsed: 0, isRunning: false });

    return sessionSeconds;
  }, []);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    sessionBaseRef.current = 0;
    setCurrentSessionElapsed(0);
    setAccumulatedSeconds(0);
    setIsRunning(false);
    clearTimerState();
    clearAccumulatedSeconds();
  }, []);

  return {
    currentSessionElapsed,
    accumulatedSeconds,
    isRunning,
    start,
    stop,
    reset,
  };
}

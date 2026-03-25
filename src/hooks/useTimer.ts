import { useEffect, useRef } from 'react';
import { useStore } from '../store';

/**
 * Rust timer hook — countdown met trillen en geluid
 * Bron: Schoenfeld (2016) — rust tijden per doel
 */
export function useTimer() {
  const {
    timerSeconds,
    timerRunning,
    timerTotal,
    startTimer,
    tickTimer,
    stopTimer,
    adjustTimer,
    timerSoundEnabled,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerSeconds, tickTimer]);

  // Timer afgelopen → trillen
  useEffect(() => {
    if (timerRunning && timerSeconds === 0) {
      stopTimer();
      if (timerSoundEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [timerSeconds, timerRunning, stopTimer, timerSoundEnabled]);

  return {
    seconds: timerSeconds,
    isRunning: timerRunning,
    total: timerTotal,
    progress: timerTotal > 0 ? (timerTotal - timerSeconds) / timerTotal : 0,
    start: startTimer,
    stop: stopTimer,
    adjust: adjustTimer,
  };
}

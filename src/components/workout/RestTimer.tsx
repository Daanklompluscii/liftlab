import { motion } from 'framer-motion';
import { Plus, Minus, SkipForward } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';
import { formatTime } from '../../lib/calculations';

export function RestTimer() {
  const { seconds, isRunning, progress, stop, adjust } = useTimer();

  if (!isRunning && seconds === 0) return null;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-20 left-0 right-0 z-50 px-4"
    >
      <div className="max-w-lg mx-auto bg-bg-card border border-border rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#27272A"
                strokeWidth="6"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold">
              {formatTime(seconds)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex-1">
            <p className="text-sm text-text-secondary mb-2">Rust</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjust(-30)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-elevated border border-border text-text-secondary"
                aria-label="30 seconden minder"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => adjust(30)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-elevated border border-border text-text-secondary"
                aria-label="30 seconden meer"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={stop}
                className="ml-auto w-10 h-10 flex items-center justify-center rounded-lg bg-accent-muted text-accent"
                aria-label="Sla over"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

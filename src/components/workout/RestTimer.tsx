import { motion } from 'framer-motion';
import { Plus, Minus, SkipForward } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';
import { formatTime } from '../../lib/calculations';

export function RestTimer() {
  const { seconds, isRunning, progress, stop, adjust } = useTimer();

  if (!isRunning && seconds === 0) return null;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="fixed bottom-20 right-4 z-50"
    >
      <div className="bg-bg-card border-2 border-accent/40 rounded-2xl p-3 shadow-2xl shadow-accent/10 w-[200px]">
        <div className="flex items-center gap-3">
          {/* Circular progress — compact */}
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#1E1E2A"
                strokeWidth="5"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
              {formatTime(seconds)}
            </span>
          </div>

          {/* Controls — stacked */}
          <div className="flex-1 flex flex-col gap-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Rust</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => adjust(-30)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated border border-border text-text-secondary hover:bg-border transition-colors"
                aria-label="30 seconden minder"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => adjust(30)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated border border-border text-text-secondary hover:bg-border transition-colors"
                aria-label="30 seconden meer"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={stop}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-colors"
                aria-label="Sla over"
              >
                <SkipForward size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

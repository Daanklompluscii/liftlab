import { TIER_COLORS } from '../../data/constants';
import type { Tier } from '../../types';

interface BadgeProps {
  tier: Tier;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, size = 'sm' }: BadgeProps) {
  const color = TIER_COLORS[tier] ?? '#71717A';
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold rounded-md ${sizeClass}`}
      style={{
        color,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
      }}
    >
      {tier}
    </span>
  );
}

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const styles = {
    success: 'bg-success-muted text-success border-success/30',
    warning: 'bg-accent-muted text-accent border-accent/30',
    danger: 'bg-danger-muted text-danger border-danger/30',
    neutral: 'bg-bg-elevated text-text-secondary border-border',
  };

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-lg border ${styles[variant]}`}>
      {children}
    </span>
  );
}

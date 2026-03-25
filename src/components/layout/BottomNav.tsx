import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, BarChart3, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/program', icon: Dumbbell, label: 'Programma' },
  { path: '/progress', icon: BarChart3, label: 'Voortgang' },
  { path: '/learn', icon: BookOpen, label: 'Leren' },
  { path: '/settings', icon: Settings, label: 'Instellingen' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith('/workout/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/80 backdrop-blur-2xl border-t border-border/50"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 h-14">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full relative"
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? 'bg-accent/10' : ''
              }`}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={`transition-colors ${isActive ? 'text-accent' : 'text-text-muted'}`}
                />
              </div>
              <span
                className={`text-[9px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

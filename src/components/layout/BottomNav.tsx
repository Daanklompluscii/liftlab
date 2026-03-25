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

  // Verberg nav tijdens actieve workout
  if (location.pathname.startsWith('/workout/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/90 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 h-16">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-3 right-3 h-0.5 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={22}
                className={isActive ? 'text-accent' : 'text-text-muted'}
              />
              <span
                className={`text-[10px] font-medium ${
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

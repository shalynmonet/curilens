import { NavLink } from 'react-router-dom';
import { Home, Library, Share2, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/share-setup', label: 'Share', icon: Share2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-ivory-300/60">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'text-midnight-600'
                    : 'text-midnight-300 hover:text-midnight-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="transition-all duration-300"
                  />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { Wallet, BarChart3, PieChart, CalendarClock, Settings } from 'lucide-react';

/** Items de la navegación inferior. */
const items = [
  { to: '/', label: 'Gastos', icon: Wallet, end: true },
  { to: '/estadisticas', label: 'Stats', icon: BarChart3, end: false },
  { to: '/cartera', label: 'Cartera', icon: PieChart, end: false },
  { to: '/planificar', label: 'Planes', icon: CalendarClock, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false },
];

/** Barra de navegación inferior fija (mobile-first). */
export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-100 dark:border-slate-800
                 bg-white/90 dark:bg-slate-900/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive ? 'text-accent' : 'text-slate-400'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

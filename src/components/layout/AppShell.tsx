import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { LogoutButton } from '@/features/auth/LogoutButton';

/** Contenedor raíz: ancho máximo tipo móvil, padding seguro y nav inferior. */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <LogoutButton />
      <main
        // key por ruta: reanima el contenido con un fundido suave al cambiar de pestaña.
        key={pathname}
        className="mx-auto max-w-md px-4 pt-6 animate-[fadeIn_0.25s_ease-out]"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

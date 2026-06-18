import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Login } from './Login';

/**
 * Gate de autenticación a nivel de App.
 * - Al cargar, lee la sesión con supabase.auth.getSession().
 * - Se mantiene al día con supabase.auth.onAuthStateChange.
 * - Sin sesión: muestra solo el login.
 * - Con sesión: renderiza la app actual (children) sin cambios.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[AuthGate] getSession → session:', data.session, '| error:', error);
      setSession(data.session);
      setCargando(false);
    }).catch((err) => {
      console.error('[AuthGate] getSession rechazó:', err);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-slate-50 dark:bg-slate-950 text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!session) return <Login />;

  return <>{children}</>;
}

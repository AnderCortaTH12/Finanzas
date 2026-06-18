import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/** Botón discreto para cerrar la sesión de Supabase. */
export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => supabase.auth.signOut()}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
      className="fixed top-3 right-3 z-50 rounded-full p-2 text-slate-400
                 hover:text-slate-700 dark:hover:text-slate-200
                 bg-white/70 dark:bg-slate-900/70 backdrop-blur transition-colors"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <LogOut size={18} />
    </button>
  );
}

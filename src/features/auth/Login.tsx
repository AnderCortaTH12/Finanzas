import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Pantalla de login simple por enlace mágico (OTP por email).
 * Pide un email y, al enviarlo, llama a supabase.auth.signInWithOtp.
 * No es una ruta del router; se renderiza desde el gate de App.
 */
export function Login() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setCargando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4
                    bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200
                      dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Iniciar sesión
        </h1>

        {enviado ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Revisa tu correo: te hemos enviado un enlace para acceder a{' '}
            <span className="font-medium">{email}</span>.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1 w-full rounded-lg border border-slate-300
                           dark:border-slate-700 bg-white dark:bg-slate-950
                           px-3 py-2 text-slate-900 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white
                         font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {cargando ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

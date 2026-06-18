import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './providers';
import { AppShell } from '@/components/layout/AppShell';
import { AppRoutes } from './routes';
import { ProfileGate } from '@/features/profiles/ProfileGate';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import { AuthGate } from '@/features/auth/AuthGate';

/** Decide qué mostrar según haya o no un perfil activo y desbloqueado. */
function Gated() {
  const { usuario, cargando } = useApp();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-slate-50 dark:bg-slate-950 text-slate-400">
        Cargando…
      </div>
    );
  }

  // Sin perfil activo: pantalla de selección + PIN.
  if (!usuario) return <ProfileGate />;

  // Con perfil activo: la app normal.
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthGate>
        <AppProvider>
          <Gated />
        </AppProvider>
      </AuthGate>
    </ThemeProvider>
  );
}

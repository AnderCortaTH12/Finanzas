import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { seedIfEmpty } from '@/db/seed';
import { listUsuarios } from '@/features/profiles/profileService';
import type { Usuario } from '@/models/types';

const STORAGE_KEY = 'finanzas:perfilActivo';

interface AppContextValue {
  /** Lista de perfiles disponibles. */
  usuarios: Usuario[];
  /** Perfil activo y desbloqueado, o null si hay que seleccionar/desbloquear. */
  usuario: Usuario | null;
  cargando: boolean;
  /** Selecciona un perfil ya desbloqueado (PIN verificado o sin PIN). */
  desbloquear: (usuario: Usuario) => void;
  /** Cierra el perfil activo y vuelve a la pantalla de selección. */
  bloquear: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

/** Hook de conveniencia que garantiza un usuario activo. */
export function useUsuarioId(): string {
  const { usuario } = useApp();
  if (!usuario) throw new Error('No hay perfil activo');
  return usuario.id;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);
  const [activoId, setActivoId] = useState<string | null>(null);

  // Lista reactiva de perfiles (se actualiza al crear/borrar).
  const usuarios = useLiveQuery(() => listUsuarios(), []) ?? [];

  // Inicialización: semilla + recupera el último perfil activo.
  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      setActivoId(localStorage.getItem(STORAGE_KEY));
      setListo(true);
    })();
  }, []);

  // El perfil activo se considera "desbloqueado" si está en activoId.
  const usuario = useMemo(
    () => usuarios.find((u) => u.id === activoId) ?? null,
    [usuarios, activoId],
  );

  function desbloquear(u: Usuario) {
    localStorage.setItem(STORAGE_KEY, u.id);
    setActivoId(u.id);
  }

  function bloquear() {
    localStorage.removeItem(STORAGE_KEY);
    setActivoId(null);
  }

  const cargando = !listo;

  return (
    <AppContext.Provider
      value={{ usuarios, usuario, cargando, desbloquear, bloquear }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Reexport para conveniencia en servicios que lo necesiten.
export { db };

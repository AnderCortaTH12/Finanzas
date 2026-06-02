import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';

interface ThemeContextValue {
  tema: Tema;
  setTema: (t: Tema) => void;
  /** ¿Está oscuro ahora mismo (resolviendo 'sistema')? */
  oscuroActivo: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'finanzas:tema';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

function prefiereOscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(
    () => (localStorage.getItem(STORAGE_KEY) as Tema) ?? 'sistema',
  );
  const [oscuroActivo, setOscuroActivo] = useState(false);

  useEffect(() => {
    const aplicar = () => {
      const oscuro = tema === 'oscuro' || (tema === 'sistema' && prefiereOscuro());
      document.documentElement.classList.toggle('dark', oscuro);
      setOscuroActivo(oscuro);
    };
    aplicar();

    // Si el tema es 'sistema', reacciona a los cambios del SO.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, [tema]);

  function setTema(t: Tema) {
    localStorage.setItem(STORAGE_KEY, t);
    setTemaState(t);
  }

  return (
    <ThemeContext.Provider value={{ tema, setTema, oscuroActivo }}>
      {children}
    </ThemeContext.Provider>
  );
}

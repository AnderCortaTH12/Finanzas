import { Sun, Moon, SunMoon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTheme, type Tema } from './ThemeProvider';

const OPCIONES: { valor: Tema; label: string; icono: typeof Sun }[] = [
  { valor: 'claro', label: 'Claro', icono: Sun },
  { valor: 'oscuro', label: 'Oscuro', icono: Moon },
  { valor: 'sistema', label: 'Auto', icono: SunMoon },
];

/** Selector de tema: claro / oscuro / automático (según el sistema). */
export function ThemeCard() {
  const { tema, setTema } = useTheme();

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-500 mb-3">Apariencia</h2>
      <div className="grid grid-cols-3 gap-2">
        {OPCIONES.map(({ valor, label, icono: Icono }) => {
          const activo = tema === valor;
          return (
            <button
              key={valor}
              onClick={() => setTema(valor)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 transition ${
                activo
                  ? 'bg-accent/10 text-accent ring-2 ring-accent'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Icono size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

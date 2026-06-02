import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { listCategorias } from '@/features/categories/categoryService';
import { parseEurInput } from '@/lib/money';
import { todayIso } from '@/lib/dates';
import { useUsuarioId } from '@/app/providers';
import type { Periodicidad } from '@/models/types';
import { addRecurrente, ETIQUETA_PERIODICIDAD } from '../recurringService';

interface RecurringFormProps {
  open: boolean;
  onClose: () => void;
}

const PERIODICIDADES: Periodicidad[] = ['mensual', 'bimestral', 'trimestral', 'anual'];

/** Formulario para crear un gasto recurrente (gas, luz, suscripción…). */
export function RecurringForm({ open, onClose }: RecurringFormProps) {
  const usuarioId = useUsuarioId();
  const categorias = useLiveQuery(() => listCategorias(), []) ?? [];
  const [importe, setImporte] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [proximaFecha, setProximaFecha] = useState(todayIso());
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setImporte('');
      setCategoriaId(null);
      setPeriodicidad('mensual');
      setProximaFecha(todayIso());
      setNota('');
      setError(null);
    }
  }, [open]);

  async function handleGuardar() {
    const cents = parseEurInput(importe);
    if (cents === null || cents === 0) return setError('Introduce un importe válido');
    if (!categoriaId) return setError('Elige una categoría');
    await addRecurrente({
      usuarioId,
      importe: cents,
      categoriaId,
      periodicidad,
      proximaFecha,
      nota: nota.trim() || undefined,
    });
    onClose();
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 ' +
    'bg-transparent px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent';

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo recibo recurrente">
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs text-slate-500">Importe</span>
          <div className="flex items-baseline gap-1">
            <input
              inputMode="decimal"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="60,00"
              className={inputCls}
            />
            <span className="text-lg text-slate-400">€</span>
          </div>
        </label>

        <CategoryPicker
          categorias={categorias}
          selectedId={categoriaId}
          onSelect={setCategoriaId}
        />

        <div>
          <span className="text-xs text-slate-500">Periodicidad</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PERIODICIDADES.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodicidad(p)}
                className={`rounded-xl py-2 text-sm transition ${
                  periodicidad === p
                    ? 'bg-accent/10 text-accent ring-2 ring-accent'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {ETIQUETA_PERIODICIDAD[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-500">Próximo cobro</span>
            <input
              type="date"
              value={proximaFecha}
              onChange={(e) => setProximaFecha(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Nota</span>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Luz"
              className={inputCls}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <Button onClick={handleGuardar} className="w-full">
          Guardar recibo
        </Button>
      </div>
    </Sheet>
  );
}

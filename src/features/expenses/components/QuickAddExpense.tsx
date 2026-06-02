import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { listCategorias } from '@/features/categories/categoryService';
import { addGasto } from '../expenseService';
import { parseEurInput } from '@/lib/money';
import { todayIso } from '@/lib/dates';
import { useUsuarioId } from '@/app/providers';

interface QuickAddExpenseProps {
  open: boolean;
  onClose: () => void;
}

/** Formulario rápido para registrar un gasto en pocos toques. */
export function QuickAddExpense({ open, onClose }: QuickAddExpenseProps) {
  const usuarioId = useUsuarioId();
  const categorias = useLiveQuery(() => listCategorias(), []) ?? [];

  const [importe, setImporte] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(todayIso());
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (open) {
      setImporte('');
      setCategoriaId(null);
      setFecha(todayIso());
      setNota('');
      setError(null);
    }
  }, [open]);

  async function handleGuardar() {
    const cents = parseEurInput(importe);
    if (cents === null || cents === 0) {
      setError('Introduce un importe válido');
      return;
    }
    if (!categoriaId) {
      setError('Elige una categoría');
      return;
    }
    await addGasto({ usuarioId, importe: cents, categoriaId, fecha, nota: nota.trim() || undefined });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo gasto">
      <div className="space-y-5">
        {/* Importe: campo grande y protagonista */}
        <div>
          <div className="flex items-baseline justify-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="0,00"
              className="w-40 bg-transparent text-center text-5xl font-semibold
                         text-slate-900 dark:text-white outline-none placeholder:text-slate-300"
            />
            <span className="text-3xl font-medium text-slate-400">€</span>
          </div>
        </div>

        {/* Categorías */}
        <CategoryPicker
          categorias={categorias}
          selectedId={categoriaId}
          onSelect={setCategoriaId}
        />

        {/* Fecha y nota */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700
                         bg-transparent px-3 py-2 text-slate-900 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Nota (opcional)</span>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: cena"
              className="rounded-xl border border-slate-200 dark:border-slate-700
                         bg-transparent px-3 py-2 text-slate-900 dark:text-white"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button onClick={handleGuardar} className="w-full">
          Guardar gasto
        </Button>
      </div>
    </Sheet>
  );
}

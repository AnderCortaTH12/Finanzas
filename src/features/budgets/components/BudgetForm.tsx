import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { listCategorias } from '@/features/categories/categoryService';
import { parseEurInput } from '@/lib/money';
import { useUsuarioId } from '@/app/providers';
import { setPresupuesto } from '../budgetService';

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
}

/** Define el tope mensual de una categoría. */
export function BudgetForm({ open, onClose }: BudgetFormProps) {
  const usuarioId = useUsuarioId();
  const categorias = useLiveQuery(() => listCategorias(), []) ?? [];
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [tope, setTope] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCategoriaId(null);
      setTope('');
      setError(null);
    }
  }, [open]);

  async function handleGuardar() {
    const cents = parseEurInput(tope);
    if (!categoriaId) return setError('Elige una categoría');
    if (cents === null || cents === 0) return setError('Introduce un tope válido');
    await setPresupuesto(usuarioId, categoriaId, cents);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Presupuesto mensual">
      <div className="space-y-5">
        <CategoryPicker
          categorias={categorias}
          selectedId={categoriaId}
          onSelect={setCategoriaId}
        />
        <label className="block">
          <span className="text-xs text-slate-500">Tope mensual</span>
          <div className="flex items-baseline gap-1">
            <input
              inputMode="decimal"
              value={tope}
              onChange={(e) => setTope(e.target.value)}
              placeholder="200,00"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700
                         bg-transparent px-3 py-2.5 text-slate-900 dark:text-white outline-none
                         focus:ring-2 focus:ring-accent"
            />
            <span className="text-lg text-slate-400">€</span>
          </div>
        </label>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <Button onClick={handleGuardar} className="w-full">
          Guardar presupuesto
        </Button>
      </div>
    </Sheet>
  );
}

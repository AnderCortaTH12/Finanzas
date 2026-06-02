import { Pencil, Trash2 } from 'lucide-react';
import type { Categoria, Gasto } from '@/models/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatEur } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import { borrarTicket } from '../inventoryService';

interface ExpenseListProps {
  gastos: Gasto[];
  categorias: Map<string, Categoria>;
  /** Abre el formulario para editar el gasto pulsado. */
  onEditar?: (gasto: Gasto) => void;
}

/** Lista de gastos individuales con icono de categoría, importe, editar y borrar. */
export function ExpenseList({ gastos, categorias, onEditar }: ExpenseListProps) {
  if (gastos.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">
        No hay gastos este mes. Pulsa + para añadir el primero.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {gastos.map((g) => {
        const cat = categorias.get(g.categoriaId);
        return (
          <li key={g.id} className="flex items-center gap-3 py-3">
            <CategoryIcon
              name={cat?.icono ?? 'circle'}
              color={cat?.color ?? '#94a3b8'}
              withBackground
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-white truncate">
                {cat?.nombre ?? 'Sin categoría'}
              </p>
              <p className="text-sm text-slate-400 truncate">
                {formatDate(g.fecha)}
                {g.nota ? ` · ${g.nota}` : ''}
              </p>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatEur(g.importe)}
            </span>
            {onEditar && (
              <button
                onClick={() => onEditar(g)}
                className="p-2 text-slate-300 hover:text-accent"
                aria-label="Editar gasto"
              >
                <Pencil size={18} />
              </button>
            )}
            <button
              onClick={() => borrarTicket(g.id)}
              className="p-2 text-slate-300 hover:text-red-500"
              aria-label="Borrar gasto"
            >
              <Trash2 size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

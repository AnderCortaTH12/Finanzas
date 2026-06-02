import { Trash2 } from 'lucide-react';
import type { Categoria } from '@/models/types';
import type { ProgresoPresupuesto } from '../budgetService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatEur } from '@/lib/money';
import { deletePresupuesto } from '../budgetService';

interface BudgetBarProps {
  progreso: ProgresoPresupuesto;
  categoria?: Categoria;
}

/** Barra de progreso de un presupuesto: gastado / tope, con color según estado. */
export function BudgetBar({ progreso, categoria }: BudgetBarProps) {
  const { presupuesto, gastado, restante, porcentaje, superado } = progreso;
  const ancho = Math.min(porcentaje, 100);

  // Verde < 80%, ámbar 80-100%, rojo si se supera.
  const colorBarra = superado
    ? '#ef4444'
    : porcentaje >= 80
      ? '#f59e0b'
      : (categoria?.color ?? '#10b981');

  return (
    <li className="py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <CategoryIcon
          name={categoria?.icono ?? 'circle'}
          color={categoria?.color ?? '#94a3b8'}
          size={16}
        />
        <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
          {categoria?.nombre ?? 'Categoría'}
        </span>
        <span className={`text-sm ${superado ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
          {formatEur(gastado)} / {formatEur(presupuesto.topeMensual)}
        </span>
        <button
          onClick={() => deletePresupuesto(presupuesto.id)}
          className="p-1 text-slate-300 hover:text-red-500"
          aria-label="Borrar presupuesto"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${ancho}%`, backgroundColor: colorBarra }}
        />
      </div>
      <p className={`mt-1 text-xs ${superado ? 'text-red-500' : 'text-slate-400'}`}>
        {superado
          ? `Te has pasado ${formatEur(Math.abs(restante))}`
          : `Te quedan ${formatEur(restante)} (${Math.round(porcentaje)}%)`}
      </p>
    </li>
  );
}

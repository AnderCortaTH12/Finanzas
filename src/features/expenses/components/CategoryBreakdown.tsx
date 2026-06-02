import type { Categoria } from '@/models/types';
import type { TotalPorCategoria } from '../expenseService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatEur } from '@/lib/money';

interface CategoryBreakdownProps {
  datos: TotalPorCategoria[];
  categorias: Map<string, Categoria>;
  total: number; // céntimos
}

/** Desglose por categoría: icono, nombre, % y barra proporcional. */
export function CategoryBreakdown({ datos, categorias, total }: CategoryBreakdownProps) {
  return (
    <ul className="space-y-3">
      {datos.map((d) => {
        const cat = categorias.get(d.categoriaId);
        const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
        const color = cat?.color ?? '#94a3b8';
        return (
          <li key={d.categoriaId} className="flex items-center gap-3">
            <CategoryIcon name={cat?.icono ?? 'circle'} color={color} withBackground size={16} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-200 truncate">
                  {cat?.nombre ?? 'Sin categoría'}
                </span>
                <span className="text-slate-500 tabular-nums">
                  {formatEur(d.total)} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

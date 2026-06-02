import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Categoria } from '@/models/types';
import type { TotalPorCategoria } from '../expenseService';
import { formatEur } from '@/lib/money';
import { centsToEuros } from '@/lib/money';

interface CategoryPieChartProps {
  datos: TotalPorCategoria[];
  categorias: Map<string, Categoria>;
  total: number; // céntimos
}

/** Gráfico de tarta (donut) del gasto por categoría, con total en el centro. */
export function CategoryPieChart({ datos, categorias, total }: CategoryPieChartProps) {
  if (datos.length === 0) return null;

  const chartData = datos.map((d) => {
    const cat = categorias.get(d.categoriaId);
    return {
      name: cat?.nombre ?? 'Otros',
      value: centsToEuros(d.total),
      color: cat?.color ?? '#94a3b8',
    };
  });

  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Total centrado encima del donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-slate-400">Total</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {formatEur(total)}
        </span>
      </div>
    </div>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { TotalMensual } from '../statsService';
import { centsToEuros, formatEur } from '@/lib/money';

interface MonthlyTrendChartProps {
  datos: TotalMensual[];
}

/** Etiqueta corta del mes para el eje: 'jun'. */
function etiquetaMesCorta(mesKey: string): string {
  const [y, m] = mesKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' });
}

/** Tooltip personalizado que muestra el importe en €. */
function TooltipBarra({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white shadow">
      {formatEur(payload[0].payload.totalCents)}
    </div>
  );
}

/** Gráfico de barras del gasto total de los últimos meses; resalta el actual. */
export function MonthlyTrendChart({ datos }: MonthlyTrendChartProps) {
  const chartData = datos.map((d, i) => ({
    mes: etiquetaMesCorta(d.mes),
    total: centsToEuros(d.total),
    totalCents: d.total,
    esActual: i === datos.length - 1, // el último es el mes en curso
  }));

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <Tooltip cursor={{ fill: 'transparent' }} content={<TooltipBarra />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.esActual ? '#10b981' : '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

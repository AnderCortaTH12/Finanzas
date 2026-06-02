import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
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

  // Si no hay ningún gasto en toda la ventana, evitamos un gráfico vacío.
  const hayDatos = chartData.some((d) => d.totalCents > 0);
  if (!hayDatos) {
    return (
      <div className="flex h-44 items-center justify-center text-center text-sm text-slate-400">
        Aún no hay histórico suficiente.
        <br />
        Verás la evolución según registres gastos.
      </div>
    );
  }

  return (
    // minHeight asegura que el contenedor tenga altura aunque el layout tarde.
    <div className="h-44" style={{ minHeight: 176 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={176}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          {/* Eje Y oculto: solo sirve para que las barras escalen bien. */}
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip cursor={{ fill: 'transparent' }} content={<TooltipBarra />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} minPointSize={3} maxBarSize={40}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.esActual ? '#10b981' : '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

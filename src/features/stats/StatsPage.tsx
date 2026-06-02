import { useLiveQuery } from 'dexie-react-hooks';
import {
  Wallet,
  Receipt,
  CalendarDays,
  ArrowUpCircle,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/app/providers';
import { categoriasById } from '@/features/categories/categoryService';
import { calcularEstadisticas } from './statsService';
import { StatTile } from './components/StatTile';
import { MonthlyTrendChart } from './components/MonthlyTrendChart';
import { CategoryPieChart } from '@/features/expenses/charts/CategoryPieChart';
import { CategoryBreakdown } from '@/features/expenses/components/CategoryBreakdown';
import { formatEur } from '@/lib/money';
import { monthLabel, currentMonthKey } from '@/lib/dates';

/** Pestaña de estadísticas: métricas rápidas, tendencia y distribución. */
export function StatsPage() {
  const { usuario } = useApp();

  const stats = useLiveQuery(
    () => (usuario ? calcularEstadisticas(usuario.id) : null),
    [usuario?.id],
  );
  const categorias = useLiveQuery(() => categoriasById(), []);

  if (!stats || !categorias) {
    return <div className="p-8 text-center text-slate-400">Cargando…</div>;
  }

  const { mesActual, tendencia } = stats;
  const sinDatos = mesActual.numGastos === 0;

  return (
    <div className="space-y-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estadísticas</h1>
        <p className="text-sm text-slate-400 capitalize">{monthLabel(currentMonthKey())}</p>
      </header>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Gastado este mes"
          valor={formatEur(mesActual.total)}
          icono={<Wallet size={20} />}
        />
        <StatTile
          label="Media al día"
          valor={formatEur(mesActual.mediaDiaria)}
          icono={<CalendarDays size={20} />}
        />
        <StatTile
          label="Gasto medio"
          valor={formatEur(mesActual.ticketMedio)}
          sub={`${mesActual.numGastos} movimiento${mesActual.numGastos === 1 ? '' : 's'}`}
          icono={<Receipt size={20} />}
        />
        <StatTile
          label="Mayor gasto"
          valor={formatEur(mesActual.gastoMaximo)}
          icono={<ArrowUpCircle size={20} />}
        />
      </div>

      {/* Tendencia últimos 6 meses */}
      <Card className="p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <TrendingUp size={15} /> Últimos 6 meses
        </h2>
        <MonthlyTrendChart datos={tendencia} />
      </Card>

      {/* Distribución por categoría */}
      {sinDatos ? (
        <Card className="p-8 text-center text-slate-400 text-sm">
          Aún no hay gastos este mes. Cuando registres alguno, verás aquí su
          distribución.
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-slate-500">Distribución</h2>
            <CategoryPieChart
              datos={mesActual.porCategoria}
              categorias={categorias}
              total={mesActual.total}
            />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Por categoría</h2>
            <CategoryBreakdown
              datos={mesActual.porCategoria}
              categorias={categorias}
              total={mesActual.total}
            />
          </Card>
        </>
      )}
    </div>
  );
}

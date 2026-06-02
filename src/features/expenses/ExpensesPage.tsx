import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/app/providers';
import { categoriasById } from '@/features/categories/categoryService';
import {
  gastosDelMes,
  agruparPorCategoria,
  totalGastos,
} from './expenseService';
import { currentMonthKey, previousMonthKey, monthLabel } from '@/lib/dates';
import { QuickAddExpense } from './components/QuickAddExpense';
import { ExpenseList } from './components/ExpenseList';
import { CategoryPieChart } from './charts/CategoryPieChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { MonthComparison } from './components/MonthComparison';

/** Pantalla principal de la Fase 1: gastos del mes con gráficos y comparativa. */
export function ExpensesPage() {
  const { usuario, cargando } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);

  const mesActual = currentMonthKey();
  const mesAnterior = previousMonthKey();

  // Consultas reactivas: se recalculan solas al añadir/borrar gastos.
  const gastos = useLiveQuery(
    () => (usuario ? gastosDelMes(usuario.id, mesActual) : []),
    [usuario?.id, mesActual],
  );
  const gastosAnt = useLiveQuery(
    () => (usuario ? gastosDelMes(usuario.id, mesAnterior) : []),
    [usuario?.id, mesAnterior],
  );
  const categorias = useLiveQuery(() => categoriasById(), []);

  const { porCategoria, total } = useMemo(() => {
    const lista = gastos ?? [];
    return {
      porCategoria: agruparPorCategoria(lista),
      total: totalGastos(lista),
    };
  }, [gastos]);

  const totalAnterior = useMemo(() => totalGastos(gastosAnt ?? []), [gastosAnt]);

  if (cargando || !categorias) {
    return <div className="p-8 text-center text-slate-400">Cargando…</div>;
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Cabecera */}
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
          {monthLabel(mesActual)}
        </h1>
      </header>

      {/* Gráfico de tarta con total */}
      {porCategoria.length > 0 && (
        <Card className="p-4">
          <CategoryPieChart datos={porCategoria} categorias={categorias} total={total} />
        </Card>
      )}

      {/* Comparativa mensual */}
      <MonthComparison totalActual={total} totalAnterior={totalAnterior} />

      {/* Desglose por categoría */}
      {porCategoria.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Por categoría</h2>
          <CategoryBreakdown datos={porCategoria} categorias={categorias} total={total} />
        </Card>
      )}

      {/* Lista de movimientos */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-1">Movimientos</h2>
        <ExpenseList gastos={gastos ?? []} categorias={categorias} />
      </Card>

      {/* Botón flotante para añadir gasto */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center
                   rounded-full bg-accent text-white shadow-lg active:scale-95 transition"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        aria-label="Añadir gasto"
      >
        <Plus size={28} />
      </button>

      <QuickAddExpense open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

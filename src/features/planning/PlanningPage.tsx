import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Bell, CalendarClock, Trash2, Pause, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/app/providers';
import { categoriasById } from '@/features/categories/categoryService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatEur } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import { progresoPresupuestos } from '@/features/budgets/budgetService';
import { BudgetBar } from '@/features/budgets/components/BudgetBar';
import { BudgetForm } from '@/features/budgets/components/BudgetForm';
import {
  listRecurrentes,
  vencidos,
  proximos,
  registrarRecurrente,
  deleteRecurrente,
  toggleRecurrente,
  proyeccionMensual,
  ETIQUETA_PERIODICIDAD,
} from '@/features/recurring/recurringService';
import { RecurringForm } from '@/features/recurring/components/RecurringForm';

/** Fase 4: presupuestos por categoría + recibos recurrentes con avisos. */
export function PlanningPage() {
  const { usuario } = useApp();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const categorias = useLiveQuery(() => categoriasById(), []);
  const recurrentes = useLiveQuery(
    () => (usuario ? listRecurrentes(usuario.id) : []),
    [usuario?.id],
  );
  const progresos = useLiveQuery(
    () => (usuario ? progresoPresupuestos(usuario.id) : []),
    // Recalcula cuando cambian los recurrentes (al registrar uno se crea un gasto).
    [usuario?.id, recurrentes],
  );

  if (!categorias || !recurrentes || !progresos) {
    return <div className="p-8 text-center text-slate-400">Cargando…</div>;
  }

  const recVencidos = vencidos(recurrentes);
  const recProximos = proximos(recurrentes);
  const proyeccion = proyeccionMensual(recurrentes);

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planificar</h1>

      {/* Avisos de recibos vencidos */}
      {recVencidos.length > 0 && (
        <Card className="p-4 border border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
            <Bell size={18} />
            <h2 className="text-sm font-semibold">
              {recVencidos.length} recibo{recVencidos.length > 1 ? 's' : ''} pendiente
              {recVencidos.length > 1 ? 's' : ''}
            </h2>
          </div>
          <ul className="space-y-2">
            {recVencidos.map((r) => {
              const cat = categorias.get(r.categoriaId);
              return (
                <li key={r.id} className="flex items-center gap-3">
                  <CategoryIcon
                    name={cat?.icono ?? 'circle'}
                    color={cat?.color ?? '#94a3b8'}
                    withBackground
                    size={16}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {r.nota ?? cat?.nombre} · {formatEur(r.importe)}
                    </p>
                    <p className="text-xs text-slate-400">Venció el {formatDate(r.proximaFecha)}</p>
                  </div>
                  <Button onClick={() => registrarRecurrente(r)} className="px-3 py-1.5 text-sm">
                    Registrar
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Presupuestos */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-500">Presupuestos del mes</h2>
          <button
            onClick={() => setBudgetOpen(true)}
            className="flex items-center gap-1 text-sm text-accent"
          >
            <Plus size={16} /> Añadir
          </button>
        </div>
        {progresos.length === 0 ? (
          <p className="text-center text-slate-400 py-6 text-sm">
            Sin presupuestos. Añade un tope mensual por categoría.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {progresos.map((p) => (
              <BudgetBar
                key={p.presupuesto.id}
                progreso={p}
                categoria={categorias.get(p.presupuesto.categoriaId)}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Recurrentes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-500">Recibos recurrentes</h2>
          <button
            onClick={() => setRecurringOpen(true)}
            className="flex items-center gap-1 text-sm text-accent"
          >
            <Plus size={16} /> Añadir
          </button>
        </div>

        {recurrentes.length === 0 ? (
          <p className="text-center text-slate-400 py-6 text-sm">
            Sin recibos. Añade gas, luz, suscripciones…
          </p>
        ) : (
          <>
            {proyeccion > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-sm text-slate-500">
                <CalendarClock size={15} />
                Proyección mensual: <strong>{formatEur(proyeccion)}</strong>
              </p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...recVencidos, ...recProximos, ...recurrentes.filter((r) => !r.activo)].map(
                (r) => {
                  const cat = categorias.get(r.categoriaId);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-3">
                      <CategoryIcon
                        name={cat?.icono ?? 'circle'}
                        color={cat?.color ?? '#94a3b8'}
                        withBackground
                        size={16}
                      />
                      <div className={`flex-1 min-w-0 ${r.activo ? '' : 'opacity-40'}`}>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {r.nota ?? cat?.nombre}
                        </p>
                        <p className="text-xs text-slate-400">
                          {ETIQUETA_PERIODICIDAD[r.periodicidad]} · próx. {formatDate(r.proximaFecha)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatEur(r.importe)}
                      </span>
                      <button
                        onClick={() => toggleRecurrente(r.id, !r.activo)}
                        className="p-1.5 text-slate-300 hover:text-slate-500"
                        aria-label={r.activo ? 'Pausar' : 'Reanudar'}
                      >
                        {r.activo ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => deleteRecurrente(r.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500"
                        aria-label="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          </>
        )}
      </Card>

      <BudgetForm open={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <RecurringForm open={recurringOpen} onClose={() => setRecurringOpen(false)} />
    </div>
  );
}

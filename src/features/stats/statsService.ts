import { db } from '@/db/database';
import type { Cents, Gasto } from '@/models/types';
import { currentMonthKey, monthKey } from '@/lib/dates';
import { agruparPorCategoria, type TotalPorCategoria } from '@/features/expenses/expenseService';

/** Todos los gastos de un usuario (sin filtrar por mes). */
function todosLosGastos(usuarioId: string): Promise<Gasto[]> {
  return db.gastos.where('usuarioId').equals(usuarioId).toArray();
}

export interface TotalMensual {
  mes: string; // 'YYYY-MM'
  total: Cents;
}

/** Genera las claves de los últimos N meses, del más antiguo al actual. */
export function ultimosNMeses(n: number, hoy = new Date()): string[] {
  const claves: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    claves.push(d.toISOString().slice(0, 7));
  }
  return claves;
}

export interface EstadisticasMes {
  total: Cents;
  numGastos: number;
  ticketMedio: Cents; // gasto medio por movimiento
  mediaDiaria: Cents; // total / días transcurridos del mes
  gastoMaximo: Cents; // mayor gasto individual
  porCategoria: TotalPorCategoria[];
}

export interface ResumenEstadisticas {
  mesActual: EstadisticasMes;
  tendencia: TotalMensual[]; // últimos 6 meses
}

/** Calcula todas las estadísticas que muestra la pestaña. */
export async function calcularEstadisticas(
  usuarioId: string,
  meses = 6,
): Promise<ResumenEstadisticas> {
  const gastos = await todosLosGastos(usuarioId);
  const mesActual = currentMonthKey();

  // Tendencia: total por mes en la ventana de N meses.
  const claves = ultimosNMeses(meses);
  const totalesPorMes = new Map<string, Cents>(claves.map((k) => [k, 0]));
  for (const g of gastos) {
    const k = monthKey(g.fecha);
    if (totalesPorMes.has(k)) {
      totalesPorMes.set(k, totalesPorMes.get(k)! + g.importe);
    }
  }
  const tendencia: TotalMensual[] = claves.map((mes) => ({
    mes,
    total: totalesPorMes.get(mes) ?? 0,
  }));

  // Estadísticas del mes actual.
  const gastosMes = gastos.filter((g) => g.fecha.startsWith(mesActual));
  const total = gastosMes.reduce((acc, g) => acc + g.importe, 0);
  const numGastos = gastosMes.length;
  const ticketMedio = numGastos > 0 ? Math.round(total / numGastos) : 0;
  const gastoMaximo = gastosMes.reduce((max, g) => Math.max(max, g.importe), 0);

  // Media diaria: total entre los días transcurridos del mes (hasta hoy).
  const diaDeHoy = new Date().getDate();
  const mediaDiaria = diaDeHoy > 0 ? Math.round(total / diaDeHoy) : 0;

  return {
    mesActual: {
      total,
      numGastos,
      ticketMedio,
      mediaDiaria,
      gastoMaximo,
      porCategoria: agruparPorCategoria(gastosMes),
    },
    tendencia,
  };
}

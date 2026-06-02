import { db } from '@/db/database';
import type { Cents, Presupuesto } from '@/models/types';
import { gastosDelMes, agruparPorCategoria } from '@/features/expenses/expenseService';
import { currentMonthKey } from '@/lib/dates';

export function listPresupuestos(usuarioId: string): Promise<Presupuesto[]> {
  return db.presupuestos.where('usuarioId').equals(usuarioId).toArray();
}

/** Crea o actualiza el presupuesto de una categoría (uno por categoría). */
export async function setPresupuesto(
  usuarioId: string,
  categoriaId: string,
  topeMensual: Cents,
): Promise<void> {
  const existente = await db.presupuestos
    .where('usuarioId')
    .equals(usuarioId)
    .filter((p) => p.categoriaId === categoriaId)
    .first();

  if (existente) {
    await db.presupuestos.update(existente.id, { topeMensual });
  } else {
    await db.presupuestos.add({
      id: crypto.randomUUID(),
      usuarioId,
      categoriaId,
      topeMensual,
    });
  }
}

export async function deletePresupuesto(id: string): Promise<void> {
  await db.presupuestos.delete(id);
}

export interface ProgresoPresupuesto {
  presupuesto: Presupuesto;
  gastado: Cents;
  restante: Cents; // puede ser negativo si se ha superado
  porcentaje: number; // 0..100+ (puede pasar de 100)
  superado: boolean;
}

/**
 * Calcula el progreso de cada presupuesto en el mes actual:
 * cuánto se ha gastado en su categoría frente al tope.
 */
export async function progresoPresupuestos(
  usuarioId: string,
  mes: string = currentMonthKey(),
): Promise<ProgresoPresupuesto[]> {
  const [presupuestos, gastos] = await Promise.all([
    listPresupuestos(usuarioId),
    gastosDelMes(usuarioId, mes),
  ]);

  const gastoPorCat = new Map(
    agruparPorCategoria(gastos).map((g) => [g.categoriaId, g.total]),
  );

  return presupuestos
    .map((presupuesto) => {
      const gastado = gastoPorCat.get(presupuesto.categoriaId) ?? 0;
      const restante = presupuesto.topeMensual - gastado;
      const porcentaje =
        presupuesto.topeMensual > 0
          ? (gastado / presupuesto.topeMensual) * 100
          : 0;
      return {
        presupuesto,
        gastado,
        restante,
        porcentaje,
        superado: gastado > presupuesto.topeMensual,
      };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

import { db } from '@/db/database';
import type { Cents, Gasto, IsoDate } from '@/models/types';
import { nowIso } from '@/lib/dates';

export interface NuevoGasto {
  usuarioId: string;
  importe: Cents;
  categoriaId: string;
  fecha: IsoDate;
  nota?: string;
}

export async function addGasto(data: NuevoGasto): Promise<string> {
  const id = crypto.randomUUID();
  await db.gastos.add({ ...data, id, creadoEn: nowIso() });
  return id;
}

export async function deleteGasto(id: string): Promise<void> {
  await db.gastos.delete(id);
}

export async function updateGasto(
  id: string,
  cambios: Partial<Omit<Gasto, 'id' | 'usuarioId'>>,
): Promise<void> {
  await db.gastos.update(id, cambios);
}

/** Gastos de un usuario en un mes 'YYYY-MM', ordenados por fecha descendente. */
export async function gastosDelMes(
  usuarioId: string,
  mes: string,
): Promise<Gasto[]> {
  const gastos = await db.gastos
    .where('usuarioId')
    .equals(usuarioId)
    .filter((g) => g.fecha.startsWith(mes))
    .toArray();
  return gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export interface TotalPorCategoria {
  categoriaId: string;
  total: Cents;
}

/** Suma de gastos agrupada por categoría para un conjunto de gastos. */
export function agruparPorCategoria(gastos: Gasto[]): TotalPorCategoria[] {
  const mapa = new Map<string, Cents>();
  for (const g of gastos) {
    mapa.set(g.categoriaId, (mapa.get(g.categoriaId) ?? 0) + g.importe);
  }
  return [...mapa.entries()]
    .map(([categoriaId, total]) => ({ categoriaId, total }))
    .sort((a, b) => b.total - a.total);
}

/** Total absoluto de una lista de gastos. */
export function totalGastos(gastos: Gasto[]): Cents {
  return gastos.reduce((acc, g) => acc + g.importe, 0);
}

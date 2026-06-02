import { db } from '@/db/database';
import type { Cents, GastoRecurrente, IsoDate, Periodicidad } from '@/models/types';
import { nowIso, todayIso } from '@/lib/dates';

/** Meses que avanza cada periodicidad. */
const MESES_POR_PERIODO: Record<Periodicidad, number> = {
  mensual: 1,
  bimestral: 2,
  trimestral: 3,
  anual: 12,
};

export interface NuevoRecurrente {
  usuarioId: string;
  importe: Cents;
  categoriaId: string;
  periodicidad: Periodicidad;
  proximaFecha: IsoDate;
  nota?: string;
}

export async function addRecurrente(data: NuevoRecurrente): Promise<string> {
  const id = crypto.randomUUID();
  await db.gastosRecurrentes.add({
    ...data,
    id,
    activo: true,
    creadoEn: nowIso(),
  });
  return id;
}

export async function updateRecurrente(
  id: string,
  cambios: Partial<Omit<GastoRecurrente, 'id' | 'usuarioId'>>,
): Promise<void> {
  await db.gastosRecurrentes.update(id, cambios);
}

export async function deleteRecurrente(id: string): Promise<void> {
  await db.gastosRecurrentes.delete(id);
}

export async function toggleRecurrente(id: string, activo: boolean): Promise<void> {
  await db.gastosRecurrentes.update(id, { activo });
}

export function listRecurrentes(usuarioId: string): Promise<GastoRecurrente[]> {
  return db.gastosRecurrentes.where('usuarioId').equals(usuarioId).toArray();
}

/** Avanza una fecha ISO 'YYYY-MM-DD' N meses, recortando el día si hace falta. */
export function avanzarMeses(fecha: IsoDate, meses: number): IsoDate {
  const [y, m, d] = fecha.split('-').map(Number);
  const base = new Date(y, m - 1 + meses, 1);
  // Recorta el día al último día válido del mes destino (p. ej. 31 -> 30).
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(d, ultimoDia));
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${base.getFullYear()}-${mm}-${dd}`;
}

/** Recurrentes activos cuya próxima fecha ya venció (<= hoy). */
export function vencidos(
  recurrentes: GastoRecurrente[],
  hoy: IsoDate = todayIso(),
): GastoRecurrente[] {
  return recurrentes
    .filter((r) => r.activo && r.proximaFecha <= hoy)
    .sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha));
}

/** Próximos recurrentes (no vencidos), ordenados por fecha. */
export function proximos(
  recurrentes: GastoRecurrente[],
  hoy: IsoDate = todayIso(),
): GastoRecurrente[] {
  return recurrentes
    .filter((r) => r.activo && r.proximaFecha > hoy)
    .sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha));
}

/**
 * Registra un recurrente vencido como gasto real en su fecha y avanza
 * proximaFecha al siguiente periodo. Devuelve el id del gasto creado.
 */
export async function registrarRecurrente(r: GastoRecurrente): Promise<string> {
  const gastoId = crypto.randomUUID();
  await db.transaction('rw', db.gastos, db.gastosRecurrentes, async () => {
    await db.gastos.add({
      id: gastoId,
      usuarioId: r.usuarioId,
      importe: r.importe,
      categoriaId: r.categoriaId,
      fecha: r.proximaFecha,
      nota: r.nota ? `${r.nota} (recurrente)` : 'Recurrente',
      creadoEn: nowIso(),
    });
    await db.gastosRecurrentes.update(r.id, {
      proximaFecha: avanzarMeses(r.proximaFecha, MESES_POR_PERIODO[r.periodicidad]),
    });
  });
  return gastoId;
}

/** Coste mensual equivalente de un recurrente (para proyección/presupuesto). */
export function costeMensualEquivalente(r: GastoRecurrente): Cents {
  return Math.round(r.importe / MESES_POR_PERIODO[r.periodicidad]);
}

/** Suma mensual proyectada de todos los recurrentes activos. */
export function proyeccionMensual(recurrentes: GastoRecurrente[]): Cents {
  return recurrentes
    .filter((r) => r.activo)
    .reduce((acc, r) => acc + costeMensualEquivalente(r), 0);
}

export const ETIQUETA_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  bimestral: 'Cada 2 meses',
  trimestral: 'Trimestral',
  anual: 'Anual',
};

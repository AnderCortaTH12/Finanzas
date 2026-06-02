import { db } from '@/db/database';
import type { Activo, Cents } from '@/models/types';
import { nowIso } from '@/lib/dates';

export interface NuevoActivo {
  usuarioId: string;
  ticker: string;
  nombre: string;
  cantidad: number;
  precioCompra: Cents; // por unidad
}

export async function addActivo(data: NuevoActivo): Promise<string> {
  const id = crypto.randomUUID();
  await db.activos.add({
    ...data,
    ticker: data.ticker.trim().toUpperCase(),
    id,
    moneda: 'USD',
    creadoEn: nowIso(),
  });
  return id;
}

export async function deleteActivo(id: string): Promise<void> {
  await db.activos.delete(id);
}

export async function updateActivo(
  id: string,
  cambios: Partial<Omit<Activo, 'id' | 'usuarioId'>>,
): Promise<void> {
  await db.activos.update(id, cambios);
}

export function listActivos(usuarioId: string): Promise<Activo[]> {
  return db.activos.where('usuarioId').equals(usuarioId).toArray();
}

// ─────────────────────────────────────────────────────────────
// Cálculos de cartera (todo en céntimos)
// ─────────────────────────────────────────────────────────────

export interface PosicionCalculada {
  activo: Activo;
  coste: Cents; // precioCompra * cantidad
  valorActual: Cents | null; // ultimoPrecio * cantidad (null si sin precio)
  plusvalia: Cents | null; // valorActual - coste
  plusvaliaPct: number | null; // %
}

export function calcularPosicion(activo: Activo): PosicionCalculada {
  const coste = Math.round(activo.precioCompra * activo.cantidad);
  if (activo.ultimoPrecio == null) {
    return { activo, coste, valorActual: null, plusvalia: null, plusvaliaPct: null };
  }
  const valorActual = Math.round(activo.ultimoPrecio * activo.cantidad);
  const plusvalia = valorActual - coste;
  const plusvaliaPct = coste > 0 ? (plusvalia / coste) * 100 : 0;
  return { activo, coste, valorActual, plusvalia, plusvaliaPct };
}

export interface ResumenCartera {
  posiciones: PosicionCalculada[];
  costeTotal: Cents;
  valorTotal: Cents; // usa coste cuando no hay precio aún
  plusvaliaTotal: Cents;
  plusvaliaPct: number | null;
}

export function calcularCartera(activos: Activo[]): ResumenCartera {
  const posiciones = activos
    .map(calcularPosicion)
    .sort((a, b) => (b.valorActual ?? b.coste) - (a.valorActual ?? a.coste));

  let costeTotal = 0;
  let valorTotal = 0;
  for (const p of posiciones) {
    costeTotal += p.coste;
    valorTotal += p.valorActual ?? p.coste;
  }
  const plusvaliaTotal = valorTotal - costeTotal;
  const plusvaliaPct = costeTotal > 0 ? (plusvaliaTotal / costeTotal) * 100 : null;

  return { posiciones, costeTotal, valorTotal, plusvaliaTotal, plusvaliaPct };
}

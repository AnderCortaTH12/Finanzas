import { db } from '@/db/database';
import type { Activo, Cents } from '@/models/types';
import { nowIso } from '@/lib/dates';

export interface NuevoActivo {
  usuarioId: string;
  ticker: string;
  nombre: string;
  cantidad: number;
  precioCompra: Cents; // por unidad
  /** Precio actual ya conocido al crear (modo "por importe"), opcional. */
  ultimoPrecio?: Cents;
}

export async function addActivo(data: NuevoActivo): Promise<string> {
  const id = crypto.randomUUID();
  await db.activos.add({
    ...data,
    ticker: data.ticker.trim().toUpperCase(),
    id,
    moneda: 'USD',
    estado: 'activa',
    fechaUltimoPrecio: data.ultimoPrecio !== undefined ? nowIso() : undefined,
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

/** Marca un activo como vendido, guardando precio y fecha de venta. */
export async function venderActivo(id: string, precioVenta: Cents): Promise<void> {
  await db.activos.update(id, {
    estado: 'vendida',
    precioVenta,
    fechaVenta: nowIso(),
  });
}

/** Revierte una venta: vuelve a poner el activo en la cartera. */
export async function reactivarActivo(id: string): Promise<void> {
  await db.activos.update(id, {
    estado: 'activa',
    precioVenta: undefined,
    fechaVenta: undefined,
  });
}

/** Todos los activos del usuario (activos + vendidos). */
export function listActivos(usuarioId: string): Promise<Activo[]> {
  return db.activos.where('usuarioId').equals(usuarioId).toArray();
}

/** ¿Está el activo en cartera (no vendido)? Trata 'estado' ausente como activa. */
export function esActiva(a: Activo): boolean {
  return a.estado !== 'vendida';
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

/** Cartera = solo activos en posesión (no vendidos). */
export function calcularCartera(activos: Activo[]): ResumenCartera {
  const posiciones = activos
    .filter(esActiva)
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

// ─────────────────────────────────────────────────────────────
// Ventas realizadas (histórico)
// ─────────────────────────────────────────────────────────────

export interface PosicionVendida {
  activo: Activo;
  coste: Cents; // precioCompra * cantidad
  ingreso: Cents; // precioVenta * cantidad
  ganancia: Cents; // ingreso - coste (realizada)
  gananciaPct: number; // %
}

export function calcularVendida(activo: Activo): PosicionVendida {
  const coste = Math.round(activo.precioCompra * activo.cantidad);
  const ingreso = Math.round((activo.precioVenta ?? 0) * activo.cantidad);
  const ganancia = ingreso - coste;
  const gananciaPct = coste > 0 ? (ganancia / coste) * 100 : 0;
  return { activo, coste, ingreso, ganancia, gananciaPct };
}

export interface ResumenRealizado {
  vendidas: PosicionVendida[];
  gananciaTotal: Cents;
  costeTotal: Cents;
  gananciaPct: number | null;
}

/** Resumen de todo lo vendido: ganancia/pérdida realizada acumulada. */
export function calcularRealizado(activos: Activo[]): ResumenRealizado {
  const vendidas = activos
    .filter((a) => a.estado === 'vendida')
    .map(calcularVendida)
    .sort((a, b) =>
      (b.activo.fechaVenta ?? '').localeCompare(a.activo.fechaVenta ?? ''),
    );

  let gananciaTotal = 0;
  let costeTotal = 0;
  for (const v of vendidas) {
    gananciaTotal += v.ganancia;
    costeTotal += v.coste;
  }
  const gananciaPct = costeTotal > 0 ? (gananciaTotal / costeTotal) * 100 : null;

  return { vendidas, gananciaTotal, costeTotal, gananciaPct };
}

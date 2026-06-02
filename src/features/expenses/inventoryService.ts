import { db } from '@/db/database';
import type { Cents, IsoDate, LineaCompra } from '@/models/types';
import { nowIso } from '@/lib/dates';
import { normalizarNombre } from './ticketParser';

/** Una línea tal como llega desde la pantalla de confirmación del ticket. */
export interface LineaTicket {
  nombre: string;
  importe: Cents;
}

export interface GuardarTicketInput {
  usuarioId: string;
  categoriaId: string;
  fecha: IsoDate;
  total: Cents;
  comercio?: string;
  textoCrudo: string;
  lineas: LineaTicket[];
}

/**
 * Guarda un ticket escaneado: crea UN gasto con el total (guardando el texto
 * leído en la nota) y registra cada producto como línea de compra para el
 * inventario. Todo en una transacción para que no quede a medias.
 */
export async function guardarTicket(input: GuardarTicketInput): Promise<string> {
  const gastoId = crypto.randomUUID();
  const creadoEn = nowIso();

  const nota = [input.comercio?.trim(), input.textoCrudo.trim()]
    .filter(Boolean)
    .join('\n');

  const lineasCompra: LineaCompra[] = input.lineas
    .filter((l) => l.nombre.trim() && l.importe > 0)
    .map((l) => ({
      id: crypto.randomUUID(),
      usuarioId: input.usuarioId,
      gastoId,
      nombre: l.nombre.trim(),
      nombreNorm: normalizarNombre(l.nombre),
      importe: l.importe,
      fecha: input.fecha,
      creadoEn,
    }));

  await db.transaction('rw', db.gastos, db.lineasCompra, async () => {
    await db.gastos.add({
      id: gastoId,
      usuarioId: input.usuarioId,
      importe: input.total,
      categoriaId: input.categoriaId,
      fecha: input.fecha,
      nota: nota || undefined,
      creadoEn,
    });
    if (lineasCompra.length > 0) {
      await db.lineasCompra.bulkAdd(lineasCompra);
    }
  });

  return gastoId;
}

/** Borra un gasto y, de paso, sus líneas de compra asociadas. */
export async function borrarTicket(gastoId: string): Promise<void> {
  await db.transaction('rw', db.gastos, db.lineasCompra, async () => {
    await db.gastos.delete(gastoId);
    await db.lineasCompra.where('gastoId').equals(gastoId).delete();
  });
}

/** Resumen de un producto agregado en el inventario. */
export interface ResumenProducto {
  nombreNorm: string;
  nombre: string;   // el nombre más reciente con el que se registró
  veces: number;    // cuántas veces se ha comprado
  total: Cents;     // gasto acumulado en ese producto
  ultimaFecha: IsoDate;
}

/**
 * Inventario agregado por producto entre dos fechas (inclusive), ordenado por
 * número de compras descendente. `desde`/`hasta` en formato 'YYYY-MM-DD'.
 */
export async function inventarioEntre(
  usuarioId: string,
  desde: IsoDate,
  hasta: IsoDate,
): Promise<ResumenProducto[]> {
  const lineas = await db.lineasCompra
    .where('usuarioId')
    .equals(usuarioId)
    .filter((l) => l.fecha >= desde && l.fecha <= hasta)
    .toArray();

  const mapa = new Map<string, ResumenProducto>();
  for (const l of lineas) {
    const prev = mapa.get(l.nombreNorm);
    if (!prev) {
      mapa.set(l.nombreNorm, {
        nombreNorm: l.nombreNorm,
        nombre: l.nombre,
        veces: 1,
        total: l.importe,
        ultimaFecha: l.fecha,
      });
    } else {
      prev.veces += 1;
      prev.total += l.importe;
      if (l.fecha > prev.ultimaFecha) {
        prev.ultimaFecha = l.fecha;
        prev.nombre = l.nombre;
      }
    }
  }

  return [...mapa.values()].sort(
    (a, b) => b.veces - a.veces || b.total - a.total,
  );
}

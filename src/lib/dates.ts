import type { IsoDate, IsoDateTime } from '@/models/types';

/** Marca de tiempo actual en ISO completo. */
export function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

/** Fecha de hoy en formato 'YYYY-MM-DD' (zona horaria local). */
export function todayIso(): IsoDate {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

/** Clave de mes 'YYYY-MM' a partir de una fecha ISO. */
export function monthKey(date: IsoDate): string {
  return date.slice(0, 7);
}

/** Clave del mes actual 'YYYY-MM'. */
export function currentMonthKey(): string {
  return todayIso().slice(0, 7);
}

/** Clave del mes anterior 'YYYY-MM'. */
export function previousMonthKey(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** Nombre legible del mes, p.ej. 'junio 2026'. */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

/** Formatea una fecha ISO como '2 jun 2026'. */
export function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

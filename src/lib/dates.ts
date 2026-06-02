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

/** Suma (o resta) días a una fecha ISO 'YYYY-MM-DD' y devuelve ISO. */
export function addDays(date: IsoDate, dias: number): IsoDate {
  const [y, m, d] = date.split('-').map(Number);
  const fecha = new Date(y, m - 1, d + dias);
  const offset = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
}

/** Lunes de la semana actual en formato 'YYYY-MM-DD'. */
export function weekStartIso(): IsoDate {
  const hoy = todayIso();
  const [y, m, d] = hoy.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=domingo..6=sábado
  const haciaLunes = dow === 0 ? 6 : dow - 1;
  return addDays(hoy, -haciaLunes);
}

/** Primer día del mes actual 'YYYY-MM-01'. */
export function monthStartIso(): IsoDate {
  return `${currentMonthKey()}-01`;
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

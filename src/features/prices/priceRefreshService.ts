import { db } from '@/db/database';
import type { Activo, PriceProvider, Precio } from '@/models/types';
import { FinnhubProvider } from './FinnhubProvider';
import { nowIso } from '@/lib/dates';

/** Horas que un precio cacheado se considera "fresco". */
export const HORAS_FRESCURA = 6;
const MS_FRESCURA = HORAS_FRESCURA * 60 * 60 * 1000;

/** Proveedor activo. Encapsulado para poder cambiarlo en un único sitio. */
let provider: PriceProvider = new FinnhubProvider();

/** Permite inyectar otro proveedor (tests o sustituir Finnhub). */
export function setPriceProvider(p: PriceProvider): void {
  provider = p;
}

/** ¿Hay clave de Finnhub configurada? Sin clave no se puede validar ni cotizar. */
export function hayProveedorConfigurado(): boolean {
  return Boolean(import.meta.env.VITE_FINNHUB_API_KEY);
}

/**
 * Obtiene el precio de un ticker SIN crear ningún activo. Sirve para validar
 * que el ticker existe antes de guardarlo. Lanza si no existe o falla la red.
 */
export function obtenerPrecioTicker(ticker: string): Promise<Precio> {
  return provider.getPrecio(ticker);
}

/** ¿El precio del activo es viejo (>= 6h) o no existe? */
export function precioCaducado(activo: Activo, ahora = Date.now()): boolean {
  if (!activo.fechaUltimoPrecio) return true;
  const edad = ahora - new Date(activo.fechaUltimoPrecio).getTime();
  return edad >= MS_FRESCURA;
}

/** Refresca un único activo desde el proveedor y persiste el precio. */
export async function refrescarActivo(activo: Activo): Promise<void> {
  const precio = await provider.getPrecio(activo.ticker);
  await db.activos.update(activo.id, {
    ultimoPrecio: precio.precio,
    fechaUltimoPrecio: precio.obtenidoEn,
    moneda: precio.moneda,
  });
}

export interface ResultadoRefresco {
  actualizados: number;
  fallidos: { ticker: string; error: string }[];
}

/**
 * Refresca solo los activos con precio caducado (>= 6h) de un usuario.
 * Se llama al abrir la app. Como mucho ~2 refrescos al día por activo.
 */
export async function refrescarCaducados(
  usuarioId: string,
): Promise<ResultadoRefresco> {
  const activos = await db.activos.where('usuarioId').equals(usuarioId).toArray();
  const caducados = activos.filter((a) => precioCaducado(a));
  return refrescarLista(caducados);
}

/** Refresca TODOS los activos del usuario, ignorando la caché (botón manual). */
export async function refrescarTodos(
  usuarioId: string,
): Promise<ResultadoRefresco> {
  const activos = await db.activos.where('usuarioId').equals(usuarioId).toArray();
  return refrescarLista(activos);
}

async function refrescarLista(activos: Activo[]): Promise<ResultadoRefresco> {
  const resultado: ResultadoRefresco = { actualizados: 0, fallidos: [] };
  for (const activo of activos) {
    try {
      await refrescarActivo(activo);
      resultado.actualizados++;
    } catch (e) {
      resultado.fallidos.push({
        ticker: activo.ticker,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return resultado;
}

/** Marca útil para la UI: cuándo fue el refresco más reciente del usuario. */
export async function ultimoRefresco(usuarioId: string): Promise<string | null> {
  const activos = await db.activos.where('usuarioId').equals(usuarioId).toArray();
  const fechas = activos
    .map((a) => a.fechaUltimoPrecio)
    .filter((f): f is string => Boolean(f))
    .sort();
  return fechas.length ? fechas[fechas.length - 1] : null;
}

export { nowIso };

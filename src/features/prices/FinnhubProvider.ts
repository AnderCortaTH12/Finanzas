import type { PriceProvider, Precio } from '@/models/types';
import { eurosToCents } from '@/lib/money';
import { nowIso } from '@/lib/dates';

const BASE_URL = 'https://finnhub.io/api/v1';

/** Respuesta del endpoint /quote de Finnhub (campos que usamos). */
interface FinnhubQuote {
  c: number; // precio actual
  d: number | null; // cambio
  pc: number; // cierre anterior
}

/**
 * Implementación de PriceProvider usando Finnhub (free tier).
 * La clave se lee de la variable de entorno VITE_FINNHUB_API_KEY.
 *
 * Nota: el free tier de Finnhub cubre acciones de EE.UU. y devuelve el precio
 * en USD. Aquí lo guardamos tal cual (en céntimos de la moneda nativa); la
 * conversión de divisa queda fuera del alcance actual.
 */
export class FinnhubProvider implements PriceProvider {
  constructor(private readonly apiKey = import.meta.env.VITE_FINNHUB_API_KEY) {}

  private ensureKey(): void {
    if (!this.apiKey) {
      throw new Error(
        'Falta la clave de Finnhub. Añádela en .env (VITE_FINNHUB_API_KEY).',
      );
    }
  }

  async getPrecio(ticker: string): Promise<Precio> {
    this.ensureKey();
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(ticker)}&token=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Finnhub respondió ${res.status} para ${ticker}`);
    }
    const data = (await res.json()) as FinnhubQuote;
    if (!data || typeof data.c !== 'number' || data.c === 0) {
      throw new Error(`Sin precio para "${ticker}" (¿ticker correcto?)`);
    }
    return {
      ticker,
      precio: eurosToCents(data.c), // reutilizamos: convierte unidad->céntimos
      moneda: 'USD',
      obtenidoEn: nowIso(),
    };
  }

  /** Obtiene varios precios en paralelo. Los fallos individuales se propagan. */
  async getPrecios(tickers: string[]): Promise<Precio[]> {
    return Promise.all(tickers.map((t) => this.getPrecio(t)));
  }
}

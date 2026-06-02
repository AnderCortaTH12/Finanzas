import type { Cents } from '@/models/types';

/** Convierte un importe en euros (número decimal) a céntimos enteros. */
export function eurosToCents(euros: number): Cents {
  return Math.round(euros * 100);
}

/** Convierte céntimos a euros (decimal). */
export function centsToEuros(cents: Cents): number {
  return cents / 100;
}

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/** Formatea céntimos como '12,50 €'. */
export function formatEur(cents: Cents): string {
  return formatter.format(centsToEuros(cents));
}

/**
 * Parsea una entrada de texto del usuario ('12,50' o '12.50') a céntimos.
 * Devuelve null si no es un número válido.
 */
export function parseEurInput(input: string): Cents | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (Number.isNaN(value) || value < 0) return null;
  return eurosToCents(value);
}

import type { Cents, IsoDate } from '@/models/types';

/** Una línea de producto detectada en el ticket. */
export interface LineaDetectada {
  nombre: string;
  importe: Cents;
}

/** Resultado de interpretar el texto crudo de un ticket. */
export interface TicketParseado {
  comercio: string;
  fecha: IsoDate | null;
  total: Cents | null;
  lineas: LineaDetectada[];
  textoCrudo: string;
}

/** Palabras que NO son productos (no deben entrar como líneas de compra). */
const PALABRAS_IGNORAR = [
  'total',
  'subtotal',
  'iva',
  'i.v.a',
  'base',
  'cambio',
  'efectivo',
  'tarjeta',
  'contado',
  'entrega',
  'devolucion',
  'cuota',
  'redondeo',
  'descuento',
  'tel',
  'telefono',
  'cif',
  'nif',
  'factura',
  'ticket',
  'gracias',
  'fecha',
  'hora',
  'caja',
  'art',
  'unidades',
];

/** Convierte un texto de precio ('3,45', '3.45', '12,00 €') a céntimos. */
function precioACents(texto: string): Cents | null {
  const limpio = texto.replace(/[^\d.,]/g, '').replace(',', '.');
  if (!limpio) return null;
  const valor = Number(limpio);
  if (Number.isNaN(valor)) return null;
  return Math.round(valor * 100);
}

/** Normaliza un nombre de producto para poder agruparlo en el inventario. */
export function normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD') // 'café' -> 'cafe' + acento suelto
    .replace(/[^a-z0-9\s]/g, ' ') // fuera símbolos y acentos sueltos
    .replace(/\s+/g, ' ')
    .trim();
}

// Precio al final de la línea: '3,45', '12.00', con € opcional.
const RE_PRECIO_FINAL = /(-?\d{1,4}[.,]\d{2})\s*€?\s*$/;
// Fecha: dd/mm/aaaa, dd-mm-aa, dd.mm.aaaa
const RE_FECHA = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;

function fechaAIso(d: string, m: string, a: string): IsoDate {
  const dia = d.padStart(2, '0');
  const mes = m.padStart(2, '0');
  const anio = a.length === 2 ? `20${a}` : a;
  return `${anio}-${mes}-${dia}`;
}

/**
 * Interpreta el texto leído de un ticket y extrae comercio, fecha, total
 * y las líneas de producto. Es heurístico: el usuario corrige luego en pantalla.
 */
export function parsearTicket(texto: string): TicketParseado {
  const lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Comercio: primera línea "con letras" razonable.
  const comercio =
    lineas.find((l) => /[a-zA-Z]{3,}/.test(l) && !RE_FECHA.test(l)) ?? '';

  // Fecha: primera que encaje.
  let fecha: IsoDate | null = null;
  for (const l of lineas) {
    const m = l.match(RE_FECHA);
    if (m) {
      fecha = fechaAIso(m[1], m[2], m[3]);
      break;
    }
  }

  // Total: línea que contenga "total" (pero no "subtotal") con un número.
  let total: Cents | null = null;
  for (const l of lineas) {
    const bajo = l.toLowerCase();
    if (bajo.includes('total') && !bajo.includes('subtotal')) {
      const m = l.match(RE_PRECIO_FINAL);
      if (m) total = precioACents(m[1]);
    }
  }

  // Líneas de producto: texto + precio al final, que no sean palabras ignoradas.
  const productos: LineaDetectada[] = [];
  for (const l of lineas) {
    const m = l.match(RE_PRECIO_FINAL);
    if (!m) continue;
    const importe = precioACents(m[1]);
    if (importe === null || importe <= 0) continue;

    const nombre = l.slice(0, m.index).trim().replace(/[.\-·*x]+$/, '').trim();
    if (nombre.length < 2) continue;

    const bajo = normalizarNombre(nombre);
    if (PALABRAS_IGNORAR.some((p) => bajo.startsWith(p) || bajo === p)) continue;

    productos.push({ nombre, importe });
  }

  return { comercio, fecha, total, lineas: productos, textoCrudo: texto };
}

// ─────────────────────────────────────────────────────────────
// Modelos de datos de la aplicación
// ─────────────────────────────────────────────────────────────

/** Importes SIEMPRE en céntimos (enteros) para evitar errores de coma flotante.
 *  Se convierte a € solo al mostrar/editar en la UI. */
export type Cents = number;

/** Fecha en formato ISO 'YYYY-MM-DD' (sin hora), para gastos. */
export type IsoDate = string;

/** Marca de tiempo ISO completa (precios, creación, etc.). */
export type IsoDateTime = string;

export type Periodicidad = 'mensual' | 'bimestral' | 'trimestral' | 'anual';

// ─────────────────────────────────────────────────────────────
// FASE 3 — Usuario / Perfil familiar
// ─────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;                 // crypto.randomUUID()
  nombre: string;
  /** Hash del PIN de 4 dígitos (nunca el PIN en claro). Opcional hasta Fase 3. */
  pinHash?: string;
  pinSalt?: string;
  color?: string;             // color identificativo del perfil
  creadoEn: IsoDateTime;
}

// ─────────────────────────────────────────────────────────────
// FASE 1 — Categorías y Gastos
// ─────────────────────────────────────────────────────────────

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;              // nombre de icono lucide (p.ej. 'utensils')
  color: string;              // hex, p.ej. '#22c55e'
  esPredefinida?: boolean;    // categorías semilla no borrables
}

export interface Gasto {
  id: string;
  usuarioId: string;
  importe: Cents;
  categoriaId: string;        // FK -> Categoria
  fecha: IsoDate;
  nota?: string;
  creadoEn: IsoDateTime;
}

// ─────────────────────────────────────────────────────────────
// FASE 2 — Activos
// ─────────────────────────────────────────────────────────────

export interface Activo {
  id: string;
  usuarioId: string;
  ticker: string;            // p.ej. 'AAPL'
  nombre: string;
  cantidad: number;          // admite fracciones
  precioCompra: Cents;       // por unidad
  ultimoPrecio?: Cents;      // por unidad, cacheado
  fechaUltimoPrecio?: IsoDateTime; // para la regla de las 6h
  moneda?: string;           // ISO 4217, por defecto 'EUR'
  creadoEn: IsoDateTime;
}

// ─────────────────────────────────────────────────────────────
// FASE 4 — Gastos recurrentes y Presupuestos
// ─────────────────────────────────────────────────────────────

export interface GastoRecurrente {
  id: string;
  usuarioId: string;
  importe: Cents;
  categoriaId: string;
  periodicidad: Periodicidad;
  proximaFecha: IsoDate;
  nota?: string;
  activo: boolean;           // permite pausar sin borrar
  creadoEn: IsoDateTime;
}

export interface Presupuesto {
  id: string;
  usuarioId: string;
  categoriaId: string;
  topeMensual: Cents;
}

// ─────────────────────────────────────────────────────────────
// FASE 2 — Capa de precios (interfaz del proveedor)
// ─────────────────────────────────────────────────────────────

export interface Precio {
  ticker: string;
  precio: Cents;
  moneda: string;
  obtenidoEn: IsoDateTime;
}

/** Interfaz abstracta para desacoplar el proveedor de precios (Finnhub, etc.). */
export interface PriceProvider {
  getPrecio(ticker: string): Promise<Precio>;
  getPrecios(tickers: string[]): Promise<Precio[]>;
}

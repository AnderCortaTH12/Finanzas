import Dexie, { type Table } from 'dexie';
import type {
  Usuario,
  Categoria,
  Gasto,
  Activo,
  GastoRecurrente,
  Presupuesto,
} from '@/models/types';

/**
 * Base de datos local (IndexedDB) vía Dexie.
 * Todos los datos viven en el dispositivo; no hay backend ni sincronización.
 */
export class FinanzasDB extends Dexie {
  usuarios!: Table<Usuario, string>;
  categorias!: Table<Categoria, string>;
  gastos!: Table<Gasto, string>;
  activos!: Table<Activo, string>;
  gastosRecurrentes!: Table<GastoRecurrente, string>;
  presupuestos!: Table<Presupuesto, string>;

  constructor() {
    super('finanzas-familiares');

    // El segundo argumento de cada tabla lista los índices.
    // 'id' es la clave primaria; el resto son campos por los que filtramos.
    this.version(1).stores({
      usuarios: 'id, nombre',
      categorias: 'id, nombre',
      gastos: 'id, usuarioId, categoriaId, fecha',
      activos: 'id, usuarioId, ticker',
      gastosRecurrentes: 'id, usuarioId, proximaFecha',
      presupuestos: 'id, usuarioId, categoriaId',
    });
  }
}

export const db = new FinanzasDB();

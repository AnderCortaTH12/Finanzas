import { db } from '@/db/database';
import type {
  Usuario,
  Categoria,
  Gasto,
  Activo,
  GastoRecurrente,
  Presupuesto,
  LineaCompra,
} from '@/models/types';
import { nowIso } from '@/lib/dates';

/** Estructura del archivo de copia de seguridad (.json). */
export interface CopiaSeguridad {
  app: 'finanzas-familiares';
  version: 1 | 2;
  exportadoEn: string;
  datos: {
    usuarios: Usuario[];
    categorias: Categoria[];
    gastos: Gasto[];
    activos: Activo[];
    gastosRecurrentes: GastoRecurrente[];
    presupuestos: Presupuesto[];
    /** v2: líneas de compra (inventario). Las copias v1 no la traen. */
    lineasCompra?: LineaCompra[];
  };
}

/** Modo de importación: reemplazar todo o fusionar con lo existente. */
export type ModoImport = 'reemplazar' | 'fusionar';

/** Lee TODOS los datos (todos los perfiles) y devuelve la copia. */
export async function exportarDatos(): Promise<CopiaSeguridad> {
  const [usuarios, categorias, gastos, activos, gastosRecurrentes, presupuestos, lineasCompra] =
    await Promise.all([
      db.usuarios.toArray(),
      db.categorias.toArray(),
      db.gastos.toArray(),
      db.activos.toArray(),
      db.gastosRecurrentes.toArray(),
      db.presupuestos.toArray(),
      db.lineasCompra.toArray(),
    ]);

  return {
    app: 'finanzas-familiares',
    version: 2,
    exportadoEn: nowIso(),
    datos: {
      usuarios,
      categorias,
      gastos,
      activos,
      gastosRecurrentes,
      presupuestos,
      lineasCompra,
    },
  };
}

/** Descarga la copia como archivo .json (lo guardas en Archivos, correo, etc.). */
export async function descargarCopia(): Promise<void> {
  const copia = await exportarDatos();
  const blob = new Blob([JSON.stringify(copia, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const fecha = copia.exportadoEn.slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finanzas-copia-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Valida que un objeto parseado tiene forma de copia de esta app. */
export function esCopiaValida(obj: unknown): obj is CopiaSeguridad {
  const c = obj as CopiaSeguridad;
  return (
    !!c &&
    c.app === 'finanzas-familiares' &&
    typeof c.datos === 'object' &&
    Array.isArray(c.datos?.usuarios) &&
    Array.isArray(c.datos?.gastos)
  );
}

export interface ResumenImport {
  usuarios: number;
  categorias: number;
  gastos: number;
  activos: number;
  gastosRecurrentes: number;
  presupuestos: number;
  lineasCompra: number;
}

/**
 * Importa una copia.
 *  - 'reemplazar': borra todo y deja exactamente lo del archivo.
 *  - 'fusionar': añade/actualiza por id, conservando lo que ya había.
 */
export async function importarDatos(
  copia: CopiaSeguridad,
  modo: ModoImport,
): Promise<ResumenImport> {
  const { datos } = copia;
  const lineasCompra = datos.lineasCompra ?? [];
  const tablas = [
    db.usuarios,
    db.categorias,
    db.gastos,
    db.activos,
    db.gastosRecurrentes,
    db.presupuestos,
    db.lineasCompra,
  ];

  await db.transaction('rw', tablas, async () => {
    if (modo === 'reemplazar') {
      await Promise.all(tablas.map((t) => t.clear()));
    }
    // bulkPut = inserta o actualiza por id (sirve para reemplazar y fusionar).
    await db.usuarios.bulkPut(datos.usuarios);
    await db.categorias.bulkPut(datos.categorias);
    await db.gastos.bulkPut(datos.gastos);
    await db.activos.bulkPut(datos.activos);
    await db.gastosRecurrentes.bulkPut(datos.gastosRecurrentes);
    await db.presupuestos.bulkPut(datos.presupuestos);
    await db.lineasCompra.bulkPut(lineasCompra);
  });

  return {
    usuarios: datos.usuarios.length,
    categorias: datos.categorias.length,
    gastos: datos.gastos.length,
    activos: datos.activos.length,
    gastosRecurrentes: datos.gastosRecurrentes.length,
    presupuestos: datos.presupuestos.length,
    lineasCompra: lineasCompra.length,
  };
}

/** Lee un archivo seleccionado y lo valida como copia. Lanza si no es válida. */
export async function leerArchivoCopia(file: File): Promise<CopiaSeguridad> {
  const texto = await file.text();
  let obj: unknown;
  try {
    obj = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!esCopiaValida(obj)) {
    throw new Error('Este archivo no es una copia de Finanzas Familiares.');
  }
  return obj;
}

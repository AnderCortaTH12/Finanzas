import { db } from './database';
import type { Categoria, Usuario } from '@/models/types';
import { nowIso } from '@/lib/dates';

/** Categorías por defecto (icono lucide + color de acento suave). */
const CATEGORIAS_SEMILLA: Omit<Categoria, 'id'>[] = [
  { nombre: 'Comida', icono: 'utensils', color: '#f97316', esPredefinida: true },
  { nombre: 'Transporte', icono: 'car', color: '#3b82f6', esPredefinida: true },
  { nombre: 'Hogar', icono: 'house', color: '#10b981', esPredefinida: true },
  { nombre: 'Ocio', icono: 'gamepad-2', color: '#a855f7', esPredefinida: true },
  { nombre: 'Salud', icono: 'heart-pulse', color: '#ef4444', esPredefinida: true },
  { nombre: 'Compras', icono: 'shopping-bag', color: '#ec4899', esPredefinida: true },
  { nombre: 'Facturas', icono: 'receipt', color: '#64748b', esPredefinida: true },
  { nombre: 'Otros', icono: 'circle-dollar-sign', color: '#14b8a6', esPredefinida: true },
];

/**
 * Inicializa la base de datos la primera vez:
 *  - Crea las categorías por defecto.
 *  - Crea un usuario "Familia" para empezar a usar la app sin configurar perfiles
 *    (los perfiles llegan en la Fase 3).
 */
export async function seedIfEmpty(): Promise<void> {
  const numCategorias = await db.categorias.count();
  if (numCategorias === 0) {
    await db.categorias.bulkAdd(
      CATEGORIAS_SEMILLA.map((c) => ({ ...c, id: crypto.randomUUID() })),
    );
  }

  const numUsuarios = await db.usuarios.count();
  if (numUsuarios === 0) {
    const usuario: Usuario = {
      id: crypto.randomUUID(),
      nombre: 'Familia',
      creadoEn: nowIso(),
    };
    await db.usuarios.add(usuario);
  }
}

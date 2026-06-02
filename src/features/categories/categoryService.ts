import { db } from '@/db/database';
import type { Categoria } from '@/models/types';

/** Devuelve todas las categorías ordenadas por nombre. */
export function listCategorias(): Promise<Categoria[]> {
  return db.categorias.orderBy('nombre').toArray();
}

/** Mapa id -> categoría, útil para resolver FKs en listas y gráficos. */
export async function categoriasById(): Promise<Map<string, Categoria>> {
  const todas = await listCategorias();
  return new Map(todas.map((c) => [c.id, c]));
}

export async function addCategoria(
  data: Omit<Categoria, 'id'>,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.categorias.add({ ...data, id });
  return id;
}

export async function updateCategoria(
  id: string,
  cambios: Partial<Omit<Categoria, 'id'>>,
): Promise<void> {
  await db.categorias.update(id, cambios);
}

export async function deleteCategoria(id: string): Promise<void> {
  await db.categorias.delete(id);
}

import { db } from '@/db/database';
import type { Usuario } from '@/models/types';
import { nowIso } from '@/lib/dates';
import { generarSalt, hashPin } from './pin';

/** Colores sugeridos para distinguir perfiles de un vistazo. */
export const COLORES_PERFIL = [
  '#10b981',
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
];

export function listUsuarios(): Promise<Usuario[]> {
  return db.usuarios.orderBy('nombre').toArray();
}

export function getUsuario(id: string): Promise<Usuario | undefined> {
  return db.usuarios.get(id);
}

/** Crea un perfil. Si se pasa pin, se guarda hasheado con salt. */
export async function addUsuario(
  nombre: string,
  color: string,
  pin?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const usuario: Usuario = {
    id,
    nombre: nombre.trim(),
    color,
    creadoEn: nowIso(),
  };
  if (pin) {
    const salt = generarSalt();
    usuario.pinSalt = salt;
    usuario.pinHash = await hashPin(pin, salt);
  }
  await db.usuarios.add(usuario);
  return id;
}

/** Establece, cambia o elimina (pin vacío) el PIN de un perfil. */
export async function setPin(id: string, pin: string | null): Promise<void> {
  if (!pin) {
    await db.usuarios.update(id, { pinHash: undefined, pinSalt: undefined });
    return;
  }
  const salt = generarSalt();
  const pinHash = await hashPin(pin, salt);
  await db.usuarios.update(id, { pinHash, pinSalt: salt });
}

export async function updateUsuario(
  id: string,
  cambios: Partial<Pick<Usuario, 'nombre' | 'color'>>,
): Promise<void> {
  await db.usuarios.update(id, cambios);
}

/**
 * Borra un perfil y TODOS sus datos asociados (gastos, activos, etc.).
 * Operación destructiva e irreversible.
 */
export async function deleteUsuario(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.usuarios, db.gastos, db.activos, db.gastosRecurrentes, db.presupuestos],
    async () => {
      await db.gastos.where('usuarioId').equals(id).delete();
      await db.activos.where('usuarioId').equals(id).delete();
      await db.gastosRecurrentes.where('usuarioId').equals(id).delete();
      await db.presupuestos.where('usuarioId').equals(id).delete();
      await db.usuarios.delete(id);
    },
  );
}

/** ¿El perfil tiene PIN configurado? */
export function tienePin(usuario: Usuario): boolean {
  return Boolean(usuario.pinHash && usuario.pinSalt);
}

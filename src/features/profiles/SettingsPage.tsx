import { useState } from 'react';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/app/providers';
import { deleteUsuario } from './profileService';
import { NewProfileForm } from './components/NewProfileForm';
import { ThemeCard } from '@/features/theme/ThemeCard';

/** Ajustes: perfil activo, cambio de perfil y gestión de perfiles. */
export function SettingsPage() {
  const { usuario, usuarios, bloquear } = useApp();
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [aBorrar, setABorrar] = useState<string | null>(null);

  async function confirmarBorrado(id: string) {
    await deleteUsuario(id);
    setABorrar(null);
    // Si borras el perfil activo, vuelve a la selección.
    if (id === usuario?.id) bloquear();
  }

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes</h1>

      {/* Perfil activo */}
      {usuario && (
        <Card className="p-5 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full
                       text-xl font-bold text-white"
            style={{ backgroundColor: usuario.color ?? '#10b981' }}
          >
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {usuario.nombre}
            </p>
            <p className="text-sm text-slate-400">Perfil activo</p>
          </div>
          <Button variant="ghost" onClick={bloquear}>
            <LogOut size={18} />
            Cambiar
          </Button>
        </Card>
      )}

      {/* Tema (modo oscuro) — se monta en la Fase 5 */}
      <ThemeCard />

      {/* Gestión de perfiles */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-2">Perfiles</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full
                           text-sm font-bold text-white"
                style={{ backgroundColor: u.color ?? '#10b981' }}
              >
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-slate-900 dark:text-white">{u.nombre}</span>
              {aBorrar === u.id ? (
                <span className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => confirmarBorrado(u.id)}
                    className="text-red-500 font-medium"
                  >
                    Borrar todo
                  </button>
                  <button onClick={() => setABorrar(null)} className="text-slate-400">
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setABorrar(u.id)}
                  className="p-2 text-slate-300 hover:text-red-500"
                  aria-label="Borrar perfil"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          onClick={() => setNuevoOpen(true)}
          className="mt-2 w-full justify-center"
        >
          <Plus size={18} />
          Añadir perfil
        </Button>
      </Card>

      <p className="px-4 text-center text-xs text-slate-400">
        Borrar un perfil elimina también todos sus gastos, activos, recibos y
        presupuestos. Esta acción no se puede deshacer.
      </p>

      <NewProfileForm open={nuevoOpen} onClose={() => setNuevoOpen(false)} />
    </div>
  );
}

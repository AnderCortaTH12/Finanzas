import { useState } from 'react';
import { Plus, UserRound } from 'lucide-react';
import { useApp } from '@/app/providers';
import type { Usuario } from '@/models/types';
import { tienePin } from './profileService';
import { verificarPin } from './pin';
import { PinPad } from './components/PinPad';
import { NewProfileForm } from './components/NewProfileForm';

/**
 * Puerta de entrada (Fase 3): si no hay perfil activo, muestra la selección de
 * perfil y, si el perfil tiene PIN, pide el PIN antes de entrar.
 */
export function ProfileGate() {
  const { usuarios, desbloquear } = useApp();
  const [pendiente, setPendiente] = useState<Usuario | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  function seleccionar(u: Usuario) {
    if (tienePin(u)) {
      setPendiente(u); // pedir PIN
    } else {
      desbloquear(u);
    }
  }

  async function comprobarPin(pin: string): Promise<boolean> {
    if (!pendiente?.pinSalt || !pendiente.pinHash) return false;
    const ok = await verificarPin(pin, pendiente.pinSalt, pendiente.pinHash);
    if (ok) desbloquear(pendiente);
    return ok;
  }

  // Pantalla de PIN
  if (pendiente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center
                      bg-slate-50 dark:bg-slate-950 px-6">
        <PinPad
          titulo={`PIN de ${pendiente.nombre}`}
          onComplete={comprobarPin}
          onCancel={() => setPendiente(null)}
        />
      </div>
    );
  }

  // Pantalla de selección de perfil
  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-slate-50 dark:bg-slate-950 px-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        ¿Quién eres?
      </h1>
      <p className="mb-10 text-sm text-slate-400">Elige tu perfil</p>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {usuarios.map((u) => (
          <button
            key={u.id}
            onClick={() => seleccionar(u)}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl
                         font-bold text-white shadow-md active:scale-95 transition"
              style={{ backgroundColor: u.color ?? '#10b981' }}
            >
              {u.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-200">
              {u.nombre}
              {tienePin(u) && <UserRound size={12} className="text-slate-400" />}
            </span>
          </button>
        ))}

        {/* Añadir perfil */}
        <button
          onClick={() => setNuevoOpen(true)}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full
                          border-2 border-dashed border-slate-300 dark:border-slate-600
                          text-slate-400 active:scale-95 transition">
            <Plus size={28} />
          </div>
          <span className="text-sm text-slate-400">Añadir</span>
        </button>
      </div>

      <NewProfileForm open={nuevoOpen} onClose={() => setNuevoOpen(false)} />
    </div>
  );
}

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { addUsuario, COLORES_PERFIL } from '../profileService';
import { esPinValido } from '../pin';

interface NewProfileFormProps {
  open: boolean;
  onClose: () => void;
}

/** Crea un nuevo perfil familiar con nombre, color y PIN opcional. */
export function NewProfileForm({ open, onClose }: NewProfileFormProps) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES_PERFIL[0]);
  const [usarPin, setUsarPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setNombre('');
    setColor(COLORES_PERFIL[0]);
    setUsarPin(false);
    setPin('');
    setError(null);
  }

  async function handleGuardar() {
    if (!nombre.trim()) return setError('Pon un nombre');
    if (usarPin && !esPinValido(pin)) return setError('El PIN debe tener 4 dígitos');
    await addUsuario(nombre, color, usarPin ? pin : undefined);
    reset();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nuevo perfil"
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs text-slate-500">Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Ander"
            autoFocus
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700
                       bg-transparent px-3 py-2.5 text-slate-900 dark:text-white outline-none
                       focus:ring-2 focus:ring-accent"
          />
        </label>

        {/* Color del perfil */}
        <div>
          <span className="text-xs text-slate-500">Color</span>
          <div className="mt-2 flex gap-3">
            {COLORES_PERFIL.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition ${
                  color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* PIN opcional */}
        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Proteger con PIN
          </span>
          <input
            type="checkbox"
            checked={usarPin}
            onChange={(e) => setUsarPin(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>
        {usarPin && (
          <input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 dígitos"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700
                       bg-transparent px-3 py-2.5 text-center text-2xl tracking-[0.5em]
                       text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
          />
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button onClick={handleGuardar} className="w-full">
          Crear perfil
        </Button>
      </div>
    </Sheet>
  );
}

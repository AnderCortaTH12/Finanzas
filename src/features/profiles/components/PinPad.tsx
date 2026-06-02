import { useEffect, useState, type ReactNode } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  titulo: string;
  /** Se llama con los 4 dígitos cuando se completan. Devuelve true si es correcto. */
  onComplete: (pin: string) => Promise<boolean> | boolean;
  onCancel?: () => void;
}

/** Teclado numérico para introducir un PIN de 4 dígitos (estilo iOS). */
export function PinPad({ titulo, onComplete, onCancel }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    (async () => {
      const ok = await onComplete(pin);
      if (!ok) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    })();
  }, [pin, onComplete]);

  function pulsa(d: string) {
    setPin((p) => (p.length < 4 ? p + d : p));
  }
  function borra() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{titulo}</p>

      {/* Puntos indicadores */}
      <div className={`flex gap-4 ${error ? 'animate-[shake_0.4s]' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-colors ${
              error
                ? 'border-red-500 bg-red-500'
                : i < pin.length
                  ? 'border-accent bg-accent'
                  : 'border-slate-300 dark:border-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <PinKey key={d} onClick={() => pulsa(d)}>
            {d}
          </PinKey>
        ))}
        <button
          onClick={onCancel}
          className="text-sm text-slate-400 disabled:opacity-0"
          disabled={!onCancel}
        >
          Cancelar
        </button>
        <PinKey onClick={() => pulsa('0')}>0</PinKey>
        <button
          onClick={borra}
          className="flex items-center justify-center text-slate-500"
          aria-label="Borrar"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
}

function PinKey({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full
                 bg-slate-100 dark:bg-slate-800 text-2xl font-light
                 text-slate-900 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition"
    >
      {children}
    </button>
  );
}

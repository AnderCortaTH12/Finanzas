import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Panel deslizante desde abajo (estilo iOS) con fondo oscurecido. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Fondo oscuro: cierra al tocar */}
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative w-full rounded-t-3xl bg-white dark:bg-slate-900 p-5 pb-8
                   shadow-xl animate-[slideUp_0.2s_ease-out]"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

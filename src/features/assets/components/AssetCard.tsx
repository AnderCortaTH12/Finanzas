import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import type { PosicionCalculada } from '../assetService';
import { formatEur } from '@/lib/money';
import { deleteActivo } from '../assetService';
import { refrescarActivo } from '@/features/prices/priceRefreshService';

interface AssetCardProps {
  posicion: PosicionCalculada;
}

/** Fila de un activo: ticker, cantidad, valor actual y plusvalía (€ y %). */
export function AssetCard({ posicion }: AssetCardProps) {
  const { activo, valorActual, plusvalia, plusvaliaPct } = posicion;
  const sinPrecio = valorActual == null;
  const positivo = (plusvalia ?? 0) >= 0;
  const colorPlus = sinPrecio
    ? 'text-slate-400'
    : positivo
      ? 'text-accent'
      : 'text-red-500';

  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState(false);

  async function recargarPrecio() {
    if (recargando) return;
    setRecargando(true);
    setError(false);
    try {
      await refrescarActivo(activo);
    } catch {
      setError(true); // p. ej. sin clave de Finnhub o sin conexión
      setTimeout(() => setError(false), 2500);
    } finally {
      setRecargando(false);
    }
  }

  return (
    <li className="flex items-center gap-2 py-3">
      {/* Avatar con el ticker */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                      bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
        {activo.ticker.slice(0, 4)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white truncate">
          {activo.nombre}
        </p>
        <p className="text-sm text-slate-400">
          {activo.cantidad} ud · {formatEur(activo.precioCompra)}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-slate-900 dark:text-white">
          {sinPrecio ? '—' : formatEur(valorActual)}
        </p>
        <p className={`text-sm ${error ? 'text-red-500' : colorPlus}`}>
          {error
            ? 'error al recargar'
            : sinPrecio
              ? 'sin precio'
              : `${positivo ? '+' : ''}${formatEur(plusvalia!)} (${plusvaliaPct! >= 0 ? '+' : ''}${plusvaliaPct!.toFixed(1)}%)`}
        </p>
      </div>

      {/* Recargar precio de este activo */}
      <button
        onClick={recargarPrecio}
        disabled={recargando}
        className="p-2 text-slate-300 hover:text-accent disabled:opacity-50"
        aria-label="Recargar precio"
      >
        <RefreshCw size={16} className={recargando ? 'animate-spin' : ''} />
      </button>

      <button
        onClick={() => deleteActivo(activo.id)}
        className="p-2 text-slate-300 hover:text-red-500"
        aria-label="Borrar activo"
      >
        <Trash2 size={18} />
      </button>
    </li>
  );
}

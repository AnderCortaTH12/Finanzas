import { Trash2 } from 'lucide-react';
import type { PosicionCalculada } from '../assetService';
import { formatEur } from '@/lib/money';
import { deleteActivo } from '../assetService';

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

  return (
    <li className="flex items-center gap-3 py-3">
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
        <p className={`text-sm ${colorPlus}`}>
          {sinPrecio
            ? 'sin precio'
            : `${positivo ? '+' : ''}${formatEur(plusvalia!)} (${plusvaliaPct! >= 0 ? '+' : ''}${plusvaliaPct!.toFixed(1)}%)`}
        </p>
      </div>

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

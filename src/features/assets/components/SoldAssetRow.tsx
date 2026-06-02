import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import type { PosicionVendida } from '../assetService';
import { reactivarActivo } from '../assetService';
import { formatEur } from '@/lib/money';
import { formatDate } from '@/lib/dates';

interface SoldAssetRowProps {
  posicion: PosicionVendida;
}

/** Fila de un activo vendido: muestra la ganancia/pérdida realizada. */
export function SoldAssetRow({ posicion }: SoldAssetRowProps) {
  const { activo, ganancia, gananciaPct } = posicion;
  const positivo = ganancia >= 0;
  const [confirmar, setConfirmar] = useState(false);

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                      bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
        {activo.ticker.slice(0, 4)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {activo.nombre}
        </p>
        <p className="text-xs text-slate-400">
          {activo.fechaVenta ? `Vendida el ${formatDate(activo.fechaVenta.slice(0, 10))}` : 'Vendida'}
        </p>
      </div>
      <div className={`text-right ${positivo ? 'text-accent' : 'text-red-500'}`}>
        <p className="text-sm font-semibold">
          {positivo ? '+' : ''}
          {formatEur(ganancia)}
        </p>
        <p className="text-xs">
          {gananciaPct >= 0 ? '+' : ''}
          {gananciaPct.toFixed(1)}%
        </p>
      </div>
      {confirmar ? (
        <span className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => reactivarActivo(activo.id)}
            className="font-medium text-accent"
          >
            Reactivar
          </button>
          <button onClick={() => setConfirmar(false)} className="text-slate-400">
            No
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmar(true)}
          className="p-1.5 text-slate-300 hover:text-accent"
          aria-label="Revertir venta"
          title="Volver a poner en cartera"
        >
          <Undo2 size={16} />
        </button>
      )}
    </li>
  );
}

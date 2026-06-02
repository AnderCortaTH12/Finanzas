import { useState } from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PosicionCalculada } from '../assetService';
import { formatEur } from '@/lib/money';
import { refrescarActivo } from '@/features/prices/priceRefreshService';

interface AssetCardProps {
  posicion: PosicionCalculada;
  onAbrir: () => void;
}

/** Tarjeta alta de un activo en cartera: compra, precio hoy, valor y rentabilidad. */
export function AssetCard({ posicion, onAbrir }: AssetCardProps) {
  const { activo, coste, valorActual, plusvalia, plusvaliaPct } = posicion;
  const sinPrecio = valorActual == null;
  const positivo = (plusvalia ?? 0) >= 0;

  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState(false);

  async function recargarPrecio(e: React.MouseEvent) {
    e.stopPropagation(); // no abrir el detalle al pulsar recargar
    if (recargando) return;
    setRecargando(true);
    setError(false);
    try {
      await refrescarActivo(activo);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2500);
    } finally {
      setRecargando(false);
    }
  }

  const colorPlus = sinPrecio
    ? 'text-slate-400'
    : positivo
      ? 'text-accent'
      : 'text-red-500';

  return (
    <Card className="p-4 active:scale-[0.99] transition cursor-pointer" >
      <div onClick={onAbrir}>
        {/* Cabecera: ticker + nombre + valor actual */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                          bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
            {activo.ticker.slice(0, 4)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {activo.nombre}
            </p>
            <p className="text-xs text-slate-400">{activo.ticker}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900 dark:text-white">
              {sinPrecio ? '—' : formatEur(valorActual)}
            </p>
            <p className={`text-sm font-medium ${error ? 'text-red-500' : colorPlus}`}>
              {error
                ? 'error'
                : sinPrecio
                  ? 'sin precio'
                  : `${positivo ? '+' : ''}${plusvaliaPct!.toFixed(1)}%`}
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>

        {/* Datos clave en rejilla */}
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-center">
          <Dato label="Compra/ud" valor={formatEur(activo.precioCompra)} />
          <Dato
            label="Hoy/ud"
            valor={activo.ultimoPrecio != null ? formatEur(activo.ultimoPrecio) : '—'}
          />
          <Dato
            label="Ganancia"
            valor={plusvalia != null ? `${positivo ? '+' : ''}${formatEur(plusvalia)}` : '—'}
            color={colorPlus}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {activo.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 4 })} ud ·
          invertido {formatEur(coste)}
        </p>
      </div>

      {/* Acción rápida: recargar precio */}
      <button
        onClick={recargarPrecio}
        disabled={recargando}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl
                   bg-slate-50 dark:bg-slate-800 py-2 text-sm text-slate-500
                   hover:text-accent disabled:opacity-50"
      >
        <RefreshCw size={15} className={recargando ? 'animate-spin' : ''} />
        Recargar precio
      </button>
    </Card>
  );
}

function Dato({
  label,
  valor,
  color = 'text-slate-900 dark:text-white',
}: {
  label: string;
  valor: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{valor}</p>
    </div>
  );
}

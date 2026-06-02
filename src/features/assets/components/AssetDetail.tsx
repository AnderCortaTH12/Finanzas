import { useEffect, useState } from 'react';
import { RefreshCw, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import type { Activo } from '@/models/types';
import { calcularPosicion, deleteActivo, venderActivo } from '../assetService';
import { refrescarActivo } from '@/features/prices/priceRefreshService';
import { formatEur, parseEurInput, centsToEuros } from '@/lib/money';
import { formatDate, todayIso } from '@/lib/dates';

interface AssetDetailProps {
  activo: Activo | null;
  onClose: () => void;
}

/** Ficha de detalle de un activo: cotización, compra, rentabilidad y acciones. */
export function AssetDetail({ activo, onClose }: AssetDetailProps) {
  const [recargando, setRecargando] = useState(false);
  const [modoVenta, setModoVenta] = useState(false);
  const [precioVenta, setPrecioVenta] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  useEffect(() => {
    // Al abrir/cambiar de activo, resetea los sub-estados.
    setModoVenta(false);
    setConfirmarBorrado(false);
    if (activo?.ultimoPrecio != null) {
      setPrecioVenta(String(centsToEuros(activo.ultimoPrecio)).replace('.', ','));
    } else {
      setPrecioVenta('');
    }
  }, [activo?.id]);

  if (!activo) return null;

  const pos = calcularPosicion(activo);
  const positivo = (pos.plusvalia ?? 0) >= 0;

  async function recargar() {
    if (recargando || !activo) return;
    setRecargando(true);
    try {
      await refrescarActivo(activo);
    } catch {
      /* sin clave o sin conexión */
    } finally {
      setRecargando(false);
    }
  }

  async function confirmarVenta() {
    if (!activo) return;
    const cents = parseEurInput(precioVenta);
    if (cents === null || cents === 0) return;
    await venderActivo(activo.id, cents);
    onClose();
  }

  async function borrar() {
    if (!activo) return;
    await deleteActivo(activo.id);
    onClose();
  }

  return (
    <Sheet open={!!activo} onClose={onClose} title={activo.nombre}>
      <div className="space-y-4">
        {/* Valor actual + rentabilidad */}
        <div className="text-center">
          <p className="text-xs text-slate-400">Valor actual</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {pos.valorActual != null ? formatEur(pos.valorActual) : '—'}
          </p>
          {pos.plusvalia != null && (
            <div
              className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${
                positivo ? 'text-accent' : 'text-red-500'
              }`}
            >
              {positivo ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {positivo ? '+' : ''}
              {formatEur(pos.plusvalia)} ({positivo ? '+' : ''}
              {pos.plusvaliaPct!.toFixed(2)}%)
            </div>
          )}
        </div>

        {/* Detalle en filas */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
          <Fila label="Ticker" valor={activo.ticker} />
          <Fila
            label="Cotización de hoy (/ud)"
            valor={activo.ultimoPrecio != null ? formatEur(activo.ultimoPrecio) : '—'}
          />
          <Fila label="Precio de compra (/ud)" valor={formatEur(activo.precioCompra)} />
          <Fila
            label="Acciones"
            valor={activo.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 6 })}
          />
          <Fila label="Invertido" valor={formatEur(pos.coste)} />
          {activo.fechaUltimoPrecio && (
            <Fila
              label="Precio actualizado"
              valor={new Date(activo.fechaUltimoPrecio).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          )}
        </div>

        {/* Recargar precio */}
        <button
          onClick={recargar}
          disabled={recargando}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl
                     bg-slate-50 dark:bg-slate-800 py-2.5 text-sm text-slate-500
                     hover:text-accent disabled:opacity-50"
        >
          <RefreshCw size={15} className={recargando ? 'animate-spin' : ''} />
          Recargar precio ahora
        </button>

        {/* Vender con confirmación */}
        {!modoVenta ? (
          <Button onClick={() => setModoVenta(true)} className="w-full">
            Marcar como vendida
          </Button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-accent/40 p-3">
            <label className="block">
              <span className="text-xs text-slate-500">Precio de venta (/ud)</span>
              <div className="flex items-baseline gap-1">
                <input
                  inputMode="decimal"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700
                             bg-transparent px-3 py-2.5 text-slate-900 dark:text-white outline-none
                             focus:ring-2 focus:ring-accent"
                />
                <span className="text-lg text-slate-400">€</span>
              </div>
              <span className="mt-1 block text-xs text-slate-400">
                Vendiendo el {formatDate(todayIso())}. Se guardará en el histórico.
              </span>
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setModoVenta(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={confirmarVenta} className="flex-1">
                Confirmar venta
              </Button>
            </div>
          </div>
        )}

        {/* Borrar (no confunde con vender: elimina sin guardar histórico) */}
        {!confirmarBorrado ? (
          <button
            onClick={() => setConfirmarBorrado(true)}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-slate-400 hover:text-red-500"
          >
            <Trash2 size={15} /> Eliminar activo
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-slate-500">¿Eliminar sin guardar en histórico?</span>
            <button onClick={borrar} className="font-medium text-red-500">
              Eliminar
            </button>
            <button onClick={() => setConfirmarBorrado(false)} className="text-slate-400">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{valor}</span>
    </div>
  );
}

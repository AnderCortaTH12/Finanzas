import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, RefreshCw, TrendingUp, TrendingDown, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/app/providers';
import type { Activo } from '@/models/types';
import { listActivos, calcularCartera, calcularRealizado } from './assetService';
import { AssetForm } from './components/AssetForm';
import { AssetCard } from './components/AssetCard';
import { AssetDetail } from './components/AssetDetail';
import { SoldAssetRow } from './components/SoldAssetRow';
import {
  refrescarCaducados,
  refrescarTodos,
  ultimoRefresco,
} from '@/features/prices/priceRefreshService';
import { formatEur } from '@/lib/money';

/** Pantalla de la Cartera: activos en posesión + histórico de vendidas. */
export function PortfolioPage() {
  const { usuario, cargando } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [detalle, setDetalle] = useState<Activo | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const refrescoInicialHecho = useRef(false);

  const activos = useLiveQuery(
    () => (usuario ? listActivos(usuario.id) : []),
    [usuario?.id],
  );
  const ultimo = useLiveQuery(
    () => (usuario ? ultimoRefresco(usuario.id) : null),
    [usuario?.id, activos],
  );

  const cartera = useMemo(() => calcularCartera(activos ?? []), [activos]);
  const realizado = useMemo(() => calcularRealizado(activos ?? []), [activos]);

  // Mantén el detalle sincronizado con los datos vivos (precio recargado, etc.).
  const detalleVivo = useMemo(
    () => (detalle ? (activos ?? []).find((a) => a.id === detalle.id) ?? null : null),
    [detalle, activos],
  );

  // Al abrir la app: refresca solo los precios caducados (>= 6h). Una sola vez.
  useEffect(() => {
    if (!usuario || refrescoInicialHecho.current) return;
    refrescoInicialHecho.current = true;
    refrescarCaducados(usuario.id).catch(() => {});
  }, [usuario]);

  async function handleRefrescarAhora() {
    if (!usuario || refrescando) return;
    setRefrescando(true);
    setAviso(null);
    try {
      const r = await refrescarTodos(usuario.id);
      if (r.fallidos.length > 0) {
        setAviso(`Fallaron: ${r.fallidos.map((f) => f.ticker).join(', ')}`);
      }
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Error al refrescar');
    } finally {
      setRefrescando(false);
    }
  }

  if (cargando) {
    return <div className="p-8 text-center text-slate-400">Cargando…</div>;
  }

  const hayActivas = cartera.posiciones.length > 0;
  const positivo = cartera.plusvaliaTotal >= 0;
  const realizadoPositivo = realizado.gananciaTotal >= 0;

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cartera</h1>
        <button
          onClick={handleRefrescarAhora}
          disabled={refrescando || !hayActivas}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm
                     text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          <RefreshCw size={16} className={refrescando ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </header>

      {/* Resumen: valor actual (no realizado) */}
      <Card className="p-5">
        <p className="text-xs text-slate-400">Valor actual de tu cartera</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {formatEur(cartera.valorTotal)}
        </p>
        {hayActivas && (
          <div
            className={`mt-1 flex items-center gap-1 text-sm font-medium ${
              positivo ? 'text-accent' : 'text-red-500'
            }`}
          >
            {positivo ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {positivo ? '+' : ''}
              {formatEur(cartera.plusvaliaTotal)}
              {cartera.plusvaliaPct != null
                ? ` (${cartera.plusvaliaPct >= 0 ? '+' : ''}${cartera.plusvaliaPct.toFixed(1)}%)`
                : ''}{' '}
              sin realizar
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Invertido: {formatEur(cartera.costeTotal)}
          {ultimo
            ? ` · Actualizado: ${new Date(ultimo).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : ''}
        </p>
      </Card>

      {/* Resumen: rentabilidad realizada (de ventas) */}
      {realizado.vendidas.length > 0 && (
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Rentabilidad realizada</p>
            <p className="text-xs text-slate-400">
              {realizado.vendidas.length} venta{realizado.vendidas.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className={`text-right ${realizadoPositivo ? 'text-accent' : 'text-red-500'}`}>
            <p className="text-xl font-bold">
              {realizadoPositivo ? '+' : ''}
              {formatEur(realizado.gananciaTotal)}
            </p>
            {realizado.gananciaPct != null && (
              <p className="text-sm">
                {realizado.gananciaPct >= 0 ? '+' : ''}
                {realizado.gananciaPct.toFixed(1)}%
              </p>
            )}
          </div>
        </Card>
      )}

      {aviso && <p className="text-sm text-amber-500 text-center px-4">{aviso}</p>}

      {/* Activos en cartera */}
      {!hayActivas ? (
        <Card className="p-8 text-center text-slate-400">
          Sin activos en cartera. Pulsa + para añadir el primero.
        </Card>
      ) : (
        <div className="space-y-3">
          {cartera.posiciones.map((p) => (
            <AssetCard
              key={p.activo.id}
              posicion={p}
              onAbrir={() => setDetalle(p.activo)}
            />
          ))}
        </div>
      )}

      {/* Histórico de vendidas */}
      {realizado.vendidas.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <History size={15} /> Vendidas
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {realizado.vendidas.map((v) => (
              <SoldAssetRow key={v.activo.id} posicion={v} />
            ))}
          </ul>
        </Card>
      )}

      <p className="px-4 text-center text-xs text-slate-400">
        Precios vía Finnhub (acciones de EE. UU., en USD). Se refrescan
        automáticamente cada 6 h al abrir la app.
      </p>

      <button
        onClick={() => setFormOpen(true)}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center
                   rounded-full bg-accent text-white shadow-lg active:scale-95 transition"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        aria-label="Añadir activo"
      >
        <Plus size={28} />
      </button>

      <AssetForm open={formOpen} onClose={() => setFormOpen(false)} />
      <AssetDetail activo={detalleVivo} onClose={() => setDetalle(null)} />
    </div>
  );
}

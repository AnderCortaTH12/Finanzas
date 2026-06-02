import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/app/providers';
import { listActivos, calcularCartera } from './assetService';
import { AssetForm } from './components/AssetForm';
import { AssetCard } from './components/AssetCard';
import {
  refrescarCaducados,
  refrescarTodos,
  ultimoRefresco,
} from '@/features/prices/priceRefreshService';
import { formatEur } from '@/lib/money';

/** Pantalla de la Fase 2: cartera de activos con valor, plusvalía y refresco. */
export function PortfolioPage() {
  const { usuario, cargando } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const refrescoInicialHecho = useRef(false);

  const activos = useLiveQuery(
    () => (usuario ? listActivos(usuario.id) : []),
    [usuario?.id],
  );
  const ultimo = useLiveQuery(
    () => (usuario ? ultimoRefresco(usuario.id) : null),
    [usuario?.id, activos?.length],
  );

  const cartera = useMemo(() => calcularCartera(activos ?? []), [activos]);

  // Al abrir la app: refresca solo los precios caducados (>= 6h). Una sola vez.
  useEffect(() => {
    if (!usuario || refrescoInicialHecho.current) return;
    refrescoInicialHecho.current = true;
    refrescarCaducados(usuario.id).catch(() => {
      /* sin conexión o sin clave: usamos lo cacheado, sin molestar */
    });
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

  const positivo = cartera.plusvaliaTotal >= 0;

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cartera</h1>
        <button
          onClick={handleRefrescarAhora}
          disabled={refrescando || (activos?.length ?? 0) === 0}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm
                     text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          <RefreshCw size={16} className={refrescando ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </header>

      {/* Resumen total */}
      <Card className="p-5">
        <p className="text-xs text-slate-400">Valor total</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {formatEur(cartera.valorTotal)}
        </p>
        {(activos?.length ?? 0) > 0 && (
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
                : ''}
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

      {aviso && (
        <p className="text-sm text-amber-500 text-center px-4">{aviso}</p>
      )}

      {/* Lista de posiciones */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-1">Activos</h2>
        {(activos?.length ?? 0) === 0 ? (
          <p className="text-center text-slate-400 py-8">
            Sin activos. Pulsa + para añadir el primero.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cartera.posiciones.map((p) => (
              <AssetCard key={p.activo.id} posicion={p} />
            ))}
          </ul>
        )}
      </Card>

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
    </div>
  );
}

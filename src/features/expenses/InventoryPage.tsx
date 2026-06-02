import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/app/providers';
import { inventarioEntre } from './inventoryService';
import { formatEur } from '@/lib/money';
import { weekStartIso, monthStartIso, todayIso, formatDate } from '@/lib/dates';

type Rango = 'semana' | 'mes' | 'todo';

/** Inventario de productos comprados (a partir de tickets escaneados). */
export function InventoryPage() {
  const { usuario } = useApp();
  const navigate = useNavigate();
  const [rango, setRango] = useState<Rango>('semana');

  const desde =
    rango === 'semana' ? weekStartIso() : rango === 'mes' ? monthStartIso() : '0000-01-01';
  const hasta = todayIso();

  const productos = useLiveQuery(
    () => (usuario ? inventarioEntre(usuario.id, desde, hasta) : []),
    [usuario?.id, desde, hasta],
  );

  const tabs: { id: Rango; label: string }[] = [
    { id: 'semana', label: 'Esta semana' },
    { id: 'mes', label: 'Este mes' },
    { id: 'todo', label: 'Todo' },
  ];

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-600"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
      </header>

      {/* Selector de rango */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setRango(t.id)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              rango === t.id
                ? 'bg-accent text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!productos || productos.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <Package size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Todavía no hay productos. Escanea un ticket para empezar a llenar el
            inventario.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {productos.map((p) => (
            <div key={p.nombreNorm} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white capitalize">
                  {p.nombre}
                </p>
                <p className="text-xs text-slate-400">
                  {p.veces} {p.veces === 1 ? 'vez' : 'veces'} · última {formatDate(p.ultimaFecha)}
                </p>
              </div>
              <div className="ml-3 text-right">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formatEur(p.total)}
                </p>
                <p className="text-xs text-slate-400">acumulado</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

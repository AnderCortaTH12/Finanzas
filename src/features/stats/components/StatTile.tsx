import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface StatTileProps {
  label: string;
  valor: string;
  icono: ReactNode;
  sub?: string;
}

/** Mini-tarjeta para una métrica rápida (icono + valor + etiqueta). */
export function StatTile({ label, valor, icono, sub }: StatTileProps) {
  return (
    <Card className="p-4">
      <div className="mb-2 text-accent">{icono}</div>
      <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
        {valor}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

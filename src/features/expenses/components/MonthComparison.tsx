import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatEur } from '@/lib/money';
import type { Cents } from '@/models/types';

interface MonthComparisonProps {
  totalActual: Cents;
  totalAnterior: Cents;
}

/** Comparativa del gasto del mes actual frente al mes anterior. */
export function MonthComparison({ totalActual, totalAnterior }: MonthComparisonProps) {
  const diff = totalActual - totalAnterior;
  const pct =
    totalAnterior > 0 ? Math.round((diff / totalAnterior) * 100) : null;

  // Gastar menos es "bueno" (verde); gastar más es "malo" (rojo).
  const subio = diff > 0;
  const igual = diff === 0;
  const color = igual
    ? 'text-slate-400'
    : subio
      ? 'text-red-500'
      : 'text-accent';
  const Icon = igual ? Minus : subio ? ArrowUp : ArrowDown;

  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400">vs. mes anterior</p>
        <p className="text-sm text-slate-500">{formatEur(totalAnterior)}</p>
      </div>
      <div className={`flex items-center gap-1 font-semibold ${color}`}>
        <Icon size={18} />
        <span>
          {formatEur(Math.abs(diff))}
          {pct !== null ? ` (${Math.abs(pct)}%)` : ''}
        </span>
      </div>
    </Card>
  );
}

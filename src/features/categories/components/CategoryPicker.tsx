import type { Categoria } from '@/models/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface CategoryPickerProps {
  categorias: Categoria[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Cuadrícula de categorías seleccionables con icono y color. */
export function CategoryPicker({
  categorias,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categorias.map((cat) => {
        const activa = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 py-3 transition
              ${activa ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-accent' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <CategoryIcon name={cat.icono} color={cat.color} withBackground />
            <span className="text-xs text-slate-600 dark:text-slate-300 text-center leading-tight">
              {cat.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );
}

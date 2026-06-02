import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Loader2, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { listCategorias } from '@/features/categories/categoryService';
import { useUsuarioId } from '@/app/providers';
import { parseEurInput } from '@/lib/money';
import { todayIso } from '@/lib/dates';
import { leerTicket } from '@/lib/ocr';
import { parsearTicket } from '../ticketParser';
import { guardarTicket } from '../inventoryService';

interface ScanTicketProps {
  open: boolean;
  onClose: () => void;
}

/** Línea editable en la pantalla de confirmación. */
interface LineaEditable {
  nombre: string;
  importe: string; // texto editable, '3,45'
}

type Fase = 'inicio' | 'leyendo' | 'confirmar';

/**
 * Escanea un ticket con la cámara, lo lee con OCR (en el dispositivo) y muestra
 * una pantalla de confirmación con todo editable antes de guardar.
 */
export function ScanTicket({ open, onClose }: ScanTicketProps) {
  const usuarioId = useUsuarioId();
  const categorias = useLiveQuery(() => listCategorias(), []) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const [fase, setFase] = useState<Fase>('inicio');
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Campos del ticket (editables en la confirmación)
  const [comercio, setComercio] = useState('');
  const [fecha, setFecha] = useState(todayIso());
  const [total, setTotal] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [lineas, setLineas] = useState<LineaEditable[]>([]);
  const [textoCrudo, setTextoCrudo] = useState('');

  // Reinicia todo al abrir/cerrar.
  useEffect(() => {
    if (open) {
      setFase('inicio');
      setProgreso(0);
      setError(null);
      setComercio('');
      setFecha(todayIso());
      setTotal('');
      setCategoriaId(null);
      setLineas([]);
      setTextoCrudo('');
    }
  }, [open]);

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFase('leyendo');
    setProgreso(0);
    try {
      const texto = await leerTicket(file, setProgreso);
      const r = parsearTicket(texto);
      setComercio(r.comercio);
      setFecha(r.fecha ?? todayIso());
      setTotal(r.total != null ? (r.total / 100).toFixed(2).replace('.', ',') : '');
      setLineas(
        r.lineas.map((l) => ({
          nombre: l.nombre,
          importe: (l.importe / 100).toFixed(2).replace('.', ','),
        })),
      );
      setTextoCrudo(r.textoCrudo);
      setFase('confirmar');
    } catch (err) {
      console.error('Error OCR:', err);
      const detalle = err instanceof Error ? err.message : String(err);
      setError(`No se pudo leer la imagen: ${detalle}`);
      setFase('inicio');
    } finally {
      // permite volver a elegir el mismo archivo
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function actualizarLinea(i: number, campo: keyof LineaEditable, valor: string) {
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)),
    );
  }

  function borrarLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function anadirLinea() {
    setLineas((prev) => [...prev, { nombre: '', importe: '' }]);
  }

  async function handleGuardar() {
    const totalCents = parseEurInput(total);
    if (totalCents === null || totalCents === 0) {
      setError('Indica un total válido');
      return;
    }
    if (!categoriaId) {
      setError('Elige una categoría');
      return;
    }
    const lineasValidas = lineas
      .map((l) => ({ nombre: l.nombre.trim(), importe: parseEurInput(l.importe) }))
      .filter((l) => l.nombre && l.importe !== null && l.importe > 0)
      .map((l) => ({ nombre: l.nombre, importe: l.importe as number }));

    await guardarTicket({
      usuarioId,
      categoriaId,
      fecha,
      total: totalCents,
      comercio: comercio.trim() || undefined,
      textoCrudo,
      lineas: lineasValidas,
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Escanear ticket">
      {/* FASE 1: elegir/sacar foto */}
      {fase === 'inicio' && (
        <div className="space-y-5 text-center">
          <p className="text-sm text-slate-500">
            Haz una foto del ticket y la app intentará leerlo. La imagen no sale
            de tu móvil.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleArchivo}
            className="hidden"
          />
          <Button
            onClick={() => inputRef.current?.click()}
            className="w-full"
          >
            <Camera size={20} /> Hacer foto
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* FASE 2: leyendo */}
      {fase === 'leyendo' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p className="text-sm text-slate-500">
            Leyendo el ticket… {Math.round(progreso * 100)}%
          </p>
          <p className="text-xs text-slate-400">
            La primera vez puede tardar más (descarga el idioma).
          </p>
        </div>
      )}

      {/* FASE 3: confirmar y editar */}
      {fase === 'confirmar' && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            ¿Es esto correcto? Corrige lo que haga falta.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs text-slate-500">Comercio</span>
              <input
                type="text"
                value={comercio}
                onChange={(e) => setComercio(e.target.value)}
                placeholder="Ej: Mercadona"
                className="rounded-xl border border-slate-200 dark:border-slate-700
                           bg-transparent px-3 py-2 text-slate-900 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700
                           bg-transparent px-3 py-2 text-slate-900 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Total</span>
              <input
                type="text"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0,00"
                className="rounded-xl border border-slate-200 dark:border-slate-700
                           bg-transparent px-3 py-2 text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <CategoryPicker
            categorias={categorias}
            selectedId={categoriaId}
            onSelect={setCategoriaId}
          />

          {/* Lista de productos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Productos detectados
              </span>
              <button
                onClick={anadirLinea}
                className="flex items-center gap-1 text-xs text-accent"
              >
                <Plus size={14} /> Añadir
              </button>
            </div>
            {lineas.length === 0 && (
              <p className="text-xs text-slate-400">
                No se detectaron productos. Puedes añadirlos a mano.
              </p>
            )}
            {lineas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={l.nombre}
                  onChange={(e) => actualizarLinea(i, 'nombre', e.target.value)}
                  placeholder="Producto"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700
                             bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={l.importe}
                  onChange={(e) => actualizarLinea(i, 'importe', e.target.value)}
                  placeholder="0,00"
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-700
                             bg-transparent px-2 py-1.5 text-sm text-right text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">€</span>
                <button
                  onClick={() => borrarLinea(i)}
                  className="p-1 text-slate-400 hover:text-red-500"
                  aria-label="Quitar línea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Texto leído por el OCR (para revisar / corregir) */}
          <details className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500">
              Texto leído {textoCrudo.trim() ? '' : '(vacío — no se reconoció nada)'}
            </summary>
            <textarea
              value={textoCrudo}
              onChange={(e) => setTextoCrudo(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700
                         bg-transparent px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300"
            />
          </details>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setFase('inicio')} className="flex-1">
              Otra foto
            </Button>
            <Button onClick={handleGuardar} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

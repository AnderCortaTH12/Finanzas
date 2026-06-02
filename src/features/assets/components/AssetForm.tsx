import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { parseEurInput } from '@/lib/money';
import { useUsuarioId } from '@/app/providers';
import { addActivo } from '../assetService';
import {
  obtenerPrecioTicker,
  hayProveedorConfigurado,
} from '@/features/prices/priceRefreshService';

/** ¿Hay clave de Finnhub configurada? Si no, no podemos validar el ticker. */
const HAY_CLAVE = hayProveedorConfigurado();

/** Modo de entrada: por nº de acciones o por dinero invertido hoy. */
type Modo = 'cantidad' | 'importe';

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
}

/** Formulario para añadir un activo, por cantidad de acciones o por importe. */
export function AssetForm({ open, onClose }: AssetFormProps) {
  const usuarioId = useUsuarioId();
  const [modo, setModo] = useState<Modo>('cantidad');
  const [ticker, setTicker] = useState('');
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [importe, setImporte] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setModo('cantidad');
      setTicker('');
      setNombre('');
      setCantidad('');
      setPrecio('');
      setImporte('');
      setError(null);
      setGuardando(false);
    }
  }, [open]);

  async function handleGuardar() {
    const tkr = ticker.trim().toUpperCase();
    if (!tkr) return setError('Introduce un ticker (ej. AAPL)');

    setError(null);
    setGuardando(true);

    // Obtenemos el precio de hoy si hay clave. En modo "importe" es obligatorio
    // (lo necesitamos para calcular cuántas acciones equivalen).
    let precioHoy: number | undefined;
    if (HAY_CLAVE) {
      try {
        const p = await obtenerPrecioTicker(tkr);
        precioHoy = p.precio;
      } catch (e) {
        setGuardando(false);
        return setError(
          e instanceof Error && /Sin precio/.test(e.message)
            ? `No encontramos el ticker "${tkr}". Revísalo (ej. AAPL, MSFT).`
            : 'No se pudo verificar el ticker (¿sin conexión?). Inténtalo de nuevo.',
        );
      }
    }

    if (modo === 'cantidad') {
      // ── Modo clásico: nº de acciones × precio de compra por unidad ──
      const cant = Number(cantidad.replace(',', '.'));
      const precioCents = parseEurInput(precio);
      if (!cant || cant <= 0) {
        setGuardando(false);
        return setError('Introduce una cantidad válida');
      }
      if (precioCents === null || precioCents === 0) {
        setGuardando(false);
        return setError('Introduce el precio de compra');
      }
      await addActivo({
        usuarioId,
        ticker: tkr,
        nombre: nombre.trim() || tkr,
        cantidad: cant,
        precioCompra: precioCents,
        ultimoPrecio: precioHoy,
      });
    } else {
      // ── Modo importe: "hoy he metido X € en esta acción" ──
      // Necesita el precio de hoy para derivar las acciones equivalentes.
      const importeCents = parseEurInput(importe);
      if (importeCents === null || importeCents === 0) {
        setGuardando(false);
        return setError('Introduce el dinero invertido');
      }
      if (!precioHoy || precioHoy === 0) {
        setGuardando(false);
        return setError(
          'Para "por importe" necesitas la clave de Finnhub (calcula las acciones con el precio de hoy).',
        );
      }
      // acciones = importe / precio (ambos en céntimos → nº de acciones)
      const cant = importeCents / precioHoy;
      await addActivo({
        usuarioId,
        ticker: tkr,
        nombre: nombre.trim() || tkr,
        cantidad: cant,
        precioCompra: precioHoy, // compraste hoy, al precio de hoy
        ultimoPrecio: precioHoy,
      });
    }

    setGuardando(false);
    onClose();
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 ' +
    'bg-transparent px-3 py-2.5 text-slate-900 dark:text-white outline-none ' +
    'focus:ring-2 focus:ring-accent';

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo activo">
      <div className="space-y-4">
        {/* Selector de modo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setModo('cantidad')}
            className={`rounded-xl py-2 text-sm transition ${
              modo === 'cantidad'
                ? 'bg-accent/10 text-accent ring-2 ring-accent'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Por cantidad
          </button>
          <button
            type="button"
            onClick={() => setModo('importe')}
            className={`rounded-xl py-2 text-sm transition ${
              modo === 'importe'
                ? 'bg-accent/10 text-accent ring-2 ring-accent'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Por importe
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-slate-500">Ticker</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL"
            autoCapitalize="characters"
            className={`${inputCls} uppercase`}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Nombre (opcional)</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Apple Inc."
            className={inputCls}
          />
        </label>

        {modo === 'cantidad' ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-500">Cantidad</span>
              <input
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="10"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Precio compra (/ud)</span>
              <input
                inputMode="decimal"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="150,00"
                className={inputCls}
              />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="text-xs text-slate-500">Dinero invertido hoy</span>
            <div className="flex items-baseline gap-1">
              <input
                inputMode="decimal"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder="10000,00"
                className={inputCls}
              />
              <span className="text-lg text-slate-400">€</span>
            </div>
            <span className="mt-1 block text-xs text-slate-400">
              Se calcularán las acciones equivalentes con el precio de hoy.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button onClick={handleGuardar} className="w-full" disabled={guardando}>
          {guardando ? 'Verificando ticker…' : 'Añadir activo'}
        </Button>
        <p className="text-xs text-slate-400 text-center">
          {HAY_CLAVE
            ? 'Se verifica el ticker y se obtiene el precio actual de Finnhub.'
            : 'Sin clave de Finnhub: solo disponible "por cantidad", sin verificar el ticker.'}
        </p>
      </div>
    </Sheet>
  );
}

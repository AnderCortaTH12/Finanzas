import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { parseEurInput } from '@/lib/money';
import { useUsuarioId } from '@/app/providers';
import { addActivo, updateActivo } from '../assetService';
import {
  obtenerPrecioTicker,
  hayProveedorConfigurado,
} from '@/features/prices/priceRefreshService';
import { nowIso } from '@/lib/dates';

/** ¿Hay clave de Finnhub configurada? Si no, no podemos validar el ticker. */
const HAY_CLAVE = hayProveedorConfigurado();

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
}

/** Formulario para añadir un activo manualmente (ticker, cantidad, precio compra). */
export function AssetForm({ open, onClose }: AssetFormProps) {
  const usuarioId = useUsuarioId();
  const [ticker, setTicker] = useState('');
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setTicker('');
      setNombre('');
      setCantidad('');
      setPrecio('');
      setError(null);
      setGuardando(false);
    }
  }, [open]);

  async function handleGuardar() {
    const tkr = ticker.trim().toUpperCase();
    const cant = Number(cantidad.replace(',', '.'));
    const precioCents = parseEurInput(precio);

    if (!tkr) return setError('Introduce un ticker (ej. AAPL)');
    if (!cant || cant <= 0) return setError('Introduce una cantidad válida');
    if (precioCents === null || precioCents === 0)
      return setError('Introduce el precio de compra');

    setError(null);
    setGuardando(true);

    // 1) Si hay clave, validamos el ticker ANTES de crear nada. Si no existe,
    //    no se añade el activo y se avisa para corregirlo.
    let precioActual: number | undefined;
    if (HAY_CLAVE) {
      try {
        const precio = await obtenerPrecioTicker(tkr);
        precioActual = precio.precio;
      } catch (e) {
        setGuardando(false);
        setError(
          e instanceof Error && /Sin precio/.test(e.message)
            ? `No encontramos el ticker "${tkr}". Revísalo (ej. AAPL, MSFT).`
            : 'No se pudo verificar el ticker (¿sin conexión?). Inténtalo de nuevo.',
        );
        return; // no se crea el activo
      }
    }

    // 2) El ticker es válido (o no hay clave para validar): creamos el activo,
    //    ya con su precio actual si lo hemos obtenido.
    const id = await addActivo({
      usuarioId,
      ticker: tkr,
      nombre: nombre.trim() || tkr,
      cantidad: cant,
      precioCompra: precioCents,
    });
    if (precioActual !== undefined) {
      await updateActivo(id, {
        ultimoPrecio: precioActual,
        fechaUltimoPrecio: nowIso(),
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

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button onClick={handleGuardar} className="w-full" disabled={guardando}>
          {guardando ? 'Verificando ticker…' : 'Añadir activo'}
        </Button>
        <p className="text-xs text-slate-400 text-center">
          {HAY_CLAVE
            ? 'Se verifica el ticker y se obtiene el precio actual de Finnhub.'
            : 'Sin clave de Finnhub: el activo se añade sin verificar el ticker.'}
        </p>
      </div>
    </Sheet>
  );
}

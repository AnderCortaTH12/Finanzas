import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import {
  descargarCopia,
  leerArchivoCopia,
  importarDatos,
  type CopiaSeguridad,
  type ModoImport,
} from './backupService';

/** Tarjeta de copia de seguridad: exportar e importar todos los datos. */
export function BackupCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendiente, setPendiente] = useState<CopiaSeguridad | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  async function handleExportar() {
    setError(null);
    setMensaje(null);
    try {
      await descargarCopia();
      setMensaje('Copia descargada. Guárdala en Archivos o envíatela.');
    } catch {
      setError('No se pudo crear la copia.');
    }
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMensaje(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar el mismo archivo
    if (!file) return;
    try {
      const copia = await leerArchivoCopia(file);
      setPendiente(copia); // abre el diálogo reemplazar/fusionar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivo no válido.');
    }
  }

  async function confirmarImport(modo: ModoImport) {
    if (!pendiente) return;
    setImportando(true);
    try {
      const r = await importarDatos(pendiente, modo);
      setMensaje(
        `Importado: ${r.gastos} gastos, ${r.activos} activos, ${r.usuarios} perfiles.`,
      );
    } catch {
      setError('No se pudo importar la copia.');
    } finally {
      setImportando(false);
      setPendiente(null);
    }
  }

  const fechaCopia = pendiente?.exportadoEn
    ? new Date(pendiente.exportadoEn).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-500 mb-1">Copia de seguridad</h2>
      <p className="text-xs text-slate-400 mb-3">
        Tus datos se guardan solo en este dispositivo. Exporta una copia de vez en
        cuando para no perderlos.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={handleExportar} className="justify-center">
          <Download size={18} /> Exportar
        </Button>
        <Button
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          className="justify-center"
        >
          <Upload size={18} /> Importar
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleArchivo}
        className="hidden"
      />

      {mensaje && <p className="mt-3 text-xs text-accent text-center">{mensaje}</p>}
      {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}

      {/* Diálogo: reemplazar o fusionar */}
      <Sheet open={!!pendiente} onClose={() => setPendiente(null)} title="Importar copia">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Copia del <strong>{fechaCopia}</strong>. ¿Cómo quieres importarla?
          </p>
          <Button
            onClick={() => confirmarImport('reemplazar')}
            disabled={importando}
            className="w-full"
          >
            Reemplazar todo
          </Button>
          <p className="text-xs text-slate-400 -mt-2 text-center">
            Borra lo actual y deja exactamente lo del archivo.
          </p>
          <Button
            variant="ghost"
            onClick={() => confirmarImport('fusionar')}
            disabled={importando}
            className="w-full justify-center"
          >
            Fusionar (añadir)
          </Button>
          <p className="text-xs text-slate-400 -mt-2 text-center">
            Mantiene lo actual y añade lo del archivo.
          </p>
        </div>
      </Sheet>
    </Card>
  );
}

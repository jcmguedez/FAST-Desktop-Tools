import { useState, useEffect } from 'react';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  GitCommit
} from 'lucide-react';
import { Entidad } from './GestionEntidades';

export interface Proceso {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
  numero_proceso: string;
}

export interface FlujoDato {
  id: number;
  descripcion: string;
  proceso_origen_id: number | null;
  proceso_destino_id: number | null;
  entidad_id: number | null;
  proceso_origen_nombre?: string;
  proceso_origen_num?: string;
  proceso_destino_nombre?: string;
  proceso_destino_num?: string;
  entidad_nombre?: string;
}

interface GestionProcesosProps {
  proyecto_id: number;
  proyectoNombre?: string;
  onDataChange?: () => void;
}

export default function GestionProcesos({
  proyecto_id,
  proyectoNombre,
  onDataChange
}: GestionProcesosProps) {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [flujos, setFlujos] = useState<FlujoDato[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario Proceso
  const [nombreProceso, setNombreProceso] = useState('');
  const [descProceso, setDescProceso] = useState('');
  const [numProceso, setNumProceso] = useState('1.0');
  const [isSubmittingProc, setIsSubmittingProc] = useState(false);

  // Formulario Flujo de Datos
  const [origenProcesoId, setOrigenProcesoId] = useState<number | ''>('');
  const [tipoDestino, setTipoDestino] = useState<'proceso' | 'entidad'>('proceso');
  const [destinoProcesoId, setDestinoProcesoId] = useState<number | ''>('');
  const [destinoEntidadId, setDestinoEntidadId] = useState<number | ''>('');
  const [descFlujo, setDescFlujo] = useState('');
  const [isSubmittingFlujo, setIsSubmittingFlujo] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Cargar procesos, flujos y entidades del proyecto
  const loadData = async () => {
    if (!proyecto_id) return;
    try {
      setLoading(true);
      setError(null);
      const [resProc, resFlujos, resEnt] = await Promise.all([
        fetch(`/api/procesos/${proyecto_id}`).then((r) => r.json()),
        fetch(`/api/flujos_datos/${proyecto_id}`).then((r) => r.json()),
        fetch(`/api/entidades/${proyecto_id}`).then((r) => r.json())
      ]);

      setProcesos(resProc || []);
      setFlujos(resFlujos || []);
      setEntidades(resEnt || []);

      // Auto-seleccionar primer proceso si no hay seleccionado
      if (resProc && resProc.length > 0 && origenProcesoId === '') {
        setOrigenProcesoId(resProc[0].id);
        if (resProc.length > 1) {
          setDestinoProcesoId(resProc[1].id);
        }
      }
      if (resEnt && resEnt.length > 0 && destinoEntidadId === '') {
        setDestinoEntidadId(resEnt[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al consultar datos del DFD desde SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [proyecto_id]);

  // Crear nuevo proceso
  const handleCrearProceso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProceso.trim() || !numProceso.trim()) return;

    try {
      setIsSubmittingProc(true);
      const res = await fetch('/api/procesos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id,
          nombre: nombreProceso.trim(),
          descripcion: descProceso.trim() || null,
          numero_proceso: numProceso.trim()
        })
      });

      if (!res.ok) throw new Error('Error al registrar proceso');

      const nuevo: Proceso = await res.json();
      notify(`Proceso "${nuevo.numero_proceso} ${nuevo.nombre}" guardado.`);
      setNombreProceso('');
      setDescProceso('');
      
      // Auto-incrementar sugerencia de número (1.0 -> 2.0 o 1.1 -> 1.2)
      const numFloat = parseFloat(numProceso);
      if (!isNaN(numFloat)) {
        setNumProceso(`${(numFloat + 1).toFixed(1)}`);
      }

      await loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('No se pudo guardar el proceso');
    } finally {
      setIsSubmittingProc(false);
    }
  };

  // Crear nuevo flujo de datos
  const handleCrearFlujo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descFlujo.trim()) return;

    try {
      setIsSubmittingFlujo(true);
      const payload: any = {
        proceso_origen_id: origenProcesoId ? Number(origenProcesoId) : null,
        descripcion: descFlujo.trim()
      };

      if (tipoDestino === 'proceso') {
        payload.proceso_destino_id = destinoProcesoId ? Number(destinoProcesoId) : null;
        payload.entidad_id = null;
      } else {
        payload.entidad_id = destinoEntidadId ? Number(destinoEntidadId) : null;
        payload.proceso_destino_id = null;
      }

      const res = await fetch('/api/flujos_datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al registrar flujo');

      notify(`Flujo de datos "${descFlujo.trim()}" registrado`);
      setDescFlujo('');
      await loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('Error al guardar el flujo de datos');
    } finally {
      setIsSubmittingFlujo(false);
    }
  };

  // Eliminar proceso
  const handleEliminarProceso = async (id: number) => {
    try {
      const res = await fetch(`/api/procesos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Proceso y sus flujos asociados eliminados');
        await loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar flujo de datos
  const handleEliminarFlujo = async (id: number) => {
    try {
      const res = await fetch(`/api/flujos_datos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Flujo de datos eliminado');
        await loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {notification && (
        <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Principal de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formularios (Proceso + Flujo) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Formulario Crear Proceso */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-indigo-400" />
                Nuevo Proceso (DFD)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Representa una función que transforma o procesa datos.
              </p>
            </div>

            <form onSubmit={handleCrearProceso} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nº Proceso</label>
                  <input
                    type="text"
                    value={numProceso}
                    onChange={(e) => setNumProceso(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre del Proceso</label>
                  <input
                    type="text"
                    value={nombreProceso}
                    onChange={(e) => setNombreProceso(e.target.value)}
                    placeholder="Ej. Verificar Stock, Facturar"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción de la Lógica (Opcional)</label>
                <textarea
                  value={descProceso}
                  onChange={(e) => setDescProceso(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre las entradas, reglas de negocio o cálculos"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProc}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmittingProc ? 'Guardando...' : 'Crear Proceso'}</span>
              </button>
            </form>
          </div>

          {/* 2. Formulario Crear Flujo de Datos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-emerald-400" />
                Nuevo Flujo de Datos (Interconexión)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Conecta un proceso origen con otro proceso o almacén de datos (entidad).
              </p>
            </div>

            {procesos.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 italic">
                Debes registrar al menos un proceso antes de crear flujos de datos.
              </p>
            ) : (
              <form onSubmit={handleCrearFlujo} className="space-y-3">
                {/* Proceso Origen */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Proceso Origen</label>
                  <select
                    value={origenProcesoId}
                    onChange={(e) => setOrigenProcesoId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                    required
                  >
                    {procesos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numero_proceso} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Destino (Proceso vs Entidad) */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipo de Destino</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTipoDestino('proceso')}
                      className={`py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        tipoDestino === 'proceso'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Workflow className="w-3 h-3" />
                      <span>Hacia Proceso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDestino('entidad')}
                      className={`py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        tipoDestino === 'entidad'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>Hacia Entidad</span>
                    </button>
                  </div>
                </div>

                {/* Destino Selector */}
                {tipoDestino === 'proceso' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Proceso Destino</label>
                    <select
                      value={destinoProcesoId}
                      onChange={(e) => setDestinoProcesoId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      required
                    >
                      {procesos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.numero_proceso} - {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Entidad (Almacén de Datos)</label>
                    {entidades.length === 0 ? (
                      <div className="text-[11px] text-rose-400 italic bg-rose-950/20 p-2 rounded border border-rose-900/30">
                        No hay entidades registradas en este proyecto. Regístralas en la pestaña "ERD".
                      </div>
                    ) : (
                      <select
                        value={destinoEntidadId}
                        onChange={(e) => setDestinoEntidadId(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                        required
                      >
                        {entidades.map((e) => (
                          <option key={e.id} value={e.id}>
                            Entidad: {e.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Descripción del Flujo */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Datos que Fluyen (Descripción)</label>
                  <input
                    type="text"
                    value={descFlujo}
                    onChange={(e) => setDescFlujo(e.target.value)}
                    placeholder="Ej. Factura generada, Solicitud de pedido"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFlujo}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingFlujo ? 'Guardando...' : 'Crear Flujo de Datos'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Columna Derecha: Listado de Procesos y Flujos */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lista de Procesos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Procesos del DFD ({procesos.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Definidos para el proyecto {proyectoNombre ? `"${proyectoNombre}"` : ''}
                </p>
              </div>
              <button
                onClick={loadData}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Cargando procesos...</div>
            ) : procesos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No hay procesos registrados. Registra el primero desde el formulario.
              </div>
            ) : (
              <div className="space-y-2">
                {procesos.map((proc) => (
                  <div
                    key={proc.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-bold shrink-0">
                        {proc.numero_proceso}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{proc.nombre}</h4>
                        {proc.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {proc.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEliminarProceso(proc.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer shrink-0"
                      title="Eliminar proceso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Flujos de Datos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-200">
                Flujos de Datos Interconectados ({flujos.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Estos flujos se alimentan directamente al generador de diagramas Mermaid.
              </p>
            </div>

            {flujos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Sin flujos de datos registrados en este proyecto.
              </div>
            ) : (
              <div className="space-y-2">
                {flujos.map((flujo) => (
                  <div
                    key={flujo.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold shrink-0">
                        P_{flujo.proceso_origen_num || flujo.proceso_origen_id}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {flujo.proceso_destino_id ? (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold shrink-0">
                          P_{flujo.proceso_destino_num || flujo.proceso_destino_id}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-semibold shrink-0 flex items-center gap-1">
                          <Database className="w-2.5 h-2.5" />
                          {flujo.entidad_nombre || 'Almacén'}
                        </span>
                      )}
                      <span className="text-slate-300 font-medium truncate ml-1">
                        "{flujo.descripcion}"
                      </span>
                    </div>

                    <button
                      onClick={() => handleEliminarFlujo(flujo.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer shrink-0"
                      title="Eliminar flujo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

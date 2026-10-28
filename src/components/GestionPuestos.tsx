import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Layers, 
  FileText, 
  Network, 
  PhoneCall, 
  MessageSquare,
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export interface Puesto {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
}

export interface ConexionPuesto {
  id: number;
  tipo_conexion: string;
  puesto_origen_id: number;
  puesto_destino_id: number;
  puesto_origen_nombre?: string;
  puesto_destino_nombre?: string;
}

interface GestionPuestosProps {
  proyecto_id: number;
  proyectoNombre?: string;
  onDataChange?: () => void;
}

export default function GestionPuestos({
  proyecto_id,
  proyectoNombre,
  onDataChange
}: GestionPuestosProps) {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [conexiones, setConexiones] = useState<ConexionPuesto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario Puesto
  const [nombrePuesto, setNombrePuesto] = useState('');
  const [descPuesto, setDescPuesto] = useState('');
  const [isSubmittingPuesto, setIsSubmittingPuesto] = useState(false);

  // Formulario Conexión
  const [origenPuestoId, setOrigenPuestoId] = useState<number | ''>('');
  const [destinoPuestoId, setDestinoPuestoId] = useState<number | ''>('');
  const [tipoConexion, setTipoConexion] = useState('Documental');
  const [isSubmittingConexion, setIsSubmittingConexion] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    if (!proyecto_id) return;
    try {
      setLoading(true);
      setError(null);
      const [resPuestos, resConexiones] = await Promise.all([
        fetch(`/api/puestos/${proyecto_id}`).then((r) => r.json()),
        fetch(`/api/conexiones_puestos/${proyecto_id}`).then((r) => r.json())
      ]);

      setPuestos(resPuestos || []);
      setConexiones(resConexiones || []);

      if (resPuestos && resPuestos.length > 0 && origenPuestoId === '') {
        setOrigenPuestoId(resPuestos[0].id);
        if (resPuestos.length > 1) {
          setDestinoPuestoId(resPuestos[1].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al consultar datos de puestos de trabajo desde SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [proyecto_id]);

  // Crear Puesto
  const handleCrearPuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePuesto.trim()) return;

    try {
      setIsSubmittingPuesto(true);
      const res = await fetch('/api/puestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id,
          nombre: nombrePuesto.trim(),
          descripcion: descPuesto.trim() || null
        })
      });

      if (!res.ok) throw new Error('Error al registrar puesto');

      const nuevo: Puesto = await res.json();
      notify(`Puesto "${nuevo.nombre}" guardado.`);
      setNombrePuesto('');
      setDescPuesto('');
      await loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('No se pudo guardar el puesto de trabajo');
    } finally {
      setIsSubmittingPuesto(false);
    }
  };

  // Crear Conexión entre puestos
  const handleCrearConexion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origenPuestoId || !destinoPuestoId) {
      notify('Selecciona el puesto de origen y de destino');
      return;
    }

    if (origenPuestoId === destinoPuestoId) {
      notify('El puesto de origen y de destino no pueden ser el mismo');
      return;
    }

    try {
      setIsSubmittingConexion(true);
      const res = await fetch('/api/conexiones_puestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puesto_origen_id: Number(origenPuestoId),
          puesto_destino_id: Number(destinoPuestoId),
          tipo_conexion: tipoConexion
        })
      });

      if (!res.ok) throw new Error('Error al registrar conexión');

      notify(`Canal "${tipoConexion}" establecido entre puestos.`);
      await loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('Error al guardar la conexión');
    } finally {
      setIsSubmittingConexion(false);
    }
  };

  // Eliminar puesto
  const handleEliminarPuesto = async (id: number) => {
    try {
      const res = await fetch(`/api/puestos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Puesto y sus conexiones eliminados');
        await loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar conexión
  const handleEliminarConexion = async (id: number) => {
    try {
      const res = await fetch(`/api/conexiones_puestos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Conexión eliminada');
        await loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCanalIcon = (tipo: string) => {
    if (tipo.includes('Digital') || tipo.includes('Red')) {
      return <Network className="w-3.5 h-3.5 text-sky-400" />;
    }
    if (tipo.includes('Verbal') || tipo.includes('Reunión')) {
      return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (tipo.includes('Telef')) {
      return <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formularios */}
        <div className="lg:col-span-5 space-y-6">
          {/* Formulario Crear Puesto */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Nuevo Puesto de Trabajo (DCP)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Representa un rol, unidad o departamento en la estructura organizacional.
              </p>
            </div>

            <form onSubmit={handleCrearPuesto} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nombre del Puesto o Rol</label>
                <input
                  type="text"
                  value={nombrePuesto}
                  onChange={(e) => setNombrePuesto(e.target.value)}
                  placeholder="Ej. Gerente de Compras, Caja"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción / Responsabilidades</label>
                <textarea
                  value={descPuesto}
                  onChange={(e) => setDescPuesto(e.target.value)}
                  rows={2}
                  placeholder="Funciones en el proceso de negocio"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPuesto}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmittingPuesto ? 'Guardando...' : 'Crear Puesto'}</span>
              </button>
            </form>
          </div>

          {/* Formulario Conexión entre Puestos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                Establecer Canal de Comunicación
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Define el medio a través del cual dos puestos intercambian información.
              </p>
            </div>

            {puestos.length < 2 ? (
              <p className="text-xs text-slate-500 py-3 italic">
                Debes registrar al menos dos puestos de trabajo para interconectarlos.
              </p>
            ) : (
              <form onSubmit={handleCrearConexion} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Puesto Origen</label>
                    <select
                      value={origenPuestoId}
                      onChange={(e) => setOrigenPuestoId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      required
                    >
                      {puestos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Puesto Destino</label>
                    <select
                      value={destinoPuestoId}
                      onChange={(e) => setDestinoPuestoId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      required
                    >
                      {puestos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipo de Conexión / Medio</label>
                  <select
                    value={tipoConexion}
                    onChange={(e) => setTipoConexion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Documental">Documental (Formularios físicos, reportes impresos)</option>
                    <option value="Digital / Red">Digital / Red (ERP, Correo, Base de Datos)</option>
                    <option value="Verbal / Reunión">Verbal / Reunión (Comités, Acuerdos)</option>
                    <option value="Telefónico">Telefónico (Voz directa)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingConexion}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingConexion ? 'Guardando...' : 'Crear Conexión'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Columna Derecha: Listados */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lista de Puestos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Puestos de la Organización ({puestos.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Estructura funcional de {proyectoNombre ? `"${proyectoNombre}"` : 'este proyecto'}
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
              <div className="py-8 text-center text-xs text-slate-500">Cargando puestos...</div>
            ) : puestos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No hay puestos de trabajo registrados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {puestos.map((puesto) => (
                  <div
                    key={puesto.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <h4 className="text-xs font-bold text-white">{puesto.nombre}</h4>
                        </div>
                        <button
                          onClick={() => handleEliminarPuesto(puesto.id)}
                          className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                          title="Eliminar puesto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {puesto.descripcion && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {puesto.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono pt-2 mt-2 border-t border-slate-800/60">
                      ID: #{puesto.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Conexiones */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-200">
                Canales de Enlace entre Puestos ({conexiones.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Líneas de comunicación que estructuran el Diagrama de Conexión de Puestos (DCP).
              </p>
            </div>

            {conexiones.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Sin conexiones interconectadas. Registra el primer enlace entre puestos.
              </div>
            ) : (
              <div className="space-y-2">
                {conexiones.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="font-semibold text-slate-200 truncate">
                        {c.puesto_origen_nombre}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">
                        {c.puesto_destino_nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-medium">
                        {getCanalIcon(c.tipo_conexion)}
                        <span>{c.tipo_conexion}</span>
                      </div>
                      <button
                        onClick={() => handleEliminarConexion(c.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                        title="Eliminar conexión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

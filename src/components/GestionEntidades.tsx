import { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Key, 
  X, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Type,
  Calendar,
  ToggleLeft
} from 'lucide-react';

export interface Atributo {
  id: number;
  entidad_id: number;
  nombre: string;
  tipo_dato: string;
  es_clave_primaria: number;
}

export interface Entidad {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
  atributos?: Atributo[];
}

interface GestionEntidadesProps {
  proyecto_id: number;
  proyectoNombre?: string;
  onDataChange?: () => void;
}

export default function GestionEntidades({
  proyecto_id,
  proyectoNombre,
  onDataChange
}: GestionEntidadesProps) {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario de Nueva Entidad
  const [nombreEntidad, setNombreEntidad] = useState('');
  const [descEntidad, setDescEntidad] = useState('');
  const [isCreatingEntidad, setIsCreatingEntidad] = useState(false);

  // Modal / Panel de Atributos
  const [selectedEntidad, setSelectedEntidad] = useState<Entidad | null>(null);
  const [nombreAtributo, setNombreAtributo] = useState('');
  const [tipoDato, setTipoDato] = useState('Texto');
  const [esClavePrimaria, setEsClavePrimaria] = useState(false);
  const [isAddingAtributo, setIsAddingAtributo] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Cargar entidades con sus atributos desde el backend
  const fetchEntidades = async () => {
    if (!proyecto_id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/entidades/${proyecto_id}`);
      if (!res.ok) throw new Error('Error al consultar entidades');
      const data: Entidad[] = await res.json();
      setEntidades(data);

      // Si hay una entidad seleccionada en el modal, actualizar sus datos
      if (selectedEntidad) {
        const updated = data.find((e) => e.id === selectedEntidad.id);
        if (updated) setSelectedEntidad(updated);
      }
    } catch (err: any) {
      console.error('Error fetching entidades:', err);
      setError('No se pudieron cargar las entidades desde la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntidades();
  }, [proyecto_id]);

  // 2. Crear nueva entidad (POST /api/entidades)
  const handleCrearEntidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEntidad.trim()) return;

    try {
      setIsCreatingEntidad(true);
      const res = await fetch('/api/entidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id,
          nombre: nombreEntidad.trim(),
          descripcion: descEntidad.trim() || null
        })
      });

      if (!res.ok) throw new Error('Error al crear la entidad');

      const nueva: Entidad = await res.json();
      notify(`Entidad "${nueva.nombre}" creada exitosamente`);
      setNombreEntidad('');
      setDescEntidad('');
      await fetchEntidades();
      if (onDataChange) onDataChange();
    } catch (err: any) {
      console.error(err);
      notify('No se pudo guardar la entidad en SQLite');
    } finally {
      setIsCreatingEntidad(false);
    }
  };

  // 3. Eliminar entidad (DELETE /api/entidades/:id)
  const handleEliminarEntidad = async (id: number, nombre: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/entidades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      
      notify(`Entidad "${nombre}" y sus atributos eliminados`);
      if (selectedEntidad?.id === id) {
        setSelectedEntidad(null);
      }
      await fetchEntidades();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('Error al eliminar la entidad');
    }
  };

  // 4. Mapear tipos de datos visuales a SQL
  const mapTipoToSQL = (tipo: string): string => {
    switch (tipo) {
      case 'Texto':
        return 'VARCHAR(100)';
      case 'Número':
        return 'INTEGER';
      case 'Fecha':
        return 'DATETIME';
      case 'Booleano':
        return 'BOOLEAN';
      default:
        return 'VARCHAR(100)';
    }
  };

  // 5. Agregar atributo a la entidad seleccionada (POST /api/atributos)
  const handleAgregarAtributo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntidad || !nombreAtributo.trim()) return;

    try {
      setIsAddingAtributo(true);
      const tipoSQL = mapTipoToSQL(tipoDato);

      const res = await fetch('/api/atributos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidad_id: selectedEntidad.id,
          nombre: nombreAtributo.trim(),
          tipo_dato: tipoSQL,
          es_clave_primaria: esClavePrimaria ? 1 : 0
        })
      });

      if (!res.ok) throw new Error('Error al agregar atributo');

      notify(`Atributo "${nombreAtributo.trim()}" añadido`);
      setNombreAtributo('');
      setEsClavePrimaria(false);
      await fetchEntidades();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      notify('Error al registrar el atributo');
    } finally {
      setIsAddingAtributo(false);
    }
  };

  // 6. Eliminar atributo individual
  const handleEliminarAtributo = async (atributoId: number) => {
    try {
      const res = await fetch(`/api/atributos/${atributoId}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Atributo eliminado');
        await fetchEntidades();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Icono para tipo de dato
  const getDataTypeIcon = (tipo: string) => {
    if (tipo.includes('INT') || tipo.includes('DEC') || tipo === 'Número') {
      return <Hash className="w-3 h-3 text-emerald-400" />;
    }
    if (tipo.includes('DATE') || tipo === 'Fecha') {
      return <Calendar className="w-3 h-3 text-amber-400" />;
    }
    if (tipo.includes('BOOL') || tipo === 'Booleano') {
      return <ToggleLeft className="w-3 h-3 text-violet-400" />;
    }
    return <Type className="w-3 h-3 text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      {notification && (
        <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 animate-fadeIn">
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

      {/* Grid Principal: Formulario Entidad + Lista de Entidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Nueva Entidad */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Nueva Entidad (ERD)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define un objeto o concepto del dominio para el proyecto actual.
            </p>
          </div>

          <form onSubmit={handleCrearEntidad} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nombre de la Entidad
              </label>
              <input
                type="text"
                value={nombreEntidad}
                onChange={(e) => setNombreEntidad(e.target.value)}
                placeholder="Ej. Cliente, Factura, Producto"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                value={descEntidad}
                onChange={(e) => setDescEntidad(e.target.value)}
                rows={3}
                placeholder="Indica el propósito y las responsabilidades de esta entidad en el sistema"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingEntidad}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-xs font-medium text-white rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingEntidad ? 'Guardando...' : 'Crear Entidad'}</span>
            </button>
          </form>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/60 leading-relaxed">
            <span className="text-slate-400 font-semibold">Consejo FAST:</span> Al crear la entidad, el backend genera automáticamente un atributo clave primaria (<code className="text-indigo-400 font-mono">id_nombre</code>) de tipo <code className="text-slate-400 font-mono">INTEGER</code>.
          </div>
        </div>

        {/* Lista de Entidades Existentes */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Entidades del Proyecto {proyectoNombre ? `"${proyectoNombre}"` : ''}
              </h2>
              <p className="text-xs text-slate-500">
                {entidades.length} {entidades.length === 1 ? 'entidad registrada' : 'entidades registradas'} · Haz clic en una tarjeta para gestionar sus atributos.
              </p>
            </div>
            <button
              onClick={fetchEntidades}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              Recargar
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Cargando entidades desde SQLite...
            </div>
          ) : entidades.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No hay entidades en este proyecto. Utiliza el formulario de la izquierda para registrar la primera entidad.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entidades.map((ent) => {
                const isSelected = selectedEntidad?.id === ent.id;
                return (
                  <div
                    key={ent.id}
                    onClick={() => setSelectedEntidad(ent)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-950 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      {/* Cabecera de la Entidad */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-indigo-400 border border-slate-800'
                          }`}>
                            <Database className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                              {ent.nombre}
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ent.atributos?.length || 0} atributos
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleEliminarEntidad(ent.id, ent.nombre, e)}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                          title="Eliminar entidad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {ent.descripcion && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                          {ent.descripcion}
                        </p>
                      )}

                      {/* Lista resumida de atributos */}
                      <div className="space-y-1 mt-2">
                        {ent.atributos && ent.atributos.length > 0 ? (
                          ent.atributos.slice(0, 4).map((at) => (
                            <div
                              key={at.id}
                              className="text-[11px] font-mono flex items-center justify-between text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/40"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {at.es_clave_primaria ? (
                                  <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                ) : (
                                  <span className="w-3 inline-block" />
                                )}
                                <span className={at.es_clave_primaria ? 'font-bold text-amber-300 truncate' : 'truncate'}>
                                  {at.nombre}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-sans shrink-0">
                                {at.tipo_dato}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-600 italic">Sin atributos</div>
                        )}

                        {ent.atributos && ent.atributos.length > 4 && (
                          <div className="text-[10px] text-indigo-400 font-medium pt-0.5">
                            +{ent.atributos.length - 4} más...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">ID: #{ent.id}</span>
                      <span className="text-indigo-400 group-hover:underline font-medium flex items-center gap-1">
                        Gestionar Atributos ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN / MODAL DE ATRIBUTOS PARA LA ENTIDAD SELECCIONADA */}
      {/* ======================================================== */}
      {selectedEntidad && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-150">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Atributos de la Entidad: <span className="text-indigo-400">{selectedEntidad.nombre}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Agrega columnas y especifica claves primarias para el modelo relacional.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEntidad(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Formulario para agregar nuevo atributo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Agregar Nuevo Atributo
                </div>

                <form onSubmit={handleAgregarAtributo} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Nombre del Atributo
                      </label>
                      <input
                        type="text"
                        value={nombreAtributo}
                        onChange={(e) => setNombreAtributo(e.target.value)}
                        placeholder="Ej. precio, email, fecha_nacimiento"
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Tipo de Dato
                      </label>
                      <select
                        value={tipoDato}
                        onChange={(e) => setTipoDato(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      >
                        <option value="Texto">Texto (VARCHAR / TEXT)</option>
                        <option value="Número">Número (INTEGER / DECIMAL)</option>
                        <option value="Fecha">Fecha (DATETIME / DATE)</option>
                        <option value="Booleano">Booleano (BOOLEAN)</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkbox Clave Primaria */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={esClavePrimaria}
                        onChange={(e) => setEsClavePrimaria(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-400" />
                        Es Clave Primaria (PK)
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isAddingAtributo}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-xs font-medium text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingAtributo ? 'Guardando...' : 'Guardar Atributo'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de Atributos Actuales de la Entidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Atributos Configurados ({selectedEntidad.atributos?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Tabla: <code className="text-indigo-400 font-mono">atributos</code>
                  </span>
                </div>

                {!selectedEntidad.atributos || selectedEntidad.atributos.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No hay atributos en esta entidad. Agrega uno usando el formulario superior.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                    {selectedEntidad.atributos.map((at) => (
                      <div
                        key={at.id}
                        className="px-4 py-2.5 bg-slate-950 flex items-center justify-between hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center gap-3">
                          {at.es_clave_primaria ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" />
                              PK
                            </span>
                          ) : (
                            <span className="w-8 inline-block" />
                          )}

                          <div>
                            <span className={`text-xs font-mono ${at.es_clave_primaria ? 'font-bold text-amber-200' : 'text-slate-200'}`}>
                              {at.nombre}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {getDataTypeIcon(at.tipo_dato)}
                            <span className="text-[11px]">{at.tipo_dato}</span>
                          </div>

                          <button
                            onClick={() => handleEliminarAtributo(at.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                            title="Eliminar atributo"
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

            {/* Footer del Modal */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedEntidad(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

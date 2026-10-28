import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Layers, 
  CalendarRange, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';

export interface TareaGantt {
  id: number;
  proyecto_id: number;
  nombre_tarea: string;
  fecha_inicio: string;
  duracion_dias: number;
  fase_asociada: string;
}

interface GestionGanttProps {
  proyecto_id: number;
  proyectoNombre?: string;
  onDataChange?: () => void;
}

const FASES_FAST = [
  { id: 'Inspección Preliminar', label: 'Fase 1: Inspección Preliminar', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'Estudio del Sistema', label: 'Fase 2: Estudio del Sistema', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'Definición de Necesidades', label: 'Fase 3: Definición de Necesidades', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Selección de Factibilidad', label: 'Fase 4: Selección de Factibilidad', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'Diseño del Sistema', label: 'Fase 5: Diseño del Sistema', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Construcción e Instalación', label: 'Fase 6: Construcción e Instalación', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' }
];

export default function GestionGantt({ proyecto_id, proyectoNombre, onDataChange }: GestionGanttProps) {
  const [tareas, setTareas] = useState<TareaGantt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulario
  const todayStr = new Date().toISOString().split('T')[0];
  const [nombreTarea, setNombreTarea] = useState('');
  const [fechaInicio, setFechaInicio] = useState(todayStr);
  const [duracionDias, setDuracionDias] = useState<number>(5);
  const [faseAsociada, setFaseAsociada] = useState('Inspección Preliminar');

  // Cargar tareas
  const fetchTareas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/gantt/${proyecto_id}`);
      if (!res.ok) throw new Error('Error al cargar cronograma');
      const data = await res.json();
      setTareas(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [proyecto_id]);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  // Manejo de guardado de nueva tarea
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTarea.trim()) {
      setError('El nombre de la tarea es obligatorio.');
      return;
    }
    if (!fechaInicio) {
      setError('Debes especificar la fecha de inicio.');
      return;
    }
    if (duracionDias < 1) {
      setError('La duración debe ser al menos de 1 día.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await fetch('/api/gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id,
          nombre_tarea: nombreTarea.trim(),
          fecha_inicio: fechaInicio,
          duracion_dias: duracionDias,
          fase_asociada: faseAsociada
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo crear la tarea');
      }

      setNombreTarea('');
      setSuccessMsg('Tarea agregada exitosamente al cronograma');
      setTimeout(() => setSuccessMsg(null), 3000);

      await fetchTareas();
      onDataChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar tarea
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/gantt/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tarea');
      await fetchTareas();
      onDataChange?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Semilla rápida de FAST
  const handleLoadTemplate = async () => {
    const templateTasks = [
      { nombre: 'Entrevista de Alcance con Stakeholders', dias: 3, fase: 'Inspección Preliminar', offset: 0 },
      { nombre: 'Evaluación Preliminar de Factibilidad', dias: 4, fase: 'Inspección Preliminar', offset: 3 },
      { nombre: 'Modelado Entidad-Relación (DER)', dias: 6, fase: 'Estudio del Sistema', offset: 7 },
      { nombre: 'Modelado de Procesos y Flujos (DFD)', dias: 5, fase: 'Estudio del Sistema', offset: 13 },
      { nombre: 'Mapeo de Puestos y Canales (DCP)', dias: 4, fase: 'Estudio del Sistema', offset: 18 },
      { nombre: 'Elaboración del Diccionario de Datos', dias: 4, fase: 'Definición de Necesidades', offset: 22 },
      { nombre: 'Aprobación y Firma de Requerimientos', dias: 2, fase: 'Definición de Necesidades', offset: 26 }
    ];

    try {
      setIsSubmitting(true);
      const baseDate = new Date();
      for (const t of templateTasks) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + t.offset);
        const dateStr = d.toISOString().split('T')[0];

        await fetch('/api/gantt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proyecto_id,
            nombre_tarea: t.nombre,
            fecha_inicio: dateStr,
            duracion_dias: t.dias,
            fase_asociada: t.fase
          })
        });
      }
      setSuccessMsg('Plantilla metodológica FAST insertada correctamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchTareas();
      onDataChange?.();
    } catch (err: any) {
      setError(err.message || 'Error al aplicar plantilla');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculo de fecha final dado inicio y duración
  const calculateEndDate = (start: string, days: number): string => {
    try {
      const d = new Date(start + 'T00:00:00');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Estadísticas globales del cronograma
  const totalDias = tareas.reduce((acc, t) => acc + t.duracion_dias, 0);
  const minFecha = tareas.length > 0 
    ? tareas.reduce((min, t) => t.fecha_inicio < min ? t.fecha_inicio : min, tareas[0].fecha_inicio) 
    : '—';
  const maxFechaCalculada = tareas.length > 0
    ? tareas.reduce((max, t) => {
        const end = calculateEndDate(t.fecha_inicio, t.duracion_dias);
        return end > max ? end : max;
      }, calculateEndDate(tareas[0].fecha_inicio, tareas[0].duracion_dias))
    : '—';

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold">
              FASE 1: INSPECCIÓN PRELIMINAR
            </span>
            <span className="text-xs text-slate-400">· Planificación del Ciclo de Vida</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CalendarRange className="w-5 h-5 text-indigo-400" />
            Cronograma del Proyecto (Diagrama de Gantt)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Registra las actividades planificadas para cada fase de la metodología FAST. Estos datos alimentan automáticamente el Diagrama de Gantt generado en Mermaid.js y el Diccionario exportable a PDF.
          </p>
        </div>

        {tareas.length === 0 && (
          <button
            onClick={handleLoadTemplate}
            disabled={isSubmitting}
            className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Cargar Plantilla FAST
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Métricas del Cronograma */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Tareas Totales
          </div>
          <div className="text-2xl font-bold text-white font-mono">{tareas.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">En el ciclo de vida</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Duración Acumulada
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalDias} <span className="text-sm font-normal text-slate-400">días</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Suma de actividades</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Fecha de Inicio
          </div>
          <div className="text-sm font-bold text-white font-mono truncate">{minFecha}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Arranque del proyecto</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            Conclusión Estimada
          </div>
          <div className="text-sm font-bold text-white font-mono truncate">{maxFechaCalculada}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fin planificado</div>
        </div>
      </div>

      {/* Formulario y Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Registro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Nueva Tarea de Cronograma
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Define la actividad y su ventana temporal estimada.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre de la Tarea *
              </label>
              <input
                type="text"
                value={nombreTarea}
                onChange={(e) => setNombreTarea(e.target.value)}
                placeholder="Ej. Modelado DFD y Diccionario"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fase Asociada (FAST) *
              </label>
              <select
                value={faseAsociada}
                onChange={(e) => setFaseAsociada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                {FASES_FAST.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Duración (Días) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={duracionDias}
                  onChange={(e) => setDuracionDias(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span>Fecha fin calculada:</span>
              <strong className="text-indigo-300 font-mono">
                {fechaInicio ? calculateEndDate(fechaInicio, duracionDias) : '—'}
              </strong>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Registrar en Cronograma'}</span>
            </button>
          </form>
        </div>

        {/* Lista de Tareas Existentes */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Actividades Planificadas
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tareas.length} {tareas.length === 1 ? 'tarea registrada' : 'tareas registradas'} ordenadas por fecha.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadTemplate}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1"
                title="Añade tareas típicas de FAST al cronograma"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Plantilla FAST</span>
              </button>
            </div>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto max-h-[500px] space-y-2.5 pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Cargando cronograma del proyecto...
              </div>
            ) : tareas.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-6">
                <CalendarRange className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-300">Sin tareas en el cronograma</div>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Utiliza el formulario de la izquierda o haz clic en "Plantilla FAST" para cargar automáticamente las etapas estándar de Whitten, Bentley & Barlow.
                </p>
              </div>
            ) : (
              tareas.map((tarea) => {
                const faseConfig = FASES_FAST.find((f) => f.id === tarea.fase_asociada) || {
                  color: 'bg-slate-800 text-slate-300 border-slate-700'
                };
                const fechaFin = calculateEndDate(tarea.fecha_inicio, tarea.duracion_dias);

                return (
                  <div
                    key={tarea.id}
                    className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 rounded-xl flex items-center justify-between gap-3 group transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${faseConfig.color}`}>
                          {tarea.fase_asociada}
                        </span>
                        <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                          {tarea.nombre_tarea}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {tarea.fecha_inicio}
                        </span>
                        <span>→</span>
                        <span>{fechaFin}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-sans text-[10px]">
                          {tarea.duracion_dias} {tarea.duracion_dias === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(tarea.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="Eliminar tarea del cronograma"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

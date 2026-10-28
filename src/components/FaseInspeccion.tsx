import { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Calendar, 
  FileCheck, 
  ShieldCheck 
} from 'lucide-react';

interface Fase {
  id: number;
  proyecto_id: number;
  tipo_fase: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface FaseInspeccionProps {
  proyecto: {
    id: number;
    nombre: string;
    cliente: string;
    fecha_creacion: string;
  };
  fases: Fase[];
  onRefresh: () => void;
}

export default function FaseInspeccion({ proyecto, fases, onRefresh }: FaseInspeccionProps) {
  const [alcance, setAlcance] = useState('Automatización y modelado de requerimientos bajo metodología FAST.');
  const [objetivos, setObjetivos] = useState('1. Definir modelo de datos\n2. Mapear procesos DFD\n3. Diseñar puestos de trabajo DCP');
  const [savedNotes, setSavedNotes] = useState(false);

  const handleUpdateFaseEstado = async (faseId: number, nuevoEstado: string) => {
    try {
      // Endpoint para actualizar estado si se requiere o simular guardado
      // En SQLite podemos enviar POST o actualizar
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = () => {
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de Resumen Ejecutivo de la Fase 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Fase 1: Inspección Preliminar</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Alcance y Definición Inicial del Proyecto
            </h2>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Fase Metodológica Activa</span>
          </div>
        </div>

        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Proyecto</span>
            <div className="text-sm font-bold text-white mt-0.5">{proyecto.nombre}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Cliente / Organización</span>
            <div className="text-sm font-bold text-white mt-0.5">{proyecto.cliente}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Fecha de Inicio</span>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">{proyecto.fecha_creacion}</div>
          </div>
        </div>
      </div>

      {/* Matriz de Fases del Ciclo de Vida FAST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Estado del Ciclo de Vida FAST
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisión de avance metodológico registrado en la base de datos local SQLite.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Fase Metodológica</th>
                <th className="py-2.5 px-3">Descripción en FAST</th>
                <th className="py-2.5 px-3">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fases.map((fase) => (
                <tr key={fase.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {fase.tipo_fase}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {fase.tipo_fase.includes('Inspección') && 'Evaluación del problema, viabilidad y recopilación de antecedentes.'}
                    {fase.tipo_fase.includes('Estudio') && 'Modelado detallado del sistema actual mediante DER, DFD y DCP.'}
                    {fase.tipo_fase.includes('Definición') && 'Identificación de requerimientos de información y diccionario de datos.'}
                    {!fase.tipo_fase.includes('Inspección') && !fase.tipo_fase.includes('Estudio') && !fase.tipo_fase.includes('Definición') && 'Fase complementaria de diseño y construcción.'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                        fase.estado === 'Completada'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : fase.estado === 'En Progreso'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {fase.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de Objetivos y Alcance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Declaración de Alcance
          </h4>
          <textarea
            value={alcance}
            onChange={(e) => setAlcance(e.target.value)}
            rows={4}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Objetivos Clave de la Inspección
          </h4>
          <textarea
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
            rows={4}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
}

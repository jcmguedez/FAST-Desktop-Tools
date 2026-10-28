import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import FaseInspeccion from './FaseInspeccion';
import GestionEntidades, { Entidad } from './GestionEntidades';
import GestionProcesos from './GestionProcesos';
import GestionPuestos from './GestionPuestos';
import GeneradorDiagramas from './GeneradorDiagramas';
import DiccionarioDatos from './DiccionarioDatos';
import { 
  ArrowLeft, 
  Layers, 
  Database, 
  Workflow, 
  Users, 
  FileText, 
  Sparkles, 
  Code2, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Check,
  Copy,
  FolderGit2
} from 'lucide-react';

interface Fase {
  id: number;
  proyecto_id: number;
  tipo_fase: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface Proceso {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
  numero_proceso: string;
}

interface FlujoDato {
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

interface Puesto {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
}

interface ConexionPuesto {
  id: number;
  tipo_conexion: string;
  puesto_origen_id: number;
  puesto_destino_id: number;
  puesto_origen_nombre?: string;
  puesto_destino_nombre?: string;
}

type WorkspaceTab = 
  | 'fase1-inspeccion'
  | 'fase2-erd'
  | 'fase2-dfd'
  | 'fase2-dcp'
  | 'fase3-diccionario'
  | 'fase3-diagramas'
  | 'sql-ddl';

export default function Workspace() {
  const { currentProject, selectProject } = useProject();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('fase1-inspeccion');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Estado consolidado del proyecto activo
  const [fases, setFases] = useState<Fase[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [flujos, setFlujos] = useState<FlujoDato[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [conexiones, setConexiones] = useState<ConexionPuesto[]>([]);

  const projectId = currentProject?.id;

  const loadAllProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsRefreshing(true);
      const [resFases, resEntidades, resProcesos, resFlujos, resPuestos, resConexiones] = await Promise.all([
        fetch(`/api/fases/${projectId}`).then((r) => r.json()),
        fetch(`/api/entidades/${projectId}`).then((r) => r.json()),
        fetch(`/api/procesos/${projectId}`).then((r) => r.json()),
        fetch(`/api/flujos_datos/${projectId}`).then((r) => r.json()),
        fetch(`/api/puestos/${projectId}`).then((r) => r.json()),
        fetch(`/api/conexiones_puestos/${projectId}`).then((r) => r.json())
      ]);

      setFases(resFases || []);
      setEntidades(resEntidades || []);
      setProcesos(resProcesos || []);
      setFlujos(resFlujos || []);
      setPuestos(resPuestos || []);
      setConexiones(resConexiones || []);
    } catch (err) {
      console.error('Error al sincronizar datos del proyecto en Workspace:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAllProjectData();
  }, [loadAllProjectData]);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <FolderGit2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ningún proyecto seleccionado</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Selecciona un proyecto desde el panel de proyectos para comenzar a trabajar en las fases metodológicas FAST.
        </p>
        <button
          onClick={() => selectProject(null)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const copySQL = async () => {
    const sql = `-- ESQUEMA RELACIONAL FAST EN SQLITE (database.db)
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  tipo_fase TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atributos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entidad_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  tipo_dato TEXT NOT NULL DEFAULT 'VARCHAR(100)',
  es_clave_primaria INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS procesos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  numero_proceso TEXT NOT NULL,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flujos_datos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proceso_origen_id INTEGER,
  proceso_destino_id INTEGER,
  entidad_id INTEGER,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (proceso_origen_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (proceso_destino_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conexiones_puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puesto_origen_id INTEGER NOT NULL,
  puesto_destino_id INTEGER NOT NULL,
  tipo_conexion TEXT NOT NULL DEFAULT 'Documental',
  FOREIGN KEY (puesto_origen_id) REFERENCES puestos(id) ON DELETE CASCADE,
  FOREIGN KEY (puesto_destino_id) REFERENCES puestos(id) ON DELETE CASCADE
);`;
    await navigator.clipboard.writeText(sql);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      {/* Top Bar seguimento Top Bar Contract */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => selectProject(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs"
              title="Volver a la selección de proyectos"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Dashboard</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                  {currentProject.nombre}
                </h1>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                  #{currentProject.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  {currentProject.cliente}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {currentProject.fecha_creacion}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQLite Conectado: <code className="text-indigo-300 font-mono">database.db</code></span>
            </div>

            <button
              onClick={loadAllProjectData}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Layout de Trabajo: Sidebar FAST + Área de Trabajo */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* ========================================================= */}
        {/* SIDEBAR METODOLÓGICO FAST */}
        {/* ========================================================= */}
        <aside className="w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-5 sticky top-20">
            <div className="border-b border-slate-800/80 pb-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold mb-1">
                METODOLOGÍA FAST
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Whitten, Bentley & Barlow: Fases Guiadas de Análisis y Diseño
              </p>
            </div>

            {/* FASE 1: INSPECCIÓN PRELIMINAR */}
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Fase 1: Inspección Preliminar
              </div>
              <button
                onClick={() => setActiveTab('fase1-inspeccion')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase1-inspeccion'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Resumen del Proyecto</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">FAST-1</span>
              </button>
            </div>

            {/* FASE 2: ESTUDIO DEL SISTEMA */}
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Fase 2: Estudio del Sistema
              </div>

              <button
                onClick={() => setActiveTab('fase2-erd')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase2-erd'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>Entidades y Atributos (ERD)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-300">
                  {entidades.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('fase2-dfd')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase2-dfd'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 shrink-0" />
                  <span>Procesos y Flujos (DFD)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-300">
                  {procesos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('fase2-dcp')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase2-dcp'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Puestos y Conexiones (DCP)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-300">
                  {puestos.length}
                </span>
              </button>
            </div>

            {/* FASE 3: DEFINICIÓN DE NECESIDADES */}
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Fase 3: Definición de Necesidades
              </div>

              <button
                onClick={() => setActiveTab('fase3-diccionario')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase3-diccionario'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Diccionario y Exportación PDF</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">FAST-3</span>
              </button>

              <button
                onClick={() => setActiveTab('fase3-diagramas')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'fase3-diagramas'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>Diagramas Mermaid</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">ERD·DFD·DCP</span>
              </button>
            </div>

            {/* ANEXOS & ARQUITECTURA */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Base de Datos y Motor
              </div>
              <button
                onClick={() => setActiveTab('sql-ddl')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'sql-ddl'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0" />
                <span>Esquema SQLite DDL</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* ÁREA CENTRAL DE TRABAJO */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0">
          {/* FASE 1: INSPECCIÓN PRELIMINAR */}
          {activeTab === 'fase1-inspeccion' && (
            <FaseInspeccion
              proyecto={currentProject}
              fases={fases}
              onRefresh={loadAllProjectData}
            />
          )}

          {/* FASE 2: GESTIÓN DE ENTIDADES Y ATRIBUTOS (ERD) */}
          {activeTab === 'fase2-erd' && (
            <GestionEntidades
              proyecto_id={currentProject.id}
              proyectoNombre={currentProject.nombre}
              onDataChange={loadAllProjectData}
            />
          )}

          {/* FASE 2: GESTIÓN DE PROCESOS Y FLUJOS (DFD) */}
          {activeTab === 'fase2-dfd' && (
            <GestionProcesos
              proyecto_id={currentProject.id}
              proyectoNombre={currentProject.nombre}
              onDataChange={loadAllProjectData}
            />
          )}

          {/* FASE 2: GESTIÓN DE PUESTOS Y CONEXIONES (DCP) */}
          {activeTab === 'fase2-dcp' && (
            <GestionPuestos
              proyecto_id={currentProject.id}
              proyectoNombre={currentProject.nombre}
              onDataChange={loadAllProjectData}
            />
          )}

          {/* FASE 3: DICCIONARIO DE DATOS Y EXPORTACIÓN PDF */}
          {activeTab === 'fase3-diccionario' && (
            <DiccionarioDatos
              proyecto={currentProject}
              fases={fases}
              entidades={entidades}
              procesos={procesos}
              flujos={flujos}
              puestos={puestos}
              conexiones={conexiones}
              onPhaseUpdate={loadAllProjectData}
            />
          )}

          {/* FASE 3: GENERADOR DE DIAGRAMAS MERMAID */}
          {activeTab === 'fase3-diagramas' && (
            <GeneradorDiagramas
              proyectoId={currentProject.id}
              proyectoNombre={currentProject.nombre}
              entidades={entidades}
              procesos={procesos}
              flujos={flujos}
              puestos={puestos}
              conexiones={conexiones}
            />
          )}

          {/* DDL SQLITE */}
          {activeTab === 'sql-ddl' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    Esquema SQLite DDL de la Metodología FAST
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ejecutado automáticamente en <code className="text-indigo-300 font-mono">database.db</code> al iniciar la aplicación.
                  </p>
                </div>
                <button
                  onClick={copySQL}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSQL ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar DDL</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-6 bg-slate-950 font-mono text-xs text-indigo-200 overflow-x-auto max-h-[600px]">
                <pre>{`-- ESQUEMA COMPLETO FAST EN SQLITE (database.db)
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Proyectos
CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fases FAST
CREATE TABLE IF NOT EXISTS fases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  tipo_fase TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 3. Entidades (ERD)
CREATE TABLE IF NOT EXISTS entidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 4. Atributos (ERD)
CREATE TABLE IF NOT EXISTS atributos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entidad_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  tipo_dato TEXT NOT NULL DEFAULT 'VARCHAR(100)',
  es_clave_primaria INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

-- 5. Procesos (DFD)
CREATE TABLE IF NOT EXISTS procesos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  numero_proceso TEXT NOT NULL,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 6. Flujos de Datos (DFD)
CREATE TABLE IF NOT EXISTS flujos_datos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proceso_origen_id INTEGER,
  proceso_destino_id INTEGER,
  entidad_id INTEGER,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (proceso_origen_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (proceso_destino_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

-- 7. Puestos de Trabajo (DCP)
CREATE TABLE IF NOT EXISTS puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 8. Conexiones entre Puestos (DCP)
CREATE TABLE IF NOT EXISTS conexiones_puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puesto_origen_id INTEGER NOT NULL,
  puesto_destino_id INTEGER NOT NULL,
  tipo_conexion TEXT NOT NULL DEFAULT 'Documental',
  FOREIGN KEY (puesto_origen_id) REFERENCES puestos(id) ON DELETE CASCADE,
  FOREIGN KEY (puesto_destino_id) REFERENCES puestos(id) ON DELETE CASCADE
);`}</pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

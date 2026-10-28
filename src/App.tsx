import { useState, useEffect } from 'react';
import GestionEntidades, { Entidad } from './components/GestionEntidades';
import GeneradorDiagramas from './components/GeneradorDiagramas';
import DiccionarioDatos from './components/DiccionarioDatos';
import { 
  Database, 
  FolderGit2, 
  Layers, 
  Workflow, 
  Users, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Code2, 
  Check, 
  Copy, 
  Plus 
} from 'lucide-react';

interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  fecha_creacion: string;
}

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

export default function App() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'erd' | 'diagramas' | 'diccionario' | 'dfd' | 'dcp' | 'fases' | 'proyectos' | 'sql'>('erd');
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Datos del proyecto activo
  const [fases, setFases] = useState<Fase[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [flujos, setFlujos] = useState<FlujoDato[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [conexiones, setConexiones] = useState<ConexionPuesto[]>([]);

  // Formularios
  const [nombreProceso, setNombreProceso] = useState('');
  const [descProceso, setDescProceso] = useState('');
  const [numProceso, setNumProceso] = useState('1.0');

  const [nombrePuesto, setNombrePuesto] = useState('');
  const [descPuesto, setDescPuesto] = useState('');

  const [nuevoNombreProyecto, setNuevoNombreProyecto] = useState('');
  const [nuevoClienteProyecto, setNuevoClienteProyecto] = useState('');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Cargar proyectos
  const loadProyectos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proyectos');
      const data: Proyecto[] = await res.json();
      setProyectos(data);
      if (data.length > 0 && !selectedProyectoId) {
        setSelectedProyectoId(data[0].id);
      }
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProyectos();
  }, []);

  // 2. Cargar todos los datos del proyecto activo
  const loadFullProjectData = async (pid: number) => {
    try {
      const [resFases, resEntidades, resProcesos, resFlujos, resPuestos, resConexiones] = await Promise.all([
        fetch(`/api/fases/${pid}`).then((r) => r.json()),
        fetch(`/api/entidades/${pid}`).then((r) => r.json()),
        fetch(`/api/procesos/${pid}`).then((r) => r.json()),
        fetch(`/api/flujos_datos/${pid}`).then((r) => r.json()),
        fetch(`/api/puestos/${pid}`).then((r) => r.json()),
        fetch(`/api/conexiones_puestos/${pid}`).then((r) => r.json())
      ]);

      setFases(resFases || []);
      setEntidades(resEntidades || []);
      setProcesos(resProcesos || []);
      setFlujos(resFlujos || []);
      setPuestos(resPuestos || []);
      setConexiones(resConexiones || []);
    } catch (err) {
      console.error('Error al cargar datos del proyecto:', err);
    }
  };

  useEffect(() => {
    if (selectedProyectoId) {
      loadFullProjectData(selectedProyectoId);
    }
  }, [selectedProyectoId]);

  // Manejador: Crear Proyecto
  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreProyecto.trim() || !nuevoClienteProyecto.trim()) return;

    try {
      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombreProyecto.trim(), cliente: nuevoClienteProyecto.trim() })
      });
      const nuevo = await res.json();
      notify(`Proyecto "${nuevo.nombre}" creado exitosamente.`);
      setNuevoNombreProyecto('');
      setNuevoClienteProyecto('');
      await loadProyectos();
      setSelectedProyectoId(nuevo.id);
    } catch (err) {
      console.error(err);
      notify('Error al crear el proyecto');
    }
  };

  // Manejador: Crear Proceso
  const handleCrearProceso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProyectoId || !nombreProceso.trim()) return;

    try {
      const res = await fetch('/api/procesos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id: selectedProyectoId,
          nombre: nombreProceso.trim(),
          descripcion: descProceso.trim() || null,
          numero_proceso: numProceso.trim()
        })
      });
      if (res.ok) {
        notify(`Proceso "${numProceso} ${nombreProceso}" guardado`);
        setNombreProceso('');
        setDescProceso('');
        setNumProceso(`${(parseFloat(numProceso) + 1).toFixed(1)}`);
        loadFullProjectData(selectedProyectoId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manejador: Crear Puesto
  const handleCrearPuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProyectoId || !nombrePuesto.trim()) return;

    try {
      const res = await fetch('/api/puestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto_id: selectedProyectoId,
          nombre: nombrePuesto.trim(),
          descripcion: descPuesto.trim() || null
        })
      });
      if (res.ok) {
        notify(`Puesto "${nombrePuesto}" registrado`);
        setNombrePuesto('');
        setDescPuesto('');
        loadFullProjectData(selectedProyectoId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copySQL = async () => {
    const sql = `-- ESQUEMA COMPLETO FAST EN SQLITE (database.db)
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

  const proyectoActual = proyectos.find((p) => p.id === selectedProyectoId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      {/* Top Bar seguimento Top Bar Contract: 3 zonas */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zona 1: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              F
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                FAST Desktop Tool · Studio
              </span>
            </div>
          </div>

          {/* Zona 2: Selector de Proyecto Activo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Proyecto Activo:</span>
            <select
              value={selectedProyectoId || ''}
              onChange={(e) => setSelectedProyectoId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.nombre} ({p.cliente})
                </option>
              ))}
            </select>
          </div>

          {/* Zona 3: Botón de sincronización */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                loadProyectos();
                if (selectedProyectoId) loadFullProjectData(selectedProyectoId);
              }}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar SQLite</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Cabecera y Barra de Pestañas del Workbench */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {proyectoActual ? proyectoActual.nombre : 'FAST Desktop Tool'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Cliente: <strong className="text-slate-200">{proyectoActual?.cliente || 'Sin cliente'}</strong> · Base de datos SQLite: <code className="text-indigo-300 font-mono">database.db</code>
              </p>
            </div>

            {/* Pestañas de Navegación del Sistema FAST */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('erd')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'erd' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Entidades y Atributos (ERD)</span>
              </button>

              <button
                onClick={() => setActiveTab('diagramas')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'diagramas' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Diagramas Mermaid.js</span>
              </button>

              <button
                onClick={() => setActiveTab('diccionario')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'diccionario' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Diccionario de Datos (.MD)</span>
              </button>

              <button
                onClick={() => setActiveTab('dfd')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dfd' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>DFD Procesos ({procesos.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('dcp')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dcp' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>DCP Puestos ({puestos.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('fases')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'fases' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Fases ({fases.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('proyectos')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'proyectos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Proyectos ({proyectos.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('sql')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>SQL DDL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificación global */}
        {notification && (
          <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 1: GESTIÓN DE ENTIDADES Y ATRIBUTOS (ERD) */}
        {/* ======================================================== */}
        {activeTab === 'erd' && (
          selectedProyectoId ? (
            <GestionEntidades 
              proyecto_id={selectedProyectoId} 
              proyectoNombre={proyectoActual?.nombre} 
              onDataChange={() => {
                if (selectedProyectoId) loadFullProjectData(selectedProyectoId);
              }}
            />
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
              Crea o selecciona un proyecto para registrar entidades y atributos.
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: GENERADOR AUTOMÁTICO DE DIAGRAMAS MERMAID */}
        {/* ======================================================== */}
        {activeTab === 'diagramas' && selectedProyectoId && (
          <GeneradorDiagramas
            proyectoId={selectedProyectoId}
            proyectoNombre={proyectoActual?.nombre}
            entidades={entidades}
            procesos={procesos}
            flujos={flujos}
            puestos={puestos}
            conexiones={conexiones}
          />
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: DICCIONARIO DE DATOS Y PROCESOS */}
        {/* ======================================================== */}
        {activeTab === 'diccionario' && proyectoActual && (
          <DiccionarioDatos
            proyecto={proyectoActual}
            fases={fases}
            entidades={entidades}
            procesos={procesos}
            flujos={flujos}
            puestos={puestos}
            conexiones={conexiones}
          />
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: PROCESOS Y FLUJOS DFD */}
        {/* ======================================================== */}
        {activeTab === 'dfd' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Nuevo Proceso (DFD)
              </h3>
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
                    <label className="block text-[11px] text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nombreProceso}
                      onChange={(e) => setNombreProceso(e.target.value)}
                      placeholder="Ej. Facturar Orden"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Descripción</label>
                  <textarea
                    value={descProceso}
                    onChange={(e) => setDescProceso(e.target.value)}
                    rows={2}
                    placeholder="Lógica de transformación"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition cursor-pointer"
                >
                  Guardar Proceso
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Procesos Registrados ({procesos.length})
                </h3>
                {procesos.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin procesos en este proyecto.</p>
                ) : (
                  <div className="space-y-2">
                    {procesos.map((proc) => (
                      <div
                        key={proc.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-start justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                            {proc.numero_proceso}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{proc.nombre}</h4>
                            {proc.descripcion && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{proc.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flujos de datos */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Flujos de Datos ({flujos.length})
                </h3>
                {flujos.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay flujos de datos interconectados.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {flujos.map((flujo) => (
                      <div
                        key={flujo.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-mono">
                            {flujo.proceso_origen_num || 'Origen'} ➔ {flujo.proceso_destino_num || 'Destino'}
                          </span>
                          <span className="text-slate-300 font-medium">{flujo.descripcion}</span>
                        </div>
                        {flujo.entidad_nombre && (
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Entidad: {flujo.entidad_nombre}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 5: PUESTOS Y CONEXIONES DCP */}
        {/* ======================================================== */}
        {activeTab === 'dcp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Nuevo Puesto (DCP)
              </h3>
              <form onSubmit={handleCrearPuesto} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre del Puesto</label>
                  <input
                    type="text"
                    value={nombrePuesto}
                    onChange={(e) => setNombrePuesto(e.target.value)}
                    placeholder="Ej. Operador de Bodega"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Descripción</label>
                  <textarea
                    value={descPuesto}
                    onChange={(e) => setDescPuesto(e.target.value)}
                    rows={2}
                    placeholder="Funciones y tareas"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition cursor-pointer"
                >
                  Guardar Puesto
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Puestos Registrados ({puestos.length})
                </h3>
                {puestos.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin puestos registrados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {puestos.map((puesto) => (
                      <div key={puesto.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <h4 className="text-xs font-bold text-white">{puesto.nombre}</h4>
                        </div>
                        {puesto.descripcion && (
                          <p className="text-[11px] text-slate-400">{puesto.descripcion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conexiones */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Canales de Comunicación entre Puestos ({conexiones.length})
                </h3>
                {conexiones.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin conexiones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {conexiones.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{c.puesto_origen_nombre}</span>
                          <span className="text-indigo-400">➔</span>
                          <span className="font-medium text-slate-200">{c.puesto_destino_nombre}</span>
                        </div>
                        <span className="text-[11px] text-indigo-300 font-mono bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                          {c.tipo_conexion}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 6: FASES FAST */}
        {/* ======================================================== */}
        {activeTab === 'fases' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Ciclo de Vida de Metodología FAST
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Fase</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Fecha Inicio</th>
                    <th className="py-2.5 px-3">Fecha Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {fases.map((fase) => (
                    <tr key={fase.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{fase.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{fase.tipo_fase}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            fase.estado === 'Completada'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : fase.estado === 'En Progreso'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {fase.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{fase.fecha_inicio || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{fase.fecha_fin || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 7: PROYECTOS */}
        {/* ======================================================== */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Registrar Nuevo Proyecto
              </h3>
              <form onSubmit={handleCrearProyecto} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nuevoNombreProyecto}
                    onChange={(e) => setNuevoNombreProyecto(e.target.value)}
                    placeholder="Ej. Sistema Logístico Integral"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={nuevoClienteProyecto}
                    onChange={(e) => setNuevoClienteProyecto(e.target.value)}
                    placeholder="Ej. Acme Global"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition cursor-pointer"
                >
                  Guardar Proyecto
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Listado de Proyectos
              </h3>
              {proyectos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProyectoId(p.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    selectedProyectoId === p.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100 text-xs">{p.nombre}</div>
                    <div className="text-[11px] text-slate-500">Cliente: {p.cliente} · ID #{p.id}</div>
                  </div>
                  {selectedProyectoId === p.id && (
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-medium">
                      Activo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 8: SQL DDL */}
        {/* ======================================================== */}
        {activeTab === 'sql' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Esquema SQLite DDL de la Metodología FAST
                </h3>
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
            <div className="p-6 bg-slate-950 font-mono text-xs text-indigo-200 overflow-x-auto max-h-[500px]">
              <pre>{`-- 8 Tablas Relacionales SQLite
1. proyectos (id, nombre, cliente, fecha_creacion)
2. fases (id, proyecto_id, tipo_fase, estado, fecha_inicio, fecha_fin)
3. entidades (id, proyecto_id, nombre, descripcion)
4. atributos (id, entidad_id, nombre, tipo_dato, es_clave_primaria)
5. procesos (id, proyecto_id, nombre, descripcion, numero_proceso)
6. flujos_datos (id, proceso_origen_id, proceso_destino_id, entidad_id, descripcion)
7. puestos (id, proyecto_id, nombre, descripcion)
8. conexiones_puestos (id, puesto_origen_id, puesto_destino_id, tipo_conexion)`}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

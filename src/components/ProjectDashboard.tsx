import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Layers, 
  Database, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Calendar, 
  User, 
  ShieldCheck 
} from 'lucide-react';

export default function ProjectDashboard() {
  const { proyectos, selectProject, createProject, deleteProject, loading, refreshProjects } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cliente.trim()) return;

    try {
      setIsSubmitting(true);
      const nuevo = await createProject(nombre, cliente);
      notify(`Proyecto "${nuevo.nombre}" creado exitosamente.`);
      setNombre('');
      setCliente('');
      setIsModalOpen(false);
      // Navegar automáticamente al nuevo proyecto
      selectProject(nuevo.id);
    } catch (err) {
      console.error(err);
      notify('Error al registrar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nombreProyecto: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar "${nombreProyecto}" y todos sus artefactos FAST?`)) {
      try {
        await deleteProject(id);
        notify(`Proyecto "${nombreProyecto}" eliminado.`);
      } catch (err) {
        console.error(err);
        notify('Error al eliminar proyecto.');
      }
    }
  };

  const handleCreateDemo = async () => {
    try {
      const demoProjects = [
        { nombre: 'Sistema de Gestión Hospitalaria', cliente: 'Clínica San Rafael' },
        { nombre: 'Plataforma de Logística y Envíos', cliente: 'FastTrans Global' },
        { nombre: 'Portal de Facturación Electrónica', cliente: 'Financiera Futuro' }
      ];
      const randomDemo = demoProjects[Math.floor(Math.random() * demoProjects.length)];
      const nuevo = await createProject(randomDemo.nombre, randomDemo.cliente);
      notify(`Proyecto demo "${nuevo.nombre}" generado.`);
      selectProject(nuevo.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      {/* Top Bar seguimento Top Bar Contract */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-lg">
              F
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                FAST Desktop Tool
              </h1>
              <p className="text-[11px] text-slate-400">
                Asistente de Análisis y Diseño de Sistemas (Whitten, Bentley & Barlow)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Proyecto Demo Rápido</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition rounded-lg shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Notificación flotante */}
        {notification && (
          <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Hero Banner del Dashboard */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono font-medium">
              <span>Framework for the Application of Systems Thinking</span>
              <span>·</span>
              <span>100% Standalone SQLite</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido al Asistente Guiado de FAST
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Diseña la arquitectura de información de tus proyectos mediante las tres fases metodológicas: <strong>Inspección Preliminar</strong>, <strong>Estudio del Sistema</strong> (DER, DFD, DCP) y <strong>Definición de Necesidades</strong> con generación automática de diagramas y diccionario.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Base de Datos Local: <strong className="text-slate-200 font-mono">database.db</strong></span>
            </div>
            <div>·</div>
            <div><span>Total Proyectos: <strong className="text-slate-200">{proyectos.length}</strong></span></div>
            <div>·</div>
            <div><span>Privacidad Absoluta: <strong className="text-slate-200">Sin servidores en la nube</strong></span></div>
          </div>
        </div>

        {/* Listado de Proyectos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Tus Proyectos Activos</h3>
              <p className="text-xs text-slate-400">
                Selecciona un proyecto para abrir su espacio de trabajo interactivo.
              </p>
            </div>

            <button
              onClick={() => refreshProjects()}
              className="text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Actualizar lista
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Cargando proyectos desde SQLite...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No tienes proyectos registrados</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Crea tu primer proyecto para comenzar a modelar entidades, procesos y diagramas con la metodología FAST.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Proyecto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  onClick={() => selectProject(proyecto.id)}
                  className="bg-slate-900 border border-slate-800/90 hover:border-indigo-500/80 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => handleDelete(proyecto.id, proyecto.nombre, e)}
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg transition cursor-pointer"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                        {proyecto.nombre}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cliente: <strong className="text-slate-300">{proyecto.cliente}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{proyecto.fecha_creacion.split(' ')[0]}</span>
                    </div>

                    <span className="text-indigo-400 group-hover:text-indigo-300 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Abrir Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Crear Nuevo Proyecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Nuevo Proyecto FAST</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sistema Logístico y Despachos"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cliente u Organización
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ej. Distribuidora Central S.A."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear y Comenzar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

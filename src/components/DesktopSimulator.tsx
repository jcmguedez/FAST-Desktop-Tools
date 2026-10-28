import { useState } from 'react'
import { Terminal, Database, Play, Trash2, CheckCircle2, ArrowRightLeft, Layers, RefreshCw } from 'lucide-react'

export interface MockProyecto {
  id: number
  nombre: string
  cliente: string
  fecha_creacion: string
}

export interface IpcLog {
  id: string
  time: string
  channel: string
  direction: 'Renderer ➔ Main' | 'Main ➔ Renderer'
  payload: any
  result?: any
}

export function DesktopSimulator() {
  const [activeTab, setActiveTab] = useState<'preview' | 'ipc-inspector' | 'sql-schema'>('preview')
  
  // Simulated SQLite state in local storage/memory
  const [proyectos, setProyectos] = useState<MockProyecto[]>([
    {
      id: 1,
      nombre: 'Rediseño Portal Corporativo',
      cliente: 'Acme Corp',
      fecha_creacion: '2026-10-27 10:15:30'
    },
    {
      id: 2,
      nombre: 'Migración Cloud ERP',
      cliente: 'Stark Logistics',
      fecha_creacion: '2026-10-27 11:42:10'
    }
  ])

  const [nombre, setNombre] = useState('')
  const [cliente, setCliente] = useState('')
  const [notification, setNotification] = useState<string | null>(null)
  const [ipcLogs, setIpcLogs] = useState<IpcLog[]>([
    {
      id: 'log-1',
      time: '10:15:30',
      channel: 'db:get-proyectos',
      direction: 'Renderer ➔ Main',
      payload: {},
      result: '[2 proyectos devueltos de better-sqlite3]'
    }
  ])

  const addIpcLog = (channel: string, direction: 'Renderer ➔ Main' | 'Main ➔ Renderer', payload: any, result?: any) => {
    const newLog: IpcLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      channel,
      direction,
      payload,
      result
    }
    setIpcLogs(prev => [newLog, ...prev.slice(0, 24)])
  }

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Simulated Test Button (as requested in requirement 5)
  const handleTestButton = () => {
    const testCases = [
      { nombre: 'Auditoría FAST Desktop', cliente: 'Fintech Solutions' },
      { nombre: 'App IoT Smart Factory', cliente: 'Tesla Supplier' },
      { nombre: 'Microservicio Ciberseguridad', cliente: 'Global Bank' },
      { nombre: 'Dashboard de Telemetría', cliente: 'Orbit Aerospace' }
    ]
    const chosen = testCases[Math.floor(Math.random() * testCases.length)]
    
    // Log IPC invoke
    addIpcLog('db:create-proyecto', 'Renderer ➔ Main', chosen)
    
    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    const nextId = proyectos.length > 0 ? Math.max(...proyectos.map(p => p.id)) + 1 : 1
    const nuevoProyecto: MockProyecto = {
      id: nextId,
      nombre: chosen.nombre,
      cliente: chosen.cliente,
      fecha_creacion: formattedDate
    }

    setProyectos(prev => [nuevoProyecto, ...prev])
    addIpcLog('db:create-proyecto', 'Main ➔ Renderer', { success: true, id: nextId }, 'INSERT INTO proyectos OK')
    showToast(`Proyecto de prueba creado: "${chosen.nombre}"`)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !cliente.trim()) return

    const item = { nombre: nombre.trim(), cliente: cliente.trim() }
    addIpcLog('db:create-proyecto', 'Renderer ➔ Main', item)

    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    const nextId = proyectos.length > 0 ? Math.max(...proyectos.map(p => p.id)) + 1 : 1
    const nuevo: MockProyecto = {
      id: nextId,
      nombre: item.nombre,
      cliente: item.cliente,
      fecha_creacion: formattedDate
    }

    setProyectos(prev => [nuevo, ...prev])
    addIpcLog('db:create-proyecto', 'Main ➔ Renderer', { success: true, id: nextId })
    showToast('Proyecto registrado correctamente en SQLite')
    setNombre('')
    setCliente('')
  }

  const handleDelete = (id: number) => {
    addIpcLog('db:delete-proyecto', 'Renderer ➔ Main', { id })
    setProyectos(prev => prev.filter(p => p.id !== id))
    addIpcLog('db:delete-proyecto', 'Main ➔ Renderer', { success: true })
    showToast(`Proyecto #${id} eliminado de SQLite`)
  }

  const handleReload = () => {
    addIpcLog('db:get-proyectos', 'Renderer ➔ Main', {})
    addIpcLog('db:get-proyectos', 'Main ➔ Renderer', { count: proyectos.length })
    showToast('Datos sincronizados con better-sqlite3')
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Window Titlebar (Simulated Electron Desktop Window) */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {/* macOS traffic light window controls */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block hover:opacity-100 transition" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block hover:opacity-100 transition" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block hover:opacity-100 transition" />
          </div>
          <span className="text-xs font-medium text-slate-300 font-mono tracking-tight">
            FAST Desktop Tool — Electron 34.2.0 (Chromium 132 / Node 22)
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'preview'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista de la Aplicación
          </button>
          <button
            onClick={() => setActiveTab('ipc-inspector')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'ipc-inspector'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Monitor IPC ({ipcLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('sql-schema')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'sql-schema'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            SQLite & Esquema
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'preview' && (
        <div className="bg-slate-950 p-6 min-h-[500px]">
          {/* Header del renderer tal como se programó en App.tsx */}
          <div className="border-b border-slate-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-lg">
                F
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                  FAST Desktop Tool
                </h1>
                <p className="text-xs text-slate-400">
                  Renderer (React 19 + Tailwind CSS) comunicando vía IPC seguro a better-sqlite3
                </p>
              </div>
            </div>

            {/* Test button as requested in Requirement #5 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestButton}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-lg shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Botón de prueba (Crear Registro Rápido)
              </button>
            </div>
          </div>

          {/* Database Path notification */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[11px]">Ruta SQLite (Standalone):</span>
              <code className="text-indigo-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                app.getPath('userData')/fast_desktop.db
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>better-sqlite3 v11.8 (WAL Mode)</span>
              <span>·</span>
              <span>contextBridge IPC Activo</span>
            </div>
          </div>

          {/* Toast feedback */}
          {notification && (
            <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg mb-6 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Two column layout: Add Project + Projects Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Registrar Nuevo Proyecto
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Envía parámetros mediante <code className="text-indigo-400">window.api.createProyecto()</code>
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Auditoría de Redes"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Cliente o Empresa
                  </label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ej. Santander Tech"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition active:scale-98 cursor-pointer"
                >
                  Guardar en SQLite
                </button>
              </form>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Proyectos en Base de Datos Local
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tabla: <code className="text-slate-400 font-mono">proyectos</code> ({proyectos.length} registros)
                  </p>
                </div>
                <button
                  onClick={handleReload}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Recargar
                </button>
              </div>

              {proyectos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No hay proyectos almacenados en la base de datos SQLite.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Fecha de Creación</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {proyectos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500">#{p.id}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">{p.nombre}</td>
                          <td className="py-2.5 px-3 text-slate-400">{p.cliente}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{p.fecha_creacion}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-rose-400 hover:text-rose-300 hover:underline text-xs flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IPC Inspector Tab */}
      {activeTab === 'ipc-inspector' && (
        <div className="bg-slate-950 p-6 min-h-[500px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Registro de Tráfico Inter-Process Communication (IPC)
              </h3>
              <p className="text-xs text-slate-400">
                Observa las llamadas <code className="text-indigo-300 font-mono">ipcRenderer.invoke()</code> y los manejadores <code className="text-emerald-300 font-mono">ipcMain.handle()</code> en tiempo real.
              </p>
            </div>
            <button
              onClick={() => setIpcLogs([])}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
            >
              Limpiar Logs
            </button>
          </div>

          <div className="space-y-2">
            {ipcLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{log.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    log.direction.includes('Renderer')
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  }`}>
                    {log.direction}
                  </span>
                  <span className="text-indigo-400 font-medium">channel: "{log.channel}"</span>
                </div>
                <div className="text-slate-400 text-[11px] overflow-hidden text-ellipsis max-w-md">
                  Payload: <span className="text-slate-200">{JSON.stringify(log.payload)}</span>
                  {log.result && <span className="ml-2 text-emerald-400">➔ {JSON.stringify(log.result)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL Schema Tab */}
      {activeTab === 'sql-schema' && (
        <div className="bg-slate-950 p-6 min-h-[500px]">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">
              Esquema de Base de Datos SQLite (Requerimiento #6)
            </h3>
            <p className="text-xs text-slate-400">
              Este script se ejecuta automáticamente en el arranque de la app desde <code className="text-indigo-400">src/main/index.ts</code> usando <code className="text-slate-300">db.exec(...)</code>.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200 mb-6 overflow-x-auto">
            <pre className="leading-relaxed">
{`-- Script ejecutado al iniciar Electron (initDatabaseSchema en src/main/index.ts)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente);`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Manejo de Rutas Standalone (AppData / UserData)
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Al usar <code className="text-indigo-300">app.getPath('userData')</code>, la base de datos se guarda en el directorio reservado del sistema operativo para datos de usuario:
              </p>
              <ul className="mt-2 space-y-1 text-slate-400 font-mono text-[11px]">
                <li>• <strong>Windows:</strong> %APPDATA%\fast-desktop-tool\fast_desktop.db</li>
                <li>• <strong>macOS:</strong> ~/Library/Application Support/fast-desktop-tool/fast_desktop.db</li>
                <li>• <strong>Linux:</strong> ~/.config/fast-desktop-tool/fast_desktop.db</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Rendimiento y Transaccionalidad
              </h4>
              <p className="text-slate-400 leading-relaxed">
                <code className="text-slate-300">better-sqlite3</code> es sincrónico en el proceso Main, lo que garantiza latencias inferiores a 1ms sin sobrecarga de red o sockets. Las sentencias preparadas (<code className="text-indigo-300">db.prepare(...)</code>) protegen contra inyecciones SQL.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { ArrowDown, Database, Cpu, Monitor, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react'

export function ArchitectureViewer() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Arquitectura de Seguridad e IPC en FAST Desktop Tool
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Flujo de ejecución desacoplado: cómo React interactúa con SQLite sin exponer Node.js al navegador.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Layer 1: Renderer Process */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                <Monitor className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Proceso Renderer (Frontend)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Chromium Sandbox · React 19 · TypeScript · Tailwind CSS
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              src/renderer/src/App.tsx
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            La interfaz ejecuta código web normal con <code className="text-indigo-300">nodeIntegration: false</code>. Para interactuar con la base de datos, llama a funciones fuertemente tipadas en <code className="text-indigo-300 font-mono">window.api.createProyecto(item)</code>.
          </p>
        </div>

        {/* Transition arrow */}
        <div className="flex justify-center items-center text-indigo-400">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Context Isolation Barrier
            </span>
            <ArrowDown className="w-4 h-4 text-indigo-500 animate-bounce" />
          </div>
        </div>

        {/* Layer 2: Preload Script */}
        <div className="bg-slate-950 border border-indigo-900/40 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Preload Script (Puente Seguro)
                </h3>
                <p className="text-[11px] text-slate-400">
                  contextBridge.exposeInMainWorld('api', &#123; ... &#125;)
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded text-indigo-300 font-mono">
              src/preload/index.ts
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Actúa como aduana de seguridad. Traduce las invocaciones de TypeScript del renderer en mensajes de IPC binarios <code className="text-indigo-300 font-mono">ipcRenderer.invoke('db:channel', data)</code>. Nunca expone el objeto <code className="text-rose-400 font-mono">require()</code> ni APIs nativas completas.
          </p>
        </div>

        {/* Transition arrow */}
        <div className="flex justify-center items-center text-indigo-400">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              IPC Bus (Inter-Process Communication)
            </span>
            <ArrowDown className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {/* Layer 3: Main Process */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <Cpu className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Proceso Principal (Main)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Node.js Runtime · better-sqlite3 · BrowserWindow Management
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              src/main/index.ts
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Escucha en <code className="text-emerald-300 font-mono">ipcMain.handle('db:create-proyecto')</code>, valida los datos recibidos y ejecuta sentencias preparadas sincrónicas (<code className="text-emerald-300 font-mono">db.prepare(...).run(...)</code>) sin riesgo de SQL injection ni sobrecarga de red.
          </p>
        </div>

        {/* Transition arrow */}
        <div className="flex justify-center items-center text-indigo-400">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Escritura a Disco Local
            </span>
            <ArrowDown className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {/* Layer 4: Storage */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
                <HardDrive className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Almacenamiento Standalone (AppData / UserData)
                </h3>
                <p className="text-[11px] text-slate-400">
                  SQLite Single File · WAL (Write-Ahead Logging) Journal
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded text-amber-300 font-mono">
              fast_desktop.db
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Resuelto automáticamente con <code className="text-amber-300 font-mono">app.getPath('userData')</code>. Los datos persisten entre actualizaciones del software, desinstaladores estándar y múltiples reinicios sin requerir servidores externos o contenedores Docker.
          </p>
        </div>
      </div>
    </div>
  )
}

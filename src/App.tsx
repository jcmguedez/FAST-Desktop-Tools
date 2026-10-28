import { useState } from 'react'
import { DesktopSimulator } from './components/DesktopSimulator'
import { CodeExplorer } from './components/CodeExplorer'
import { TerminalGuide } from './components/TerminalGuide'
import { ArchitectureViewer } from './components/ArchitectureViewer'
import { downloadBoilerplateZip } from './utils/zipGenerator'
import { Download, Terminal, Code2, Monitor, Network, CheckCircle, Sparkles, FolderDown } from 'lucide-react'

export default function App() {
  const [activeSection, setActiveSection] = useState<'simulator' | 'code' | 'commands' | 'architecture'>('simulator')
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await downloadBoilerplateZip()
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (e) {
      console.error('Error al generar ZIP:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      {/* Top Bar following Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              F
            </div>
            <a href="#" className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              FAST Desktop Tool
            </a>
          </div>

          {/* Zone 2: 4-5 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => setActiveSection('simulator')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'simulator' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Simulador & UI
            </button>
            <button
              onClick={() => setActiveSection('code')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'code' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Código Fuente Generado
            </button>
            <button
              onClick={() => setActiveSection('commands')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'commands' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Comandos de Instalación
            </button>
            <button
              onClick={() => setActiveSection('architecture')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'architecture' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Arquitectura e IPC
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>¡ZIP Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading ? 'Empaquetando...' : 'Descargar Boilerplate ZIP'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Electron 34</span>
            <span aria-hidden="true">·</span>
            <span>electron-vite 2.3</span>
            <span aria-hidden="true">·</span>
            <span>React 19 + TypeScript</span>
            <span aria-hidden="true">·</span>
            <span>better-sqlite3</span>
            <span aria-hidden="true">·</span>
            <span>Tailwind CSS</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
            Boilerplate Profesional para FAST Desktop Tool
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Arquitectura standalone para aplicaciones de escritorio de alto rendimiento. Utiliza <strong>IPC nativo con contextBridge</strong> (sin Express.js) para comunicar la interfaz de usuario en React con una base de datos local SQLite ubicada en el directorio de usuario (AppData / UserData).
          </p>

          {/* Feature Grid / Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => setActiveSection('simulator')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                activeSection === 'simulator'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4 shrink-0 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Simulador en Vivo</div>
                <div className="text-[11px] text-slate-500">Prueba UI, botón y tabla</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('code')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                activeSection === 'code'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Archivos Generados</div>
                <div className="text-[11px] text-slate-500">electron.vite, main, preload</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('commands')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                activeSection === 'commands'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4 shrink-0 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Comandos Terminal</div>
                <div className="text-[11px] text-slate-500">Pasos exactos y npm install</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('architecture')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                activeSection === 'architecture'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Network className="w-4 h-4 shrink-0 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Flujo de Arquitectura</div>
                <div className="text-[11px] text-slate-500">Capas de seguridad contextBridge</div>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Section Display */}
        {activeSection === 'simulator' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Simulador de FAST Desktop Tool (Renderer + IPC + SQLite)
                </h2>
                <p className="text-xs text-slate-400">
                  Prueba la pantalla requerida (<code className="text-slate-300">src/renderer/src/App.tsx</code>), pulsa el botón de prueba para registrar proyectos y analiza el tráfico IPC.
                </p>
              </div>
              <button
                onClick={() => setActiveSection('code')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
              >
                Ver código fuente de este componente ➔
              </button>
            </div>
            <DesktopSimulator />
          </section>
        )}

        {activeSection === 'code' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Código Fuente Completo de los Archivos del Proyecto
                </h2>
                <p className="text-xs text-slate-400">
                  Generado con TypeScript estricto, externalización de dependencias nativas y tipados globales en <code className="text-slate-300">window.api</code>.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5"
              >
                <FolderDown className="w-3.5 h-3.5" />
                Descargar todos los archivos en .ZIP
              </button>
            </div>
            <CodeExplorer />
          </section>
        )}

        {activeSection === 'commands' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Guía de Terminal y Configuración de Dependencias
              </h2>
              <p className="text-xs text-slate-400">
                Instrucciones paso a paso para inicializar desde una carpeta raíz vacía y evitar el error común de compilación ABI de C++.
              </p>
            </div>
            <TerminalGuide />
          </section>
        )}

        {activeSection === 'architecture' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Modelo de Seguridad y Pipeline de Datos
              </h2>
              <p className="text-xs text-slate-400">
                Por qué usar IPC nativo con contextBridge en lugar de un servidor Express.js interno.
              </p>
            </div>
            <ArchitectureViewer />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>FAST Desktop Tool</span>
            <span aria-hidden="true">·</span>
            <span>Boilerplate para Electron + Vite + React + SQLite</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Standalone Storage: <code className="text-slate-300">app.getPath('userData')</code></span>
            <span aria-hidden="true">·</span>
            <span>Zero Express Overhead</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { useState } from 'react'
import { BOILERPLATE_FILES, ProjectFile } from '../data/boilerplateFiles'
import { Copy, Check, FileCode, Folder, Search, ShieldCheck, Cpu } from 'lucide-react'

export function CodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(BOILERPLATE_FILES[1]) // Default to electron.vite.config.ts or main
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')

  const filteredFiles = BOILERPLATE_FILES.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.path.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Error al copiar al portapapeles:', e)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            Explorador de Archivos del Boilerplate
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estructura de código fuente generada con buenas prácticas de seguridad e IPC.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar archivo..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Sidebar: File Tree */}
        <div className="md:col-span-4 lg:col-span-3 border-r border-slate-800 bg-slate-950/60 p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" />
            Estructura del Proyecto
          </div>

          <div className="space-y-0.5 overflow-y-auto max-h-[520px]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="truncate flex items-center gap-2">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] uppercase font-sans text-slate-600 group-hover:text-slate-400 shrink-0">
                    {file.category}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Code Content */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-slate-950">
          {/* File Meta bar */}
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-white">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedFile.highlightLang}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          {/* Architecture insight banner for specific critical files */}
          {selectedFile.path === 'electron.vite.config.ts' && (
            <div className="bg-amber-950/30 border-b border-amber-900/40 px-5 py-2 text-xs text-amber-200/90 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Regla de Oro:</strong> <code className="text-amber-300 font-mono">external: ['better-sqlite3']</code> es indispensable. Sin esto, Vite empaqueta los archivos binarios C++ y Electron arrojará error de inicialización de Node Addon.
              </span>
            </div>
          )}

          {selectedFile.path === 'src/preload/index.ts' && (
            <div className="bg-emerald-950/30 border-b border-emerald-900/40 px-5 py-2 text-xs text-emerald-200/90 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Seguridad ContextBridge:</strong> Exponemos únicamente funciones tipadas específicas a <code className="text-emerald-300 font-mono">window.api</code>, previniendo que código malicioso o XSS acceda directamente a Node.js o al sistema de archivos.
              </span>
            </div>
          )}

          {/* Code Viewer */}
          <div className="flex-1 p-5 overflow-auto max-h-[500px] font-mono text-xs leading-relaxed text-slate-300 bg-slate-950">
            <pre className="whitespace-pre overflow-x-auto selection:bg-indigo-600/40">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

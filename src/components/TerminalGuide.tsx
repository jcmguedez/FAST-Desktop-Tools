import { useState } from 'react'
import { Terminal, Copy, Check, AlertTriangle, ShieldCheck, HardDrive, PackageCheck } from 'lucide-react'

export function TerminalGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const commands = [
    {
      title: 'Opción A: Inicialización Oficial Ultrarrápida (Recomendada)',
      description: 'Scaffolding con el asistente oficial de electron-vite para React + TypeScript en la raíz vacía:',
      cmd: `# 1. Inicializar la plantilla electron-vite con React y TypeScript en la carpeta actual (.)
npm create @quick-start/electron@latest . -- --template react-ts

# 2. Instalar better-sqlite3 como dependencia de producción
npm install better-sqlite3

# 3. Instalar tipos y utilidades de desarrollo (incluyendo electron-builder para rebuild nativo)
npm install -D @types/better-sqlite3 electron-builder

# 4. Configurar Tailwind CSS en el renderer
npm install -D tailwindcss @tailwindcss/vite

# 5. Recompilar better-sqlite3 para el ABI de Electron (¡Paso fundamental!)
npx electron-builder install-app-deps

# 6. Iniciar en modo desarrollo
npm run dev`
    },
    {
      title: 'Opción B: Instalación Manual Comando por Comando',
      description: 'Si prefieres armar el proyecto desde un package.json vacío sin interactividad:',
      cmd: `# 1. Iniciar package.json en blanco
npm init -y

# 2. Instalar dependencias de producción (Motor de base de datos)
npm install better-sqlite3

# 3. Instalar herramientas de Electron, Vite, React y TypeScript
npm install -D electron electron-vite vite @vitejs/plugin-react react react-dom @types/react @types/react-dom typescript @types/node

# 4. Instalar Tailwind CSS y tipos de SQLite
npm install -D tailwindcss @tailwindcss/vite @types/better-sqlite3 @electron-toolkit/utils @electron-toolkit/preload electron-builder

# 5. Compilar los binarios C++ de better-sqlite3 contra la versión de Electron
npx electron-builder install-app-deps`
    }
  ]

  return (
    <div className="space-y-6">
      {/* Comandos de Inicialización */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">
            Comandos de Terminal para Inicializar el Proyecto
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Ejecuta estos comandos en tu terminal estando dentro de la carpeta raíz vacía de tu repositorio.
        </p>

        <div className="space-y-6">
          {commands.map((c, idx) => (
            <div key={idx} className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">{c.title}</h3>
                  <p className="text-[11px] text-slate-500">{c.description}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(c.cmd, idx)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Bloque</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
                <pre>{c.cmd}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explicación de dependencias y trampas comunes de Senior Developer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Native module C++ rebuild warning */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-slate-200">
            Recompilación C++ (better-sqlite3)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            <code className="text-amber-300">better-sqlite3</code> contiene código C++ compilado. Node.js y Electron utilizan diferentes <strong>Application Binary Interfaces (ABI)</strong>. Si no ejecutas <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">npx electron-builder install-app-deps</code>, la aplicación lanzará un error tipo <em>"NODE_MODULE_VERSION mismatch"</em> al abrir la ventana.
          </p>
        </div>

        {/* Standalone UserData path */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-2">
            <HardDrive className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-slate-200">
            Ruta Standalone (AppData / UserData)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nunca guardes <code className="text-indigo-300">database.sqlite</code> en la ruta relativa del proyecto (<code className="text-slate-200">./database.db</code>). En producción, los ejecutables se instalan en directorios protegidos de solo lectura (<code className="text-slate-400">Program Files</code>). Usar <code className="text-indigo-300">app.getPath('userData')</code> garantiza permisos de escritura autónomos para el usuario actual.
          </p>
        </div>

        {/* Security contextBridge vs nodeIntegration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-slate-200">
            IPC Nativo vs Express.js
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Levantar un servidor Express.js interno dentro de Electron consume puertos locales, expone vulnerabilidades en la red y añade overhead innecesario. El canal nativo <code className="text-emerald-300">ipcMain.handle / ipcRenderer.invoke</code> usa memoria compartida dentro del mismo proceso del sistema operativo con latencia cero.
          </p>
        </div>
      </div>
    </div>
  )
}

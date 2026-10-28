export interface ProjectFile {
  path: string
  name: string
  category: 'config' | 'main' | 'preload' | 'renderer' | 'types'
  description: string
  content: string
  highlightLang: string
}

export const BOILERPLATE_FILES: ProjectFile[] = [
  {
    path: 'package.json',
    name: 'package.json',
    category: 'config',
    description: 'Manifiesto de dependencias de Electron, Vite, better-sqlite3 y scripts de compilación.',
    highlightLang: 'json',
    content: `{
  "name": "fast-desktop-tool",
  "version": "1.0.0",
  "description": "FAST Desktop Tool - Aplicación de escritorio moderna con Electron, Vite, React y SQLite",
  "main": "./out/main/index.js",
  "author": "FAST Team",
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint . --ext .js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json --composite false",
    "typecheck": "npm run typecheck:node && npm run typecheck:web",
    "start": "electron-vite preview",
    "dev": "electron-vite dev",
    "build": "npm run typecheck && electron-vite build",
    "postinstall": "electron-builder install-app-deps",
    "build:unpack": "npm run build && electron-builder --dir",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.13.0",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "electron": "^34.2.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.3.0",
    "lucide-react": "^0.475.0",
    "postcss": "^8.5.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}`
  },
  {
    path: 'electron.vite.config.ts',
    name: 'electron.vite.config.ts',
    category: 'config',
    description: 'Configuración de electron-vite. Externaliza better-sqlite3 para cargar los binarios nativos C++.',
    highlightLang: 'typescript',
    content: `import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // CRUCIAL: better-sqlite3 es un módulo nativo C++.
        // No debe ser empaquetado por Vite, sino resuelto por Node en runtime.
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})`
  },
  {
    path: 'src/main/index.ts',
    name: 'src/main/index.ts',
    category: 'main',
    description: 'Punto de entrada de Electron. Inicializa SQLite en AppData/UserData, ejecuta el esquema SQL y expone IPC.',
    highlightLang: 'typescript',
    content: `import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import Database from 'better-sqlite3'

// 1. Configuración de persistencia Standalone en UserData (AppData/Roaming en Windows)
const userDataPath = app.getPath('userData')
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true })
}

const dbPath = join(userDataPath, 'fast_desktop.db')
console.log('[SQLite] Base de datos ubicada en:', dbPath)

// Inicializar conexión con better-sqlite3
const db = new Database(dbPath)

// Optimizar rendimiento de SQLite con Write-Ahead Logging
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 2. Script SQL de arranque: creación de la tabla proyectos
const initDatabaseSchema = (): void => {
  const schemaSQL = \`
    CREATE TABLE IF NOT EXISTS proyectos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      cliente TEXT NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente);
  \`
  db.exec(schemaSQL)
  console.log('[SQLite] Esquema de base de datos verificado y listo.')
}

// 3. Registrar Canales IPC seguros para la comunicación Renderer <-> Main
const registerIpcHandlers = (): void => {
  // Obtener todos los proyectos
  ipcMain.handle('db:get-proyectos', async () => {
    try {
      const stmt = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos ORDER BY id DESC')
      return stmt.all()
    } catch (error) {
      console.error('[IPC Error] db:get-proyectos:', error)
      throw error
    }
  })

  // Crear un nuevo proyecto
  ipcMain.handle('db:create-proyecto', async (_event, data: { nombre: string; cliente: string }) => {
    try {
      if (!data.nombre || !data.cliente) {
        throw new Error('El nombre del proyecto y el cliente son obligatorios.')
      }
      const stmt = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)')
      const info = stmt.run(data.nombre.trim(), data.cliente.trim())
      return { success: true, id: info.lastInsertRowid }
    } catch (error) {
      console.error('[IPC Error] db:create-proyecto:', error)
      throw error
    }
  })

  // Eliminar un proyecto por ID
  ipcMain.handle('db:delete-proyecto', async (_event, id: number) => {
    try {
      const stmt = db.prepare('DELETE FROM proyectos WHERE id = ?')
      const info = stmt.run(id)
      return { success: info.changes > 0 }
    } catch (error) {
      console.error('[IPC Error] db:delete-proyecto:', error)
      throw error
    }
  })

  // Obtener información del entorno y de la base de datos
  ipcMain.handle('db:get-info', async () => {
    return {
      dbPath,
      userDataPath,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron
    }
  })
}

// 4. Creación y gestión de la ventana de Electron
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'FAST Desktop Tool',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true, // Seguridad estricta
      nodeIntegration: false  // Sin acceso directo de Node en Renderer
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Cargar URL en desarrollo (Vite) o archivo index.html en producción
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 5. Ciclo de vida de la aplicación
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.fast.desktoptool')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Inicializar base de datos y registrar IPC
  initDatabaseSchema()
  registerIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // Cerrar conexión limpia con SQLite al salir
  try {
    db.close()
    console.log('[SQLite] Conexión cerrada limpiamente.')
  } catch (e) {
    console.error('[SQLite] Error al cerrar BD:', e)
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})`
  },
  {
    path: 'src/preload/index.ts',
    name: 'src/preload/index.ts',
    category: 'preload',
    description: 'Preload script seguro. Usa contextBridge para exponer la API de base de datos a window.api.',
    highlightLang: 'typescript',
    content: `import { contextBridge, ipcRenderer } from 'electron'

// Estructura de un Proyecto devuelto por SQLite
export interface Proyecto {
  id: number
  nombre: string
  cliente: string
  fecha_creacion: string
}

export interface AppInfo {
  dbPath: string
  userDataPath: string
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
}

export interface IElectronAPI {
  getProyectos: () => Promise<Proyecto[]>
  createProyecto: (proyecto: { nombre: string; cliente: string }) => Promise<{ success: boolean; id: number | bigint }>
  deleteProyecto: (id: number) => Promise<{ success: boolean }>
  getAppInfo: () => Promise<AppInfo>
}

// Objeto API expuesto al Renderer de manera segura
const api: IElectronAPI = {
  getProyectos: () => ipcRenderer.invoke('db:get-proyectos'),
  createProyecto: (data) => ipcRenderer.invoke('db:create-proyecto', data),
  deleteProyecto: (id) => ipcRenderer.invoke('db:delete-proyecto', id),
  getAppInfo: () => ipcRenderer.invoke('db:get-info')
}

// Exponer en el contexto global (window.api)
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload] Falló contextBridge.exposeInMainWorld:', error)
  }
} else {
  // @ts-ignore (fallback para contextos no aislados)
  window.api = api
}`
  },
  {
    path: 'src/preload/index.d.ts',
    name: 'src/preload/index.d.ts',
    category: 'types',
    description: 'Tipado TypeScript para window.api en el proceso Renderer.',
    highlightLang: 'typescript',
    content: `import { IElectronAPI } from './index'

declare global {
  interface Window {
    api: IElectronAPI
  }
}

export {}`
  },
  {
    path: 'src/renderer/src/App.tsx',
    name: 'src/renderer/src/App.tsx',
    category: 'renderer',
    description: 'Interfaz de usuario moderna con Tailwind CSS, formulario de proyecto y botón de prueba.',
    highlightLang: 'typescript',
    content: `import { useState, useEffect } from 'react'

interface Proyecto {
  id: number
  nombre: string
  cliente: string
  fecha_creacion: string
}

interface AppInfo {
  dbPath: string
  userDataPath: string
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
}

export default function App(): JSX.Element {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [nombre, setNombre] = useState<string>('')
  const [cliente, setCliente] = useState<string>('')
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Cargar proyectos e información al montar
  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      if (window.api) {
        const [listaProyectos, info] = await Promise.all([
          window.api.getProyectos(),
          window.api.getAppInfo()
        ])
        setProyectos(listaProyectos)
        setAppInfo(info)
      }
    } catch (error) {
      console.error('Error al cargar datos de SQLite:', error)
      showNotification('Error al consultar SQLite')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showNotification = (msg: string): void => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // Manejador para el botón de prueba rápido
  const handleTestButton = async (): Promise<void> => {
    const testCases = [
      { nombre: 'Rediseño Portal Corporativo', cliente: 'Acme Corp' },
      { nombre: 'Migración Cloud ERP', cliente: 'Stark Logistics' },
      { nombre: 'App Móvil Fintech', cliente: 'Banco Futuro' },
      { nombre: 'Auditoría de Seguridad FAST', cliente: 'Innova Tech' }
    ]
    const item = testCases[Math.floor(Math.random() * testCases.length)]
    
    try {
      if (window.api) {
        await window.api.createProyecto(item)
        showNotification(\`Proyecto de prueba creado: "\${item.nombre}"\`)
        await loadData()
      }
    } catch (error) {
      console.error('Error al insertar proyecto de prueba:', error)
      showNotification('Error en IPC al crear proyecto de prueba')
    }
  }

  // Manejador para formulario manual
  const handleCreateProject = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!nombre.trim() || !cliente.trim()) return

    try {
      if (window.api) {
        await window.api.createProyecto({ nombre, cliente })
        showNotification('Proyecto registrado exitosamente')
        setNombre('')
        setCliente('')
        await loadData()
      }
    } catch (error) {
      console.error('Error al crear proyecto:', error)
      showNotification('No se pudo guardar el proyecto')
    }
  }

  // Manejador para eliminar
  const handleDelete = async (id: number): Promise<void> => {
    try {
      if (window.api) {
        await window.api.deleteProyecto(id)
        showNotification('Proyecto eliminado')
        await loadData()
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Barra superior estilo Desktop Window */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            F
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">
              FAST Desktop Tool
            </h1>
            <p className="text-xs text-slate-400">
              Electron + React + TypeScript + better-sqlite3
            </p>
          </div>
        </div>

        {/* Botón de prueba solicitado */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestButton}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition rounded-lg shadow-sm shadow-indigo-600/40 cursor-pointer"
          >
            Botón de prueba (Crear Registro Rápido)
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Banner informativo de SQLite Standalone */}
        {appInfo && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 uppercase tracking-wider font-semibold mr-2">Base de Datos:</span>
              <code className="text-indigo-300 font-mono text-[11px] break-all">{appInfo.dbPath}</code>
            </div>
            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <span>Plataforma: <strong className="text-slate-200">{appInfo.platform}</strong></span>
              <span>·</span>
              <span>Electron: <strong className="text-slate-200">{appInfo.electronVersion}</strong></span>
            </div>
          </div>
        )}

        {/* Notificación flotante */}
        {notification && (
          <div className="bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2 rounded-lg">
            {notification}
          </div>
        )}

        {/* Sección Formulario + Resumen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">
              Registrar Nuevo Proyecto
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Rediseño Web Corporativa"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
                  placeholder="Ej. Acme Global Solutions"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-medium text-white rounded-lg transition"
              >
                Guardar en SQLite
              </button>
            </form>
          </div>

          {/* Tabla de Proyectos (SQLite IPC Result) */}
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
                onClick={loadData}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Consultando SQLite a través de IPC...
              </div>
            ) : proyectos.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No hay proyectos en la base de datos. Haz clic en "Botón de prueba" para crear uno.
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
                            className="text-rose-400 hover:text-rose-300 hover:underline text-xs"
                          >
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
      </main>
    </div>
  )
}`
  },
  {
    path: 'src/renderer/src/main.tsx',
    name: 'src/renderer/src/main.tsx',
    category: 'renderer',
    description: 'Punto de entrada de React en el renderer.',
    highlightLang: 'typescript',
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
  },
  {
    path: 'src/renderer/src/assets/main.css',
    name: 'src/renderer/src/assets/main.css',
    category: 'renderer',
    description: 'Estilos globales y directivas de Tailwind CSS.',
    highlightLang: 'css',
    content: `@import "tailwindcss";

@layer base {
  body {
    user-select: none;
    -webkit-user-select: none;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
}`
  },
  {
    path: 'src/renderer/index.html',
    name: 'src/renderer/index.html',
    category: 'renderer',
    description: 'Archivo HTML del proceso renderer de Electron con Política de Seguridad de Contenido (CSP).',
    highlightLang: 'html',
    content: `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>FAST Desktop Tool</title>
    <!-- CSP estricto para mitigar riesgos de seguridad -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  {
    path: 'tsconfig.json',
    name: 'tsconfig.json',
    category: 'config',
    description: 'Configuración principal de TypeScript para el proyecto completo.',
    highlightLang: 'json',
    content: `{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "./tsconfig.web.json"
    }
  ]
}`
  },
  {
    path: 'tsconfig.node.json',
    name: 'tsconfig.node.json',
    category: 'config',
    description: 'Configuración TypeScript para los procesos Main y Preload (Node.js runtime).',
    highlightLang: 'json',
    content: `{
  "compilerOptions": {
    "composite": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": [
    "electron.vite.config.*",
    "src/main/**/*",
    "src/preload/**/*"
  ]
}`
  },
  {
    path: 'tsconfig.web.json',
    name: 'tsconfig.web.json',
    category: 'config',
    description: 'Configuración TypeScript para el proceso Renderer (React DOM).',
    highlightLang: 'json',
    content: `{
  "compilerOptions": {
    "composite": true,
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@renderer/*": ["src/renderer/src/*"]
    }
  },
  "include": [
    "src/renderer/src/**/*",
    "src/preload/index.d.ts"
  ]
}`
  }
]

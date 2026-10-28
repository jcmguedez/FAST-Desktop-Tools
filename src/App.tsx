import { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Play, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  fecha_creacion: string;
}

interface ServerInfo {
  status: string;
  database: string;
  table: string;
  engine: string;
  uptime: number;
}

export default function App() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Formulario manual
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Diagnóstico del servidor
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  // Visor de archivos de la arquitectura
  const [activeTab, setActiveTab] = useState<'app' | 'files' | 'architecture'>('app');
  const [selectedFileKey, setSelectedFileKey] = useState<'server' | 'package' | 'vite' | 'app'>('server');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Cargar proyectos desde el backend en Express (GET /api/proyectos)
  const fetchProyectos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/proyectos');
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
      }
      const data: Proyecto[] = await res.json();
      setProyectos(data);
    } catch (err: any) {
      console.error('Error al cargar proyectos de la API:', err);
      setError('No se pudo conectar con el backend en Express (/api/proyectos).');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estado de la base de datos
  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const info = await res.json();
        setServerInfo(info);
      }
    } catch {
      // Ignorar si el endpoint info no está presente
    }
  };

  useEffect(() => {
    fetchProyectos();
    checkServerHealth();
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 2. Función del botón "Crear Registro Rápido" (POST /api/proyectos con datos de prueba)
  const handleCrearRegistroRapido = async () => {
    try {
      setIsSubmitting(true);
      // Lista de ejemplos variados para prueba rápida
      const sampleNames = ['Proyecto de Prueba', 'Migración Cloud 2026', 'Auditoría Fintech', 'App Móvil React'];
      const sampleClients = ['Cliente Test', 'Acme Corp', 'Stark Logistics', 'Banco Futuro'];
      const randomIndex = Math.floor(Math.random() * sampleNames.length);

      const payload = {
        nombre: sampleNames[randomIndex],
        cliente: sampleClients[randomIndex]
      };

      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear proyecto en la base de datos');
      }

      notify(`Registro rápido creado: "${payload.nombre}" (${payload.cliente})`);
      // Recargar la lista desde la base de datos SQLite
      await fetchProyectos();
    } catch (err: any) {
      console.error('Error al insertar registro rápido:', err);
      notify(err.message || 'Error en la petición POST a /api/proyectos');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Crear proyecto mediante el formulario manual
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cliente.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: nombre.trim(), cliente: cliente.trim() })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar el proyecto');
      }

      notify('Proyecto guardado correctamente en database.db');
      setNombre('');
      setCliente('');
      await fetchProyectos();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      notify(err.message || 'Error al conectar con la API');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Eliminar proyecto
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/proyectos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('No se pudo eliminar');
      }
      notify(`Proyecto #${id} eliminado`);
      await fetchProyectos();
    } catch (err) {
      console.error('Error al eliminar:', err);
      notify('Error al eliminar el proyecto');
    }
  };

  const copyCode = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Archivos generados para visualización directa
  const filesContent = {
    server: {
      path: 'server.js',
      description: 'Servidor Express corriendo en el puerto 3000, con CORS, conexión a database.db y endpoints de proyectos.',
      code: `import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());

// Conexión a la base de datos local SQLite
const db = new Database('database.db');
db.pragma('journal_mode = WAL');

// Creación automática de la tabla proyectos
const createTableSQL = \`
CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`;
db.exec(createTableSQL);
console.log('✅ Base de datos SQLite lista. Tabla "proyectos" verificada.');

// Endpoint GET /api/proyectos
app.get('/api/proyectos', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos ORDER BY id DESC');
    const proyectos = stmt.all();
    res.json(proyectos);
  } catch (error) {
    console.error('Error al consultar proyectos:', error);
    res.status(500).json({ error: 'Error al consultar proyectos' });
  }
});

// Endpoint POST /api/proyectos
app.post('/api/proyectos', (req, res) => {
  try {
    const { nombre, cliente } = req.body;

    if (!nombre || !cliente) {
      return res.status(400).json({ error: 'Los campos "nombre" y "cliente" son obligatorios.' });
    }

    const stmt = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
    const info = stmt.run(nombre.trim(), cliente.trim());

    const nuevoProyecto = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevoProyecto);
  } catch (error) {
    console.error('Error al insertar proyecto:', error);
    res.status(500).json({ error: 'Error al registrar el proyecto' });
  }
});

// Endpoint DELETE /api/proyectos/:id (opcional)
app.delete('/api/proyectos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM proyectos WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({ success: true, message: \`Proyecto #\${id} eliminado\` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(\`🚀 Servidor Express ejecutándose en http://localhost:\${PORT}\`);
});`
    },
    package: {
      path: 'package.json',
      description: 'Manifiesto con express, cors, better-sqlite3 y script concurrent para correr frontend y backend.',
      code: `{
  "name": "fast-web-tool",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "server": "node server.js",
    "dev:front": "vite",
    "dev": "concurrently \\"npm run server\\" \\"npm run dev:front\\"",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/better-sqlite3": "^7.6.12",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.13.0",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^9.1.2",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}`
    },
    vite: {
      path: 'vite.config.ts',
      description: 'Configuración de Vite con puerto 5173 y proxy para redirigir /api a http://localhost:3000.',
      code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Redirige todas las llamadas /api al backend Express en el puerto 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});`
    },
    app: {
      path: 'src/App.tsx',
      description: 'Componente React con useEffect para GET /api/proyectos y botón "Crear Registro Rápido" con POST.',
      code: `import { useState, useEffect } from 'react';

interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  fecha_creacion: string;
}

export default function App() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar proyectos reales de la base de datos SQLite vía backend
  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proyectos');
      const data = await res.json();
      setProyectos(data);
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  // 2. Botón Crear Registro Rápido
  const handleCrearRegistroRapido = async () => {
    try {
      await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Proyecto de Prueba',
          cliente: 'Cliente Test'
        })
      });
      // Recargar la lista
      await fetchProyectos();
    } catch (err) {
      console.error('Error al crear registro rápido:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">FAST Web Tool</h1>
        <button
          onClick={handleCrearRegistroRapido}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition"
        >
          Crear Registro Rápido
        </button>
      </header>

      {/* Tabla de proyectos */}
      <main>
        {loading ? (
          <p className="text-xs text-slate-400">Cargando proyectos desde Express...</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2">ID</th>
                <th className="py-2">Nombre</th>
                <th className="py-2">Cliente</th>
                <th className="py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className="py-2 font-mono">#{p.id}</td>
                  <td className="py-2">{p.nombre}</td>
                  <td className="py-2">{p.cliente}</td>
                  <td className="py-2 font-mono">{p.fecha_creacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}`
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      {/* Top Bar seguimento Top Bar Contract */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              F
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                FAST App Web Local
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => setActiveTab('app')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'app' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Aplicación en Vivo
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'files' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Archivos Generados
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'architecture' ? 'text-indigo-400 font-semibold' : ''
              }`}
            >
              Arquitectura Express + Vite Proxy
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCrearRegistroRapido}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Crear Registro Rápido</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner de arquitectura en tiempo real */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Node.js Express (Puerto 3000)</span>
            <span aria-hidden="true">·</span>
            <span>Vite React Proxy (Puerto 5173)</span>
            <span aria-hidden="true">·</span>
            <span>SQLite better-sqlite3 (database.db)</span>
            <span aria-hidden="true">·</span>
            <span>Tailwind CSS</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white text-balance">
                Gestor de Proyectos con Backend Express y SQLite
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Esta interfaz consume en vivo los endpoints <code className="text-indigo-300 font-mono">GET /api/proyectos</code> y <code className="text-indigo-300 font-mono">POST /api/proyectos</code> servidos por Express e inserta en la base de datos local SQLite <code className="text-indigo-300 font-mono">database.db</code>.
              </p>
            </div>

            {/* Quick status badge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs flex items-center gap-3 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-slate-200 font-medium">Backend Express Activo</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {proyectos.length} {proyectos.length === 1 ? 'registro' : 'registros'} en SQLite
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 pt-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'app'
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Vista de la Aplicación y Datos
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'files'
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Archivos del Proyecto (server.js, vite.config.ts, etc.)
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Diagrama de Flujo Proxy
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {notification && (
          <div className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Aplicación */}
        {activeTab === 'app' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario Manual de Nuevo Proyecto */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Registrar Nuevo Proyecto
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Envía una petición <code className="text-indigo-400 font-mono">POST /api/proyectos</code> al backend en Express.
                </p>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Nombre del Proyecto
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Rediseño Web Corporativa"
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
                      placeholder="Ej. Acme Global Solutions"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando en Express...' : 'Guardar en SQLite'}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Acción de Prueba Requerida
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Inserta un registro con datos de prueba preconfigurados (<code className="text-slate-400 font-mono">nombre: "Proyecto de Prueba", cliente: "Cliente Test"</code>):
                  </p>
                  <button
                    onClick={handleCrearRegistroRapido}
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Botón de Prueba (Crear Registro Rápido)
                  </button>
                </div>
              </div>

              {/* Tabla de Proyectos (SQLite Resultados) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">
                      Proyectos en Base de Datos Local
                    </h2>
                    <p className="text-xs text-slate-500">
                      Tabla: <code className="text-slate-400 font-mono">proyectos</code> en <code className="text-indigo-300 font-mono">database.db</code>
                    </p>
                  </div>
                  <button
                    onClick={fetchProyectos}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Recargar
                  </button>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Consultando GET /api/proyectos a Express...</span>
                  </div>
                ) : proyectos.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No hay proyectos en la tabla. Haz clic en "Crear Registro Rápido" para agregar uno.
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
                                className="text-rose-400 hover:text-rose-300 hover:underline text-xs flex items-center gap-1 ml-auto cursor-pointer"
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

        {/* Tab 2: Archivos Generados */}
        {activeTab === 'files' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Sub-selector de archivos */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">
                  Código Completo para tu Proyecto Local
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSelectedFileKey('server')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                    selectedFileKey === 'server' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  server.js
                </button>
                <button
                  onClick={() => setSelectedFileKey('package')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                    selectedFileKey === 'package' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  package.json
                </button>
                <button
                  onClick={() => setSelectedFileKey('vite')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                    selectedFileKey === 'vite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  vite.config.ts
                </button>
                <button
                  onClick={() => setSelectedFileKey('app')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition ${
                    selectedFileKey === 'app' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  src/App.tsx
                </button>
              </div>
            </div>

            {/* Encabezado del archivo seleccionado */}
            <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-semibold text-indigo-300">
                  Ubicación: /{filesContent[selectedFileKey].path}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filesContent[selectedFileKey].description}
                </p>
              </div>

              <button
                onClick={() => copyCode(filesContent[selectedFileKey].code, selectedFileKey)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === selectedFileKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Archivo</span>
                  </>
                )}
              </button>
            </div>

            {/* Visor de código */}
            <div className="p-6 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
              <pre>
                <code>{filesContent[selectedFileKey].code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Arquitectura y Explicación del Proxy */}
        {activeTab === 'architecture' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                Cómo Funciona la Arquitectura Local (Express :3000 + Vite :5173)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Separación limpia de responsabilidades entre el servidor de desarrollo del frontend y el servidor de API.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Server className="w-4 h-4" />
                  <span>1. Frontend React (Puerto 5173)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  El cliente ejecuta <code className="text-indigo-300 font-mono">fetch('/api/proyectos')</code> sin especificar el dominio. Como la URL es relativa, el navegador hace la petición a <code className="text-slate-300 font-mono">http://localhost:5173/api/proyectos</code>.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>2. Proxy de Vite</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  En <code className="text-amber-300 font-mono">vite.config.ts</code>, la regla <code className="text-amber-300 font-mono">proxy: &#123; '/api': 'http://localhost:3000' &#125;</code> intercepta el tráfico y lo redirige en segundo plano al backend sin problemas de CORS en desarrollo.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Database className="w-4 h-4" />
                  <span>3. Express + SQLite (Puerto 3000)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Express recibe la petición en <code className="text-emerald-300 font-mono">/api/proyectos</code>, ejecuta sentencias con <code className="text-emerald-300 font-mono">better-sqlite3</code> sobre <code className="text-slate-300 font-mono">database.db</code> y retorna JSON limpio con código 200 o 201.
                </p>
              </div>
            </div>

            {/* Comando para ejecutar ambos */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-200 mb-2">
                Comando para iniciar ambos procesos en paralelo:
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-indigo-300 flex items-center justify-between">
                <code>npm run dev</code>
                <span className="text-slate-500 text-[11px] font-sans">
                  (Ejecuta Express en :3000 y Vite en :5173 mediante concurrently)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>FAST Web Tool</span>
            <span aria-hidden="true">·</span>
            <span>React + Express + better-sqlite3 + Tailwind CSS</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Proxy: <code className="text-slate-300">/api ➔ http://localhost:3000</code></span>
            <span aria-hidden="true">·</span>
            <span>Base de datos: <code className="text-slate-300">database.db</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

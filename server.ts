import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// 1. Conexión a la base de datos local SQLite llamada database.db
const db = new Database('database.db');
db.pragma('journal_mode = WAL');

// 2. Creación automática de la tabla proyectos si no existe
const createTableSQL = `
CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
db.exec(createTableSQL);
console.log('✅ Base de datos SQLite lista. Tabla "proyectos" verificada.');

// Insertar algunos proyectos semilla si la tabla está vacía para una experiencia inicial rica
const countResult = db.prepare('SELECT COUNT(*) as count FROM proyectos').get() as { count: number };
if (countResult.count === 0) {
  const insertSeed = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
  insertSeed.run('Rediseño Portal Corporativo', 'Acme Corp');
  insertSeed.run('Migración Cloud ERP', 'Stark Logistics');
  console.log('🌱 Datos iniciales insertados en SQLite.');
}

// 3. Endpoint GET /api/proyectos
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

// 4. Endpoint POST /api/proyectos
app.post('/api/proyectos', (req, res) => {
  try {
    const { nombre, cliente } = req.body;
    if (!nombre || !cliente) {
      return res.status(400).json({ error: 'Los campos "nombre" y "cliente" son obligatorios.' });
    }

    const stmt = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
    const info = stmt.run(nombre.trim(), cliente.trim());

    const nuevo = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al registrar el proyecto' });
  }
});

// 5. Endpoint DELETE /api/proyectos/:id
app.delete('/api/proyectos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM proyectos WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({ success: true, message: `Proyecto #${id} eliminado` });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

// 6. Endpoint de diagnóstico de la API y base de datos
app.get('/api/info', (req, res) => {
  res.json({
    status: 'online',
    database: 'database.db',
    table: 'proyectos',
    engine: 'better-sqlite3',
    uptime: process.uptime()
  });
});

// 7. Integración con Vite en desarrollo o archivos estáticos en producción
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Express + Vite escuchando en el puerto ${PORT}`);
  });
}

startServer();

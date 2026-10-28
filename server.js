import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

// 1. Configuración de middlewares: CORS y parsing de JSON
app.use(cors());
app.use(express.json());

// 2. Conexión a la base de datos local SQLite llamada database.db
const db = new Database('database.db');
db.pragma('journal_mode = WAL');

// 3. Creación automática de la tabla proyectos si no existe
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

// 4. Endpoint GET /api/proyectos: devuelve todos los proyectos ordenados del más reciente al más antiguo
app.get('/api/proyectos', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos ORDER BY id DESC');
    const proyectos = stmt.all();
    res.json(proyectos);
  } catch (error) {
    console.error('Error al consultar proyectos:', error);
    res.status(500).json({ error: 'Error al consultar proyectos de la base de datos' });
  }
});

// 5. Endpoint POST /api/proyectos: recibe { nombre, cliente } y guarda un nuevo registro
app.post('/api/proyectos', (req, res) => {
  try {
    const { nombre, cliente } = req.body;

    if (!nombre || !cliente) {
      return res.status(400).json({ error: 'Los campos "nombre" y "cliente" son obligatorios.' });
    }

    const stmt = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
    const info = stmt.run(nombre.trim(), cliente.trim());

    // Obtener el registro recién insertado
    const nuevoProyecto = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos WHERE id = ?').get(info.lastInsertRowid);

    res.status(201).json(nuevoProyecto);
  } catch (error) {
    console.error('Error al insertar proyecto:', error);
    res.status(500).json({ error: 'Error al registrar el proyecto en la base de datos' });
  }
});

// Endpoint adicional para eliminar un proyecto (útil para la gestión desde el frontend)
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

// Iniciar servidor en el puerto 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express ejecutándose en http://localhost:${PORT}`);
});

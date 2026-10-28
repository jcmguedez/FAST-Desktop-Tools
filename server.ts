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

// 1. Conexión a SQLite
const db = new Database('database.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 2. Esquema SQL completo para la Metodología FAST
const schemaFAST_SQL = `
-- 1. Tabla de Proyectos
CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fases de la metodología FAST
CREATE TABLE IF NOT EXISTS fases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  tipo_fase TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 3. Entidades del Modelo Entidad-Relación (DER)
CREATE TABLE IF NOT EXISTS entidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 4. Atributos de cada Entidad
CREATE TABLE IF NOT EXISTS atributos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entidad_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  tipo_dato TEXT NOT NULL DEFAULT 'VARCHAR(100)',
  es_clave_primaria INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

-- 5. Procesos del Diagrama de Flujo de Datos (DFD)
CREATE TABLE IF NOT EXISTS procesos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  numero_proceso TEXT NOT NULL,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 6. Flujos de Datos
CREATE TABLE IF NOT EXISTS flujos_datos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proceso_origen_id INTEGER,
  proceso_destino_id INTEGER,
  entidad_id INTEGER,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (proceso_origen_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (proceso_destino_id) REFERENCES procesos(id) ON DELETE CASCADE,
  FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE
);

-- 7. Puestos de Trabajo (DCP)
CREATE TABLE IF NOT EXISTS puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 8. Conexiones entre Puestos (DCP)
CREATE TABLE IF NOT EXISTS conexiones_puestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puesto_origen_id INTEGER NOT NULL,
  puesto_destino_id INTEGER NOT NULL,
  tipo_conexion TEXT NOT NULL DEFAULT 'Documental',
  FOREIGN KEY (puesto_origen_id) REFERENCES puestos(id) ON DELETE CASCADE,
  FOREIGN KEY (puesto_destino_id) REFERENCES puestos(id) ON DELETE CASCADE
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_fases_proyecto ON fases(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_entidades_proyecto ON entidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_atributos_entidad ON atributos(entidad_id);
CREATE INDEX IF NOT EXISTS idx_procesos_proyecto ON procesos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_puestos_proyecto ON puestos(proyecto_id);
`;

db.exec(schemaFAST_SQL);
console.log('✅ Base de datos SQLite inicializada con el esquema FAST completo.');

// Semillas iniciales si la tabla de proyectos está vacía
const countProyectos = db.prepare('SELECT COUNT(*) as count FROM proyectos').get() as { count: number };
if (countProyectos.count === 0) {
  const insertP = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
  const p1 = insertP.run('Sistema de Ventas e Inventario FAST', 'Distribuidora Central');
  const pid = Number(p1.lastInsertRowid);

  // Fases FAST
  const insertF = db.prepare('INSERT INTO fases (proyecto_id, tipo_fase, estado) VALUES (?, ?, ?)');
  insertF.run(pid, 'Inspección Preliminar', 'Completada');
  insertF.run(pid, 'Estudio del Sistema', 'En Progreso');
  insertF.run(pid, 'Definición de Necesidades', 'Pendiente');

  // Entidades y Atributos
  const insertE = db.prepare('INSERT INTO entidades (proyecto_id, nombre, descripcion) VALUES (?, ?, ?)');
  const e1 = insertE.run(pid, 'Cliente', 'Persona o empresa que adquiere productos');
  const e2 = insertE.run(pid, 'Factura', 'Comprobante fiscal de la transacción comercial');

  const insertA = db.prepare('INSERT INTO atributos (entidad_id, nombre, tipo_dato, es_clave_primaria) VALUES (?, ?, ?, ?)');
  insertA.run(Number(e1.lastInsertRowid), 'id_cliente', 'INTEGER', 1);
  insertA.run(Number(e1.lastInsertRowid), 'razon_social', 'VARCHAR(150)', 0);
  insertA.run(Number(e1.lastInsertRowid), 'rfc_cuit', 'VARCHAR(20)', 0);

  insertA.run(Number(e2.lastInsertRowid), 'numero_factura', 'INTEGER', 1);
  insertA.run(Number(e2.lastInsertRowid), 'total', 'DECIMAL(10,2)', 0);
  insertA.run(Number(e2.lastInsertRowid), 'fecha_emision', 'DATETIME', 0);

  // Procesos
  const insertProc = db.prepare('INSERT INTO procesos (proyecto_id, nombre, descripcion, numero_proceso) VALUES (?, ?, ?, ?)');
  const proc1 = insertProc.run(pid, 'Verificar Disponibilidad de Stock', 'Comprueba existencia de artículos', '1.0');
  const proc2 = insertProc.run(pid, 'Generar Comprobante de Venta', 'Emite la factura y actualiza inventario', '2.0');

  // Flujo
  const insertFlujo = db.prepare('INSERT INTO flujos_datos (proceso_origen_id, proceso_destino_id, entidad_id, descripcion) VALUES (?, ?, ?, ?)');
  insertFlujo.run(Number(proc1.lastInsertRowid), Number(proc2.lastInsertRowid), Number(e2.lastInsertRowid), 'Pedido validado');

  // Puestos
  const insertPuesto = db.prepare('INSERT INTO puestos (proyecto_id, nombre, descripcion) VALUES (?, ?, ?)');
  const pst1 = insertPuesto.run(pid, 'Vendedor de Mostrador', 'Atiende al cliente y toma pedidos');
  const pst2 = insertPuesto.run(pid, 'Caja / Facturación', 'Cobra y entrega ticket fiscal');

  const insertCon = db.prepare('INSERT INTO conexiones_puestos (puesto_origen_id, puesto_destino_id, tipo_conexion) VALUES (?, ?, ?)');
  insertCon.run(Number(pst1.lastInsertRowid), Number(pst2.lastInsertRowid), 'Digital / Red POS');
}

// ==========================================
// RUTAS / ENDPOINTS DE LA API
// ==========================================

// --- PROYECTOS ---
app.get('/api/proyectos', (_req, res) => {
  try {
    const stmt = db.prepare('SELECT id, nombre, cliente, fecha_creacion FROM proyectos ORDER BY id DESC');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar proyectos' });
  }
});

app.post('/api/proyectos', (req, res) => {
  try {
    const { nombre, cliente } = req.body;
    if (!nombre || !cliente) {
      return res.status(400).json({ error: 'Nombre y cliente son obligatorios.' });
    }

    const insert = db.prepare('INSERT INTO proyectos (nombre, cliente) VALUES (?, ?)');
    const info = insert.run(nombre.trim(), cliente.trim());
    const proyectoId = Number(info.lastInsertRowid);

    // Inicializar automáticamente las fases iniciales FAST
    const insertFase = db.prepare('INSERT INTO fases (proyecto_id, tipo_fase, estado) VALUES (?, ?, ?)');
    insertFase.run(proyectoId, 'Inspección Preliminar', 'En Progreso');
    insertFase.run(proyectoId, 'Estudio del Sistema', 'Pendiente');
    insertFase.run(proyectoId, 'Definición de Necesidades', 'Pendiente');

    const nuevo = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(proyectoId);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

app.delete('/api/proyectos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM proyectos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ success: true, message: `Proyecto #${id} eliminado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

// --- FASES FAST ---
app.get('/api/fases/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const stmt = db.prepare('SELECT * FROM fases WHERE proyecto_id = ? ORDER BY id ASC');
    res.json(stmt.all(proyecto_id));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener fases' });
  }
});

app.post('/api/fases', (req, res) => {
  try {
    const { proyecto_id, tipo_fase, estado, fecha_inicio, fecha_fin } = req.body;
    if (!proyecto_id || !tipo_fase) {
      return res.status(400).json({ error: 'proyecto_id y tipo_fase son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO fases (proyecto_id, tipo_fase, estado, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(proyecto_id, tipo_fase, estado || 'Pendiente', fecha_inicio || null, fecha_fin || null);
    const nuevo = db.prepare('SELECT * FROM fases WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar fase' });
  }
});

app.put('/api/fases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_inicio, fecha_fin } = req.body;
    if (!estado) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }
    const stmt = db.prepare(`
      UPDATE fases 
      SET estado = ?, 
          fecha_inicio = COALESCE(?, fecha_inicio, CURRENT_TIMESTAMP),
          fecha_fin = COALESCE(?, fecha_fin)
      WHERE id = ?
    `);
    stmt.run(estado, fecha_inicio || null, fecha_fin || null, id);
    const updated = db.prepare('SELECT * FROM fases WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar fase' });
  }
});

// Endpoint para avanzar automáticamente la Fase 3: Definición de Necesidades al consultar el diccionario
app.get('/api/diccionario/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    db.prepare(`
      UPDATE fases 
      SET estado = 'En Progreso',
          fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP)
      WHERE proyecto_id = ? AND tipo_fase = 'Definición de Necesidades'
    `).run(proyecto_id);

    const fase = db.prepare(`
      SELECT * FROM fases 
      WHERE proyecto_id = ? AND tipo_fase = 'Definición de Necesidades'
    `).get(proyecto_id);

    res.json({ success: true, message: 'Fase Definición de Necesidades en progreso', fase });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar fase de necesidades' });
  }
});

// Endpoint para registrar la exportación a PDF y actualizar la fase
app.post('/api/diccionario/:proyecto_id/exportar-pdf', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    db.prepare(`
      UPDATE fases 
      SET estado = 'En Progreso',
          fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP)
      WHERE proyecto_id = ? AND tipo_fase = 'Definición de Necesidades'
    `).run(proyecto_id);

    const fase = db.prepare(`
      SELECT * FROM fases 
      WHERE proyecto_id = ? AND tipo_fase = 'Definición de Necesidades'
    `).get(proyecto_id);

    res.json({ success: true, message: 'Exportación a PDF registrada y fase actualizada', fase });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar exportación de PDF' });
  }
});

// --- ENTIDADES Y ATRIBUTOS (ERD / DER) ---
app.get('/api/entidades/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const entidades = db.prepare('SELECT * FROM entidades WHERE proyecto_id = ? ORDER BY id ASC').all(proyecto_id);
    const getAtributos = db.prepare('SELECT * FROM atributos WHERE entidad_id = ? ORDER BY id ASC');
    
    const entidadesConAtributos = entidades.map((ent: any) => ({
      ...ent,
      atributos: getAtributos.all(ent.id)
    }));

    res.json(entidadesConAtributos);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar entidades' });
  }
});

app.post('/api/entidades', (req, res) => {
  try {
    const { proyecto_id, nombre, descripcion } = req.body;
    if (!proyecto_id || !nombre) {
      return res.status(400).json({ error: 'proyecto_id y nombre son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO entidades (proyecto_id, nombre, descripcion) VALUES (?, ?, ?)');
    const info = stmt.run(proyecto_id, nombre.trim(), descripcion ? descripcion.trim() : null);

    // Crear clave primaria predeterminada id_{nombre}
    const insertPk = db.prepare('INSERT INTO atributos (entidad_id, nombre, tipo_dato, es_clave_primaria) VALUES (?, ?, ?, ?)');
    insertPk.run(info.lastInsertRowid, `id_${nombre.toLowerCase().replace(/\\s+/g, '_')}`, 'INTEGER', 1);

    // Actualizar automáticamente Fase 2: Estudio del Sistema a 'En Progreso'
    db.prepare(`
      UPDATE fases 
      SET estado = 'En Progreso', 
          fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP) 
      WHERE proyecto_id = ? AND tipo_fase = 'Estudio del Sistema'
    `).run(proyecto_id);

    const nueva = db.prepare('SELECT * FROM entidades WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear entidad' });
  }
});

app.post('/api/atributos', (req, res) => {
  try {
    const { entidad_id, nombre, tipo_dato, es_clave_primaria } = req.body;
    if (!entidad_id || !nombre) {
      return res.status(400).json({ error: 'entidad_id y nombre son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO atributos (entidad_id, nombre, tipo_dato, es_clave_primaria) VALUES (?, ?, ?, ?)');
    const info = stmt.run(entidad_id, nombre.trim(), tipo_dato || 'VARCHAR(100)', es_clave_primaria ? 1 : 0);
    const nuevo = db.prepare('SELECT * FROM atributos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar atributo' });
  }
});

app.delete('/api/entidades/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM entidades WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Entidad no encontrada' });
    res.json({ success: true, message: `Entidad #${id} eliminada` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar entidad' });
  }
});

app.delete('/api/atributos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM atributos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Atributo no encontrado' });
    res.json({ success: true, message: `Atributo #${id} eliminado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar atributo' });
  }
});

// --- PROCESOS Y FLUJOS DE DATOS (DFD) ---
app.get('/api/procesos/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const stmt = db.prepare('SELECT * FROM procesos WHERE proyecto_id = ? ORDER BY numero_proceso ASC');
    res.json(stmt.all(proyecto_id));
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar procesos' });
  }
});

app.post('/api/procesos', (req, res) => {
  try {
    const { proyecto_id, nombre, descripcion, numero_proceso } = req.body;
    if (!proyecto_id || !nombre || !numero_proceso) {
      return res.status(400).json({ error: 'proyecto_id, nombre y numero_proceso son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO procesos (proyecto_id, nombre, descripcion, numero_proceso) VALUES (?, ?, ?, ?)');
    const info = stmt.run(proyecto_id, nombre.trim(), descripcion ? descripcion.trim() : null, numero_proceso.trim());

    // Actualizar automáticamente Fase 2: Estudio del Sistema a 'En Progreso'
    db.prepare(`
      UPDATE fases 
      SET estado = 'En Progreso', 
          fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP) 
      WHERE proyecto_id = ? AND tipo_fase = 'Estudio del Sistema'
    `).run(proyecto_id);

    const nuevo = db.prepare('SELECT * FROM procesos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proceso' });
  }
});

app.get('/api/flujos_datos/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const sql = `
      SELECT f.id, f.descripcion, f.proceso_origen_id, f.proceso_destino_id, f.entidad_id,
             po.nombre as proceso_origen_nombre, po.numero_proceso as proceso_origen_num,
             pd.nombre as proceso_destino_nombre, pd.numero_proceso as proceso_destino_num,
             e.nombre as entidad_nombre
      FROM flujos_datos f
      LEFT JOIN procesos po ON f.proceso_origen_id = po.id
      LEFT JOIN procesos pd ON f.proceso_destino_id = pd.id
      LEFT JOIN entidades e ON f.entidad_id = e.id
      WHERE po.proyecto_id = ? OR pd.proyecto_id = ? OR e.proyecto_id = ?
    `;
    const flujos = db.prepare(sql).all(proyecto_id, proyecto_id, proyecto_id);
    res.json(flujos);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar flujos' });
  }
});

app.post('/api/flujos_datos', (req, res) => {
  try {
    const { proceso_origen_id, proceso_destino_id, entidad_id, descripcion } = req.body;
    if (!descripcion) {
      return res.status(400).json({ error: 'La descripción del flujo es requerida' });
    }
    const stmt = db.prepare('INSERT INTO flujos_datos (proceso_origen_id, proceso_destino_id, entidad_id, descripcion) VALUES (?, ?, ?, ?)');
    const info = stmt.run(proceso_origen_id || null, proceso_destino_id || null, entidad_id || null, descripcion.trim());
    const nuevo = db.prepare('SELECT * FROM flujos_datos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar flujo' });
  }
});

// --- PUESTOS Y CONEXIONES (DCP) ---
app.get('/api/puestos/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const stmt = db.prepare('SELECT * FROM puestos WHERE proyecto_id = ? ORDER BY id ASC');
    res.json(stmt.all(proyecto_id));
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar puestos' });
  }
});

app.post('/api/puestos', (req, res) => {
  try {
    const { proyecto_id, nombre, descripcion } = req.body;
    if (!proyecto_id || !nombre) {
      return res.status(400).json({ error: 'proyecto_id y nombre son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO puestos (proyecto_id, nombre, descripcion) VALUES (?, ?, ?)');
    const info = stmt.run(proyecto_id, nombre.trim(), descripcion ? descripcion.trim() : null);

    // Actualizar automáticamente Fase 2: Estudio del Sistema a 'En Progreso'
    db.prepare(`
      UPDATE fases 
      SET estado = 'En Progreso', 
          fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP) 
      WHERE proyecto_id = ? AND tipo_fase = 'Estudio del Sistema'
    `).run(proyecto_id);

    const nuevo = db.prepare('SELECT * FROM puestos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar puesto' });
  }
});

app.get('/api/conexiones_puestos/:proyecto_id', (req, res) => {
  try {
    const { proyecto_id } = req.params;
    const sql = `
      SELECT c.id, c.tipo_conexion, c.puesto_origen_id, c.puesto_destino_id,
             p1.nombre as puesto_origen_nombre,
             p2.nombre as puesto_destino_nombre
      FROM conexiones_puestos c
      JOIN puestos p1 ON c.puesto_origen_id = p1.id
      JOIN puestos p2 ON c.puesto_destino_id = p2.id
      WHERE p1.proyecto_id = ?
    `;
    const conexiones = db.prepare(sql).all(proyecto_id);
    res.json(conexiones);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar conexiones' });
  }
});

app.post('/api/conexiones_puestos', (req, res) => {
  try {
    const { puesto_origen_id, puesto_destino_id, tipo_conexion } = req.body;
    if (!puesto_origen_id || !puesto_destino_id) {
      return res.status(400).json({ error: 'puesto_origen_id y puesto_destino_id son obligatorios' });
    }
    const stmt = db.prepare('INSERT INTO conexiones_puestos (puesto_origen_id, puesto_destino_id, tipo_conexion) VALUES (?, ?, ?)');
    const info = stmt.run(puesto_origen_id, puesto_destino_id, tipo_conexion || 'Documental');
    const nuevo = db.prepare('SELECT * FROM conexiones_puestos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar conexión' });
  }
});

app.delete('/api/procesos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM procesos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Proceso no encontrado' });
    res.json({ success: true, message: `Proceso #${id} eliminado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proceso' });
  }
});

app.delete('/api/flujos_datos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM flujos_datos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Flujo de datos no encontrado' });
    res.json({ success: true, message: `Flujo #${id} eliminado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar flujo de datos' });
  }
});

app.delete('/api/puestos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM puestos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Puesto no encontrado' });
    res.json({ success: true, message: `Puesto #${id} eliminado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar puesto' });
  }
});

app.delete('/api/conexiones_puestos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM conexiones_puestos WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Conexión no encontrada' });
    res.json({ success: true, message: `Conexión #${id} eliminada` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar conexión' });
  }
});

// Integración Vite en dev o archivos estáticos en prod
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor FAST Express + Vite corriendo en el puerto ${PORT}`);
  });
}

startServer();

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la base de datos SQLite
const dbPath = path.join(__dirname, '../mantenimientos.db');

// Asegurarse de que el archivo exista
if (!fs.existsSync(dbPath)) {
    console.log('📁 Creando archivo de base de datos SQLite...');
    fs.writeFileSync(dbPath, '');
}

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Error conectando a SQLite:', err.message);
    } else {
        console.log('✅ Conectado a SQLite database');
        // Habilitar foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Inicializar la base de datos
function initializeDatabase() {
    console.log('🔧 Inicializando base de datos...');

    // Crear tablas
    const schemaSQL = `
        -- Tabla de usuarios
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            rol TEXT DEFAULT 'tecnico',
            area_responsable TEXT,
            activo BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Tabla de mantenimientos
        CREATE TABLE IF NOT EXISTS mantenimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE,
            area TEXT NOT NULL,
            equipo TEXT NOT NULL,
            descripcion TEXT,
            ubicacion TEXT,
            ultimo_servicio DATE NOT NULL,
            proximo_servicio DATE NOT NULL,
            periodo_dias INTEGER NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            prioridad TEXT DEFAULT 'media',
            responsable TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Tabla de logs
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            equipo TEXT,
            accion TEXT NOT NULL,
            valor_anterior TEXT,
            valor_nuevo TEXT,
            usuario TEXT,
            pc TEXT,
            ip TEXT,
            detalles TEXT
        );
    `;

    // Ejecutar en serie
    db.serialize(() => {
        // Ejecutar esquema
        db.exec(schemaSQL, (err) => {
            if (err) {
                console.error('❌ Error creando tablas:', err.message);
            } else {
                console.log('✅ Tablas creadas correctamente');
                insertInitialData();
            }
        });
    });
}

// Insertar datos iniciales
async function insertInitialData() {
    const bcrypt = require('bcryptjs');

    try {
        console.log('👤 Verificando usuario administrador...');

        // Verificar si ya existe el usuario admin
        db.get("SELECT COUNT(*) as count FROM usuarios WHERE email = 'admin@empresa.com'", async (err, result) => {
            if (err) {
                console.error('❌ Error verificando usuario:', err.message);
                return;
            }

            if (result.count === 0) {
                console.log('📝 Creando usuario administrador...');

                // Hash de la contraseña
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash('admin123', salt);

                // Insertar usuario administrador
                const insertUserSQL = `
                    INSERT INTO usuarios (nombre, email, password_hash, rol)
                    VALUES (?, ?, ?, ?)
                `;

                db.run(insertUserSQL, ['Administrador', 'admin@empresa.com', passwordHash, 'admin'], function (err) {
                    if (err) {
                        console.error('❌ Error insertando usuario:', err.message);
                    } else {
                        console.log('✅ Usuario administrador creado:');
                        console.log('   Email: admin@empresa.com');
                        console.log('   Password: admin123');
                    }
                });
            } else {
                console.log('✅ Usuario administrador ya existe');
            }

            // Insertar datos de ejemplo de mantenimientos
            insertSampleData();
        });

    } catch (error) {
        console.error('❌ Error en inserción inicial:', error.message);
    }
}

// Insertar datos de ejemplo
function insertSampleData() {
    console.log('📊 Insertando datos de ejemplo...');

    const sampleMaintenance = `
        INSERT OR IGNORE INTO mantenimientos (codigo, area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias, prioridad)
        VALUES 
        ('MT-001', 'PLANTA AGUA', 'TANQUE DE CONTACTO', 'CAMBIO DE CARTUCHO DE AIRE', 'ÁZOTEO DE PRODUCCIÓN', '2025-08-01', '2025-12-05', 30, 'alta'),
        ('MT-002', 'PLANTA AGUA', 'BOMBA PRINCIPAL', 'REVISIÓN Y LUBRICACIÓN', 'SALA DE BOMBAS', '2025-11-20', '2025-12-10', 15, 'media'),
        ('MT-003', 'PLANTA ELECTRICA', 'TRANSFORMADOR T1', 'LIMPIEZA Y REVISIÓN', 'SUBESTACIÓN', '2025-10-15', '2025-12-15', 60, 'alta'),
        ('MT-004', 'AIRE ACONDICIONADO', 'CHILLER CENTRAL', 'CAMBIO DE FILTROS', 'TERRAZA', '2025-11-01', '2025-12-01', 30, 'media')
    `;

    db.run(sampleMaintenance, (err) => {
        if (err) {
            console.error('❌ Error insertando datos de ejemplo:', err.message);
        } else {
            console.log('✅ Datos de ejemplo insertados');
        }
    });
}

// Inicializar al iniciar (esperar un poco a que la conexión esté lista)
setTimeout(() => {
    initializeDatabase();
}, 1000);

// ==========================================
// CAPA DE COMPATIBILIDAD (Wrapper)
// IMPORTANTE: Mantenemos esto para que los modelos existentes funcionen 
// con las consultas estilo PostgreSQL ($1, $2, RETURNING)
// ==========================================
db.query = function (text, params = []) {
    return new Promise((resolve, reject) => {
        // 1. Convertir parámetros posicionales de Postgres ($1, $2) a SQLite (?)
        const sql = text.replace(/\$\d+/g, '?');

        // 2. Parche para "SELECT NOW()" usado en server.js
        if (sql.trim().toUpperCase() === 'SELECT NOW()') {
            return resolve({ rows: [{ now: new Date().toISOString() }] });
        }

        // 3. Determinar si usar .all() o .run()
        const method = (sql.trim().match(/^(SELECT|INSERT|UPDATE|DELETE)/i) && (sql.includes('RETURNING') || sql.trim().match(/^SELECT/i)))
            ? 'all'
            : 'run';

        this[method](sql, params, function (err, rows) {
            if (err) {
                console.error('Wrapper SQL Error:', err.message);
                return reject(err);
            }
            if (method === 'run') {
                resolve({
                    rows: [],
                    rowCount: this.changes,
                    insertId: this.lastID
                });
            } else {
                resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
            }
        });
    });
};

module.exports = db;

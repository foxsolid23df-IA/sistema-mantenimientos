const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'mantenimientos.db');

console.log('🔄 Reseteando base de datos SQLite...');

// Eliminar archivo de base de datos si existe
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log('🗑️  Archivo de base de datos eliminado');
    } catch (err) {
        console.error('❌ No se pudo eliminar el archivo (puede estar en uso):', err.message);
        process.exit(1);
    }
}

// Crear nueva base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error creando base de datos:', err.message);
        return;
    }

    console.log('✅ Nueva base de datos creada');
    initializeDatabase();
});

async function initializeDatabase() {
    // Crear tablas
    const schemaSQL = `
        -- Tabla de usuarios
        CREATE TABLE usuarios (
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
        CREATE TABLE mantenimientos (
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
        CREATE TABLE logs (
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

    db.exec(schemaSQL, async (err) => {
        if (err) {
            console.error('❌ Error creando tablas:', err.message);
            db.close();
            return;
        }

        console.log('✅ Tablas creadas correctamente');

        // Crear usuario administrador
        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('admin123', salt);

            const insertUserSQL = `
                INSERT INTO usuarios (nombre, email, password_hash, rol)
                VALUES (?, ?, ?, ?)
            `;

            db.run(insertUserSQL, ['Administrador', 'admin@empresa.com', passwordHash, 'admin'], function (err) {
                if (err) {
                    console.error('❌ Error creando usuario:', err.message);
                    db.close();
                    return;
                }

                console.log('✅ Usuario administrador creado:');
                console.log('   Email: admin@empresa.com');
                console.log('   Password: admin123');

                // Insertar datos de ejemplo
                insertSampleData();
            });

        } catch (error) {
            console.error('❌ Error generando hash:', error.message);
            db.close();
        }
    });
}

function insertSampleData() {
    const sampleData = `
        INSERT INTO mantenimientos (codigo, area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias, prioridad)
        VALUES 
        ('MT-001', 'PLANTA AGUA', 'TANQUE DE CONTACTO', 'CAMBIO DE CARTUCHO DE AIRE', 'ÁZOTEO DE PRODUCCIÓN', '2025-08-01', '2025-12-05', 30, 'alta'),
        ('MT-002', 'PLANTA AGUA', 'BOMBA PRINCIPAL', 'REVISIÓN Y LUBRICACIÓN', 'SALA DE BOMBAS', '2025-11-20', '2025-12-10', 15, 'media'),
        ('MT-003', 'PLANTA ELECTRICA', 'TRANSFORMADOR T1', 'LIMPIEZA Y REVISIÓN', 'SUBESTACIÓN', '2025-10-15', '2025-12-15', 60, 'alta'),
        ('MT-004', 'AIRE ACONDICIONADO', 'CHILLER CENTRAL', 'CAMBIO DE FILTROS', 'TERRAZA', '2025-11-01', '2025-12-01', 30, 'media'),
        ('MT-005', 'TALLER MECANICO', 'COMPRESOR DE AIRE', 'REVISIÓN DE PRESIÓN', 'TALLER PRINCIPAL', '2025-11-15', '2025-12-22', 7, 'alta'),
        ('MT-006', 'OFICINAS', 'AIRE ACONDICIONADO', 'LIMPIEZA DE FILTROS', 'OFICINA GERENCIA', '2025-11-10', '2025-12-25', 15, 'baja');
        
        INSERT INTO logs (equipo, accion, valor_anterior, valor_nuevo, usuario, detalles)
        VALUES 
        ('SISTEMA COMPLETO', 'REEMPLAZO DE TABLA (CSV)', '2025-12-18', 'ADMIN_IMPORT', 'admin', 'Importación masiva de mantenimientos'),
        ('TANQUE DE CONTACTO', 'MARCAR REALIZADO', '2025-08-01', '2025-09-01', 'tecnico1', 'Cambio de cartucho completado'),
        ('BOMBA PRINCIPAL', 'REPROGRAMAR', '2025-12-01', '2025-12-10', 'admin', 'Reprogramación por mantenimiento preventivo');
    `;

    db.exec(sampleData, (err) => {
        if (err) {
            console.error('❌ Error insertando datos de ejemplo:', err.message);
        } else {
            console.log('✅ Datos de ejemplo insertados');
        }

        db.close();
        console.log('\n🎉 ¡Base de datos reseteada correctamente!');
        console.log('\n📋 Credenciales de acceso:');
        console.log('   Email: admin@empresa.com');
        console.log('   Password: admin123');
        console.log('\n🚀 Inicia el servidor: npm run dev');
    });
}

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

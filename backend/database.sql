-- Crear tabla mantenimientos
CREATE TABLE IF NOT EXISTS mantenimientos (
    id SERIAL PRIMARY KEY,
    area VARCHAR(100),
    equipo VARCHAR(100),
    descripcion TEXT,
    ubicacion VARCHAR(200),
    ultimo_servicio DATE,
    proximo_servicio DATE,
    periodo_dias INTEGER,
    estado VARCHAR(20) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla logs
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    equipo VARCHAR(100),
    accion VARCHAR(50),
    valor_anterior VARCHAR(500),
    valor_nuevo VARCHAR(500),
    usuario VARCHAR(100),
    pc VARCHAR(100),
    ip VARCHAR(45),
    detalles TEXT
);

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    rol VARCHAR(20),
    activo BOOLEAN DEFAULT true
);

-- Insertar un usuario admin por defecto (contraseña: admin123)
-- Hash generado: $2a$10$vmL3qIdA.1rXJrJf3u1jB.9a74ELo6nqSSEgwLHkeKVqnp0MfvtOwa
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Administrador', 'admin@example.com', '$2a$10$vmL3qIdA.1rXJrJf3u1jB.9a74ELo6nqSSEgwLHkeKVqnp0MfvtOwa', 'admin')
ON CONFLICT (email) DO NOTHING;

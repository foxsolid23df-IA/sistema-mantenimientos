const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Usuario {
    // Crear usuario
    static create(usuarioData, callback) {
        const { nombre, email, password, rol, area_responsable } = usuarioData;

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return callback(err);

            bcrypt.hash(password, salt, (err, passwordHash) => {
                if (err) return callback(err);

                const sql = `
                    INSERT INTO usuarios (nombre, email, password_hash, rol, area_responsable)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.run(sql, [nombre, email, passwordHash, rol || 'tecnico', area_responsable], function (err) {
                    if (err) return callback(err);

                    callback(null, {
                        id: this.lastID,
                        nombre,
                        email,
                        rol: rol || 'tecnico',
                        area_responsable
                    });
                });
            });
        });
    }

    // Buscar por email
    static findByEmail(email, callback) {
        const sql = 'SELECT * FROM usuarios WHERE email = ? AND activo = 1';

        db.get(sql, [email], (err, row) => {
            if (err) return callback(err);
            callback(null, row);
        });
    }

    // Buscar por ID
    static findById(id, callback) {
        const sql = 'SELECT id, nombre, email, rol, area_responsable, created_at FROM usuarios WHERE id = ?';

        db.get(sql, [id], (err, row) => {
            if (err) return callback(err);
            callback(null, row);
        });
    }

    // Verificar contraseña
    static verifyPassword(password, hash, callback) {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) return callback(err);
            callback(null, result);
        });
    }

    // Generar JWT
    static generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                rol: user.rol,
                nombre: user.nombre
            },
            process.env.JWT_SECRET || 'mantenimientos_secret_key',
            { expiresIn: '8h' }
        );
    }

    // Obtener todos los usuarios
    static getAll(callback) {
        const sql = 'SELECT id, nombre, email, rol, area_responsable, created_at FROM usuarios WHERE activo = 1 ORDER BY nombre';

        db.all(sql, [], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        });
    }
}

module.exports = Usuario;

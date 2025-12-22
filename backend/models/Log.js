const pool = require('../config/database');

class Log {
    static async create(log) {
        const { fecha_registro, equipo, accion, valor_anterior, valor_nuevo, usuario, pc, ip, detalles } = log;
        const result = await pool.query(
            `INSERT INTO logs (fecha_registro, equipo, accion, valor_anterior, valor_nuevo, usuario, pc, ip, detalles) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [fecha_registro, equipo, accion, valor_anterior, valor_nuevo, usuario, pc, ip, detalles]
        );
        return result.rows[0];
    }

    static async findAll(limit = 50, offset = 0) {
        const result = await pool.query('SELECT * FROM logs ORDER BY fecha_registro DESC LIMIT $1 OFFSET $2', [limit, offset]);
        return result.rows;
    }
}

module.exports = Log;

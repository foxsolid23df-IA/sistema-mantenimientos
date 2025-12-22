const pool = require('../config/database');

class Mantenimiento {
    static async findAll() {
        const result = await pool.query('SELECT * FROM mantenimientos ORDER BY proximo_servicio');
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM mantenimientos WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create(mantenimiento) {
        const { area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias } = mantenimiento;
        const result = await pool.query(
            'INSERT INTO mantenimientos (area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias]
        );
        return result.rows[0];
    }

    static async update(id, mantenimiento) {
        const { area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias, estado } = mantenimiento;
        const result = await pool.query(
            'UPDATE mantenimientos SET area = $1, equipo = $2, descripcion = $3, ubicacion = $4, ultimo_servicio = $5, proximo_servicio = $6, periodo_dias = $7, estado = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
            [area, equipo, descripcion, ubicacion, ultimo_servicio, proximo_servicio, periodo_dias, estado, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM mantenimientos WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

    static async findByMonth(year, month) {
        const result = await pool.query(
            `SELECT * FROM mantenimientos 
       WHERE EXTRACT(YEAR FROM proximo_servicio) = $1 
       AND EXTRACT(MONTH FROM proximo_servicio) = $2 
       ORDER BY proximo_servicio`,
            [year, month]
        );
        return result.rows;
    }

    static async markAsDone(id, nuevaFecha) {
        const mantenimiento = await this.findById(id);
        if (!mantenimiento) return null;

        // Calcular nueva fecha de próximo servicio
        const proximoServicio = new Date(nuevaFecha);
        proximoServicio.setDate(proximoServicio.getDate() + mantenimiento.periodo_dias);

        const result = await pool.query(
            'UPDATE mantenimientos SET ultimo_servicio = $1, proximo_servicio = $2, estado = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [nuevaFecha, proximoServicio.toISOString().split('T')[0], 'completado', id]
        );
        return result.rows[0];
    }

    static async reschedule(id, nuevaFecha) {
        const result = await pool.query(
            'UPDATE mantenimientos SET proximo_servicio = $1, estado = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [nuevaFecha, 'reprogramado', id]
        );
        return result.rows[0];
    }
}

module.exports = Mantenimiento;

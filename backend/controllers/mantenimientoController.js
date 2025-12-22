const Mantenimiento = require('../models/Mantenimiento');
const Log = require('../models/Log');
const { processCSV } = require('../utils/csvProcessor');

exports.importarCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const mantenimientos = await processCSV(req.file.path);

        // Opcional: Borrar los mantenimientos existentes y cargar los nuevos (según tu lógica)
        // En este ejemplo, asumimos que el CSV tiene la estructura correcta y se insertan como nuevos.

        // Registrar log
        await Log.create({
            equipo: 'SISTEMA COMPLETO',
            accion: 'REEMPLAZO DE TABLA (CSV)',
            valor_anterior: new Date().toISOString().split('T')[0],
            valor_nuevo: 'ADMIN_IMPORT',
            usuario: req.user.nombre,
            pc: req.headers['user-agent'],
            ip: req.ip,
            detalles: `Importación de ${mantenimientos.length} registros`
        });

        // Insertar cada mantenimiento en la base de datos
        for (const mnt of mantenimientos) {
            await Mantenimiento.create(mnt);
        }

        res.json({ success: true, registros: mantenimientos.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMantenimientos = async (req, res) => {
    try {
        const mantenimientos = await Mantenimiento.findAll();
        res.json(mantenimientos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMantenimientoById = async (req, res) => {
    try {
        const mantenimiento = await Mantenimiento.findById(req.params.id);
        if (!mantenimiento) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado' });
        }
        res.json(mantenimiento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.marcarRealizado = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha } = req.body; // Fecha en la que se realizó el mantenimiento

        const mantenimiento = await Mantenimiento.markAsDone(id, fecha);

        if (!mantenimiento) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado' });
        }

        // Registrar log
        await Log.create({
            equipo: mantenimiento.equipo,
            accion: 'MARCAR REALIZADO',
            valor_anterior: req.body.valor_anterior, // Podría ser la fecha anterior de último servicio
            valor_nuevo: fecha,
            usuario: req.user.nombre,
            pc: req.headers['user-agent'],
            ip: req.ip,
            detalles: `Mantenimiento realizado en equipo: ${mantenimiento.equipo}`
        });

        res.json(mantenimiento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.reprogramar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_fecha } = req.body;

        const mantenimiento = await Mantenimiento.reschedule(id, nueva_fecha);

        if (!mantenimiento) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado' });
        }

        // Registrar log
        await Log.create({
            equipo: mantenimiento.equipo,
            accion: 'REPROGRAMAR',
            valor_anterior: req.body.fecha_anterior,
            valor_nuevo: nueva_fecha,
            usuario: req.user.nombre,
            pc: req.headers['user-agent'],
            ip: req.ip,
            detalles: `Mantenimiento reprogramado para el equipo: ${mantenimiento.equipo}`
        });

        res.json(mantenimiento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCalendario = async (req, res) => {
    try {
        const { year, month } = req.query;
        const mantenimientos = await Mantenimiento.findByMonth(year, month);
        res.json(mantenimientos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const logs = await Log.findAll(limit || 50, offset || 0);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

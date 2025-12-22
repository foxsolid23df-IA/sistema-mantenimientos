const Log = require('../models/Log');

module.exports = async (req, res, next) => {
    // Puedes personalizar qué solicitudes quieres registrar
    const originalSend = res.send;
    res.send = function (data) {
        // Aquí podrías registrar la respuesta si es necesario
        originalSend.call(this, data);
    };
    next();
};

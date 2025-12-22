const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Verificar si no hay token
    if (!token) {
        return res.status(401).json({ error: 'No hay token, autorización denegada' });
    }

    // Verificar token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mantenimientos_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token no es válido' });
    }
};

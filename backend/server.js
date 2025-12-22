const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const logRoutes = require('./routes/logRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/mantenimientos', mantenimientoRoutes);
app.use('/api/logs', logRoutes);

const db = require('./config/database');

// Logging global
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        // Ocultar password en logs
        const bodySafe = { ...req.body };
        if (bodySafe.password) bodySafe.password = '***';
        console.log('   Body:', bodySafe);
    }
    next();
});

// Test Connection
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ ERROR FATAL DE CONEXIÓN A LA BASE DE DATOS ❌');
        console.error(err);
    } else {
        console.log('✅ Base de datos conectada correctamente a las:', res.rows[0].now);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    if (process.env.DB_PASSWORD === 'root') {
        console.warn('\nADVERTENCIA: Estás usando la contraseña por defecto "root".\nSi tu base de datos tiene otra contraseña, edita el archivo .env para evitar errores de conexión.\n');
    }
});

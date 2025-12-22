const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function initDB() {
    console.log('Intentando conectar a la base de datos...');
    try {
        const client = await pool.connect();
        console.log('Conexión exitosa. Ejecutando script SQL...');

        const sqlPath = path.join(__dirname, '..', 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Tablas creadas y usuario admin inicializado correctamente.');

        client.release();
    } catch (err) {
        console.error('❌ Error al inicializar la base de datos:', err.message);
        if (err.message.includes('authentication failed')) {
            console.error('👉 REVISA TU CONTRASEÑA EN EL ARCHIVO .env');
        }
        if (err.message.includes('password authentication failed')) {
            console.error('👉 La contraseña es incorrecta.');
        }
    } finally {
        await pool.end();
    }
}

initDB();

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'mantenimientos.db');
console.log(`🔍 Verificando base de datos: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error abriendo base de datos:', err.message);
        return;
    }

    console.log('✅ Conectado a SQLite database');

    // Verificar tablas existentes
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('❌ Error listando tablas:', err.message);
            return;
        }

        console.log('\n📊 Tablas en la base de datos:');
        tables.forEach(table => {
            console.log(`   - ${table.name}`);
        });

        // Verificar usuarios
        checkUsers();
    });
});

function checkUsers() {
    console.log('\n👥 Verificando usuarios...');

    // Primero, verificar si la tabla usuarios existe
    db.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='usuarios'", (err, result) => {
        if (err || result.count === 0) {
            console.log('❌ La tabla "usuarios" no existe. Creándola...');
            createUsersTable();
            return;
        }

        // Mostrar usuarios existentes
        db.all("SELECT id, nombre, email, rol, password_hash FROM usuarios", (err, users) => {
            if (err) {
                console.error('❌ Error obteniendo usuarios:', err.message);
                return;
            }

            if (users.length === 0) {
                console.log('⚠️  No hay usuarios en la base de datos');
                console.log('📝 Creando usuario administrador...');
                createAdminUser();
            } else {
                console.log(`✅ Usuarios encontrados: ${users.length}`);
                users.forEach(user => {
                    console.log(`   - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.nombre}, Rol: ${user.rol}`);
                });

                // Verificar contraseña del admin
                verifyAdminPassword();
            }
        });
    });
}

function createUsersTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            rol TEXT DEFAULT 'tecnico',
            area_responsable TEXT,
            activo BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creando tabla usuarios:', err.message);
            return;
        }

        console.log('✅ Tabla "usuarios" creada');
        createAdminUser();
    });
}

async function createAdminUser() {
    try {
        // Hash de la contraseña "admin123"
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const insertSQL = `
            INSERT INTO usuarios (nombre, email, password_hash, rol)
            VALUES (?, ?, ?, ?)
        `;

        db.run(insertSQL, ['Administrador', 'admin@empresa.com', passwordHash, 'admin'], function (err) {
            if (err) {
                // Si ya existe, mostrar mensaje
                if (err.message.includes('UNIQUE constraint')) {
                    console.log('ℹ️  Usuario administrador ya existe');
                    // Actualizar contraseña si ya existe para asegurar que es admin123
                    const updateSQL = `UPDATE usuarios SET password_hash = ? WHERE email = ?`;
                    db.run(updateSQL, [passwordHash, 'admin@empresa.com'], function (err) {
                        if (!err) console.log('✅ Contraseña actualizada a admin123 para admin@empresa.com');
                        db.close();
                    });
                    return;

                } else {
                    console.error('❌ Error creando usuario:', err.message);
                }
            } else {
                console.log('✅ Usuario administrador creado:');
                console.log('   Email: admin@empresa.com');
                console.log('   Password: admin123');
            }
            if (!err) db.close(); // Close only if no unique constraint error handled above
        });

    } catch (error) {
        console.error('❌ Error generando hash:', error.message);
        db.close();
    }
}

function verifyAdminPassword() {
    // Verificar la contraseña del primer usuario admin
    db.get("SELECT password_hash FROM usuarios WHERE email = 'admin@empresa.com' OR email = 'admin@example.com'", async (err, user) => {
        if (err || !user) {
            console.log('⚠️  Usuario admin no encontrado con esos emails');
            createAdminUser();
            return;
        }

        console.log('\n🔑 Verificando contraseña...');
        console.log(`   Hash almacenado: ${user.password_hash.substring(0, 30)}...`);

        // Probar con "admin123"
        const isValid = await bcrypt.compare('admin123', user.password_hash);
        console.log(`   ¿"admin123" es válida? ${isValid ? '✅ SI' : '❌ NO'}`);

        // Probar con contraseña vacía
        const isEmptyValid = await bcrypt.compare('', user.password_hash);
        console.log(`   ¿"" (vacía) es válida? ${isEmptyValid ? '✅ SI' : '❌ NO'}`);

        db.close();
    });
}

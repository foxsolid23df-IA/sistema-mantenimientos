const Usuario = require('../models/Usuario');

const authController = {
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            console.log(`🔐 Intentando login para: ${email}`);

            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            // Buscar usuario
            Usuario.findByEmail(email, async (err, usuario) => {
                if (err) {
                    console.error('❌ Error buscando usuario:', err);
                    return res.status(500).json({ error: 'Error del servidor' });
                }

                if (!usuario) {
                    console.log('❌ Usuario no encontrado:', email);
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }

                console.log(`✅ Usuario encontrado: ${usuario.nombre}`);

                // Verificar contraseña
                Usuario.verifyPassword(password, usuario.password_hash, (err, validPassword) => {
                    if (err) {
                        console.error('❌ Error verificando contraseña:', err);
                        return res.status(500).json({ error: 'Error del servidor' });
                    }

                    if (!validPassword) {
                        console.log('❌ Contraseña incorrecta para:', email);
                        return res.status(401).json({ error: 'Credenciales inválidas' });
                    }

                    console.log(`✅ Contraseña correcta para: ${email}`);

                    // Generar token
                    const token = Usuario.generateToken(usuario);

                    res.json({
                        message: 'Login exitoso',
                        usuario: {
                            id: usuario.id,
                            nombre: usuario.nombre,
                            email: usuario.email,
                            rol: usuario.rol,
                            area_responsable: usuario.area_responsable
                        },
                        token
                    });
                });
            });

        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Register (Added to prevent route crash, using Usuario model)
    register: async (req, res) => {
        try {
            Usuario.create(req.body, (err, user) => {
                if (err) {
                    console.error('❌ Error registrando usuario:', err);
                    return res.status(500).json({ error: 'No se pudo registrar el usuario' });
                }
                res.status(201).json(user);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Verificar token
    verifyToken: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: 'Token no proporcionado' });
            }

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mantenimientos_secret_key');

            Usuario.findById(decoded.id, (err, usuario) => {
                if (err || !usuario) {
                    return res.status(401).json({ error: 'Usuario no encontrado' });
                }

                res.json({
                    valid: true,
                    usuario
                });
            });

        } catch (error) {
            res.status(401).json({ error: 'Token inválido' });
        }
    },

    // Obtener perfil
    getProfile: async (req, res) => {
        try {
            Usuario.findById(req.user.id, (err, usuario) => {
                if (err || !usuario) {
                    return res.status(404).json({ error: 'Usuario no encontrado' });
                }

                res.json(usuario);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = authController;

import { API_URL, IS_DEMO_MODE } from '../config.js';

class ApiService {
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    async get(endpoint) {
        if (IS_DEMO_MODE) return this.getMockData(endpoint);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) this.handleError(response);
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    async post(endpoint, body = {}) {
        if (IS_DEMO_MODE) return this.mockResponse(endpoint, body);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) this.handleError(response);
            return await response.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    async put(endpoint, body = {}) {
        if (IS_DEMO_MODE) return this.mockResponse(endpoint, body);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) this.handleError(response);
            return await response.json();
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    }

    async delete(endpoint) {
        if (IS_DEMO_MODE) return { success: true };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) this.handleError(response);
            return await response.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }

    async upload(endpoint, formData) {
        if (IS_DEMO_MODE) return { success: true, registros: 15 };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: formData
            });

            if (!response.ok) this.handleError(response);
            return await response.json();
        } catch (error) {
            console.error(`Upload ${endpoint} failed:`, error);
            throw error;
        }
    }

    handleError(response) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
        throw new Error(`API Error: ${response.statusText}`);
    }

    // --- MOCK DATA GENERATOR FOR DEMO ---
    getMockData(endpoint) {
        console.log(`⚠️ DEMO MODE: Mocking GET ${endpoint}`);

        return new Promise(resolve => {
            setTimeout(() => {
                if (endpoint.includes('/mantenimientos/stats')) {
                    resolve({ total: 45, pendientes: 12, completados: 28, vencidos: 3, por_vencer: 5 });
                } else if (endpoint.includes('prioridad=alta')) {
                    resolve([
                        { id: 1, equipo: 'Bomba Hidráulica Principal', area: 'Sala de Máquinas', proximo_servicio: this.addDays(2), prioridad: 'alta', estado: 'pendiente' },
                        { id: 2, equipo: 'Generador de Respaldo', area: 'Azotea', proximo_servicio: this.addDays(-1), prioridad: 'alta', estado: 'pendiente' },
                        { id: 3, equipo: 'Sistema Contra Incendios', area: 'Planta Baja', proximo_servicio: this.addDays(5), prioridad: 'alta', estado: 'pendiente' }
                    ]);
                } else if (endpoint.includes('/mantenimientos')) {
                    resolve([
                        { id: 1, codigo: 'EQ-001', equipo: 'Bomba Hidráulica', area: 'Sala de Máquinas', ultimo_servicio: '2023-10-01', proximo_servicio: this.addDays(2), estado: 'pendiente', prioridad: 'alta' },
                        { id: 2, codigo: 'EQ-002', equipo: 'Aire Acondicionado Central', area: 'Oficinas', ultimo_servicio: '2023-09-15', proximo_servicio: this.addDays(15), estado: 'completado', prioridad: 'media' },
                        { id: 3, codigo: 'EQ-003', equipo: 'Generador Eléctrico', area: 'Sótano', ultimo_servicio: '2023-08-20', proximo_servicio: this.addDays(-2), estado: 'pendiente', prioridad: 'alta' },
                        { id: 4, codigo: 'EQ-004', equipo: 'Montacargas #2', area: 'Almacén', ultimo_servicio: '2023-11-01', proximo_servicio: this.addDays(30), estado: 'pendiente', prioridad: 'baja' },
                        { id: 5, codigo: 'EQ-005', equipo: 'Panel de Control', area: 'Producción', ultimo_servicio: '2023-10-10', proximo_servicio: this.addDays(5), estado: 'reprogramado', prioridad: 'media' }
                    ]);
                } else if (endpoint.includes('/logs')) {
                    resolve({
                        logs: [
                            { fecha_registro: new Date().toISOString(), equipo: 'Bomba Hidráulica', accion: 'MANTENIMIENTO_REALIZADO', usuario: 'Admin', valor_anterior: 'Pendiente', valor_nuevo: 'Completado' },
                            { fecha_registro: new Date().toISOString(), equipo: 'Aire Acondicionado', accion: 'REPROGRAMACION', usuario: 'Admin', valor_anterior: '2023-11-01', valor_nuevo: '2023-11-15' }
                        ]
                    });
                } else {
                    resolve([]);
                }
            }, 800); // Simulate network latency
        });
    }

    mockResponse(endpoint, body) {
        console.log(`⚠️ DEMO MODE: Mocking POST/PUT ${endpoint}`, body);
        return new Promise(resolve => {
            setTimeout(() => {
                if (endpoint.includes('login')) {
                    resolve({
                        token: 'mock-token-123',
                        usuario: { id: 1, nombre: 'Usuario Demo', email: body.email || 'demo@user.com', rol: 'admin' }
                    });
                } else {
                    resolve({ success: true, message: 'Operación simulada exitosa' });
                }
            }, 800);
        });
    }

    addDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
}

export const api = new ApiService();

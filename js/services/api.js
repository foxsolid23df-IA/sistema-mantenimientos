import { API_URL, IS_DEMO_MODE } from '../config.js';
import { mockData } from './mock-data.js';

class ApiService {
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    async get(endpoint) {
        if (IS_DEMO_MODE) return this.mockGet(endpoint);

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
        if (IS_DEMO_MODE) return this.mockPost(endpoint, body);

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
        if (IS_DEMO_MODE) return this.mockPut(endpoint, body);

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
        if (IS_DEMO_MODE) {
            await new Promise(r => setTimeout(r, 1000));
            return { registros: 5, success: true };
        }

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

    // --- MOCK IMPLEMENTATIONS FOR DEMO ---

    async mockGet(endpoint) {
        await new Promise(r => setTimeout(r, 600)); // Simulate latency
        console.log(`[DEMO API] GET ${endpoint}`);

        if (endpoint.includes('/mantenimientos/stats')) {
            return {
                total: mockData.mantenimientos.length,
                pendientes: mockData.mantenimientos.filter(m => m.estado === 'pendiente').length,
                completados: mockData.mantenimientos.filter(m => m.estado === 'completado').length,
                vencidos: 1,
                por_vencer: 2
            };
        }

        if (endpoint.includes('/mantenimientos/calendar')) {
            return mockData.mantenimientos;
        }

        if (endpoint.includes('/mantenimientos')) {
            if (endpoint.includes('/')) {
                // Get by ID logic approximation
                const id = parseInt(endpoint.split('/').pop());
                if (!isNaN(id)) return mockData.mantenimientos.find(m => m.id === id);
            }
            return mockData.mantenimientos;
        }

        if (endpoint.includes('/logs')) {
            return { logs: mockData.logs };
        }

        return {};
    }

    async mockPost(endpoint, body) {
        await new Promise(r => setTimeout(r, 800));
        console.log(`[DEMO API] POST ${endpoint}`, body);

        if (endpoint === '/auth/login') {
            if (body.email === 'admin@empresa.com' && body.password === 'admin123') {
                return {
                    token: 'demo-token-12345',
                    usuario: mockData.user
                };
            }
            throw new Error('Credenciales inválidas (Demo: admin@empresa.com / admin123)');
        }

        return { success: true };
    }

    async mockPut(endpoint, body) {
        await new Promise(r => setTimeout(r, 800));
        console.log(`[DEMO API] PUT ${endpoint}`, body);
        return { success: true, ...body };
    }
}

export const api = new ApiService();

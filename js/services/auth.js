import { api } from './api.js';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
    }

    async login(email, password) {
        try {
            const data = await api.post('/auth/login', { email, password });

            if (data.token) {
                this.token = data.token;
                this.user = data.usuario;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, user: this.user };
            }
            return { success: false, error: 'Respuesta inválida del servidor' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }
}

export const auth = new AuthService();

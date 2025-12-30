import { api } from './services/api.js';
import { ui } from './services/ui.js';
import { auth } from './services/auth.js';

class MaintenanceApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando aplicación de mantenimientos (Módulo ES6)...');

        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.updateUserInfo();
        this.bindEvents();
        this.loadInitialData();
    }

    updateUserInfo() {
        const user = auth.getUser();
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user) {
            userNameElement.textContent = `${user.nombre} (${user.rol})`;
        }
    }

    bindEvents() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());

        // Navigation
        this.setupNavigation();

        // Refresh
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadDashboard());

        // Filters
        ['filterStatus', 'filterArea', 'filterPriority'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.loadMaintenanceTable());
        });
        document.getElementById('searchInput')?.addEventListener('input', () => this.loadMaintenanceTable());

        // Modal Closers
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // CSV Import
        this.setupImportEvents();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                const page = item.dataset.page;
                this.showPage(page);
                window.location.hash = page;
            });
        });
    }

    setupImportEvents() {
        const csvFileInput = document.getElementById('csvFile');
        const importBtn = document.getElementById('importBtn');

        if (csvFileInput && importBtn) {
            csvFileInput.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name || 'Ningún archivo seleccionado';
                document.getElementById('fileName').textContent = fileName;
                importBtn.disabled = !e.target.files[0];
            });

            importBtn.addEventListener('click', async () => {
                const file = csvFileInput.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                // Show simple progress UI
                const pContainer = document.getElementById('progressContainer');
                const pFill = document.getElementById('progressFill');
                const pText = document.getElementById('progressText');

                if (pContainer) pContainer.style.display = 'flex';

                try {
                    // Simulate progress
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress = Math.min(progress + 10, 90);
                        if (pFill) pFill.style.width = `${progress}%`;
                        if (pText) pText.textContent = `${progress}%`;
                    }, 200);

                    const result = await api.upload('/mantenimientos/import', formData);

                    clearInterval(interval);
                    if (pFill) pFill.style.width = '100%';
                    if (pText) pText.textContent = '100%';

                    ui.showToast(`Importados ${result.registros} registros`, 'success');

                    setTimeout(() => {
                        if (pContainer) pContainer.style.display = 'none';
                        csvFileInput.value = '';
                        importBtn.disabled = true;
                        document.getElementById('fileName').textContent = 'Ningún archivo seleccionado';
                        this.loadDashboard();
                    }, 1000);

                } catch (error) {
                    ui.showToast(error.message, 'error');
                    if (pContainer) pContainer.style.display = 'none';
                }
            });
        }
    }

    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const pageElement = document.getElementById(`${pageName}Page`);
        if (pageElement) pageElement.classList.add('active');

        switch (pageName) {
            case 'dashboard': this.loadDashboard(); break;
            case 'maintenance': this.loadMaintenanceTable(); break;
            case 'logs': this.loadLogs(); break;
            case 'calendar':
                if (!window.calendarInitialized && typeof FullCalendar !== 'undefined') {
                    this.initCalendar();
                }
                break;
        }
    }

    async loadInitialData() {
        await this.loadAreas();
        const hash = window.location.hash.substring(1) || 'dashboard';

        // Mark active nav
        document.querySelectorAll('.nav-item').forEach(nav => {
            if (nav.dataset.page === hash) nav.classList.add('active');
            else nav.classList.remove('active');
        });

        this.showPage(hash);
    }

    async loadDashboard() {
        console.log('📊 Cargando dashboard...');

        // Skeletons
        ['totalCount', 'pendingCount', 'completedCount', 'overdueCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="skeleton" style="width: 40px; height: 30px;"></div>';
        });
        document.getElementById('urgentList').innerHTML = ui.getSkeletonHTML('card', 3);
        document.getElementById('nextWeekList').innerHTML = ui.getSkeletonHTML('card', 3);

        try {
            const [stats, urgent, pending] = await Promise.all([
                api.get('/mantenimientos/stats'),
                api.get('/mantenimientos?prioridad=alta&estado=pendiente&limit=5'),
                api.get('/mantenimientos?estado=pendiente&limit=20') // Get more to filter locally for next week logic
            ]);

            // Update Stats Values
            const mapStats = {
                totalCount: stats.total,
                pendingCount: stats.pendientes,
                completedCount: stats.completados,
                overdueCount: stats.vencidos,
                statPending: stats.pendientes,
                statDueSoon: stats.por_vencer
            };
            Object.keys(mapStats).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.textContent = mapStats[key] || 0;
            });

            // Update Urgent List
            this.renderList(urgent, 'urgentList', true);

            // Update Next Week List
            const nextWeek = pending.filter(m => {
                const days = ui.daysUntil(m.proximo_servicio);
                return days >= 0 && days <= 14;
            }).slice(0, 5);
            this.renderList(nextWeek, 'nextWeekList', false);

        } catch (error) {
            ui.showToast('Error cargando dashboard', 'error');
        }
    }

    renderList(items, containerId, showDays) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!items.length) {
            container.innerHTML = '<p class="text-muted">No hay mantenimientos recientes</p>';
            return;
        }

        container.innerHTML = items.map(m => {
            const days = ui.daysUntil(m.proximo_servicio);
            let statusBadge = '';

            if (showDays) {
                const statusClass = days < 0 ? 'text-danger' : 'text-warning';
                const text = days < 0 ? 'VENCIDO' : `${days} días`;
                statusBadge = `<span class="${statusClass}" style="font-weight:bold; font-size:0.8rem">${text}</span>`;
            } else {
                statusBadge = `<span class="badge badge-${m.prioridad}">${m.prioridad.toUpperCase()}</span>`;
            }

            return `
                <div class="maintenance-item" onclick="window.maintenanceApp.showDetails(${m.id})">
                    <div class="maintenance-info">
                        <h4>${m.equipo}</h4>
                        <p>${m.area} - ${ui.formatDate(m.proximo_servicio)}</p>
                    </div>
                    <div>${statusBadge}</div>
                </div>
            `;
        }).join('');

        // Re-attach click events carefully if needed, or use global delegation
        // Since we are module based, onclick="window.maintenanceApp..." won't work unless we expose it.
        // We will expose it at the bottom.
    }

    async loadMaintenanceTable() {
        const tbody = document.getElementById('maintenanceTableBody');
        tbody.innerHTML = ui.getSkeletonHTML('table', 5);

        const params = new URLSearchParams();
        const status = document.getElementById('filterStatus')?.value;
        const area = document.getElementById('filterArea')?.value;
        const priority = document.getElementById('filterPriority')?.value;
        const search = document.getElementById('searchInput')?.value;

        if (status) params.append('estado', status);
        if (area) params.append('area', area);
        if (priority) params.append('prioridad', priority);
        if (search) params.append('search', search);

        try {
            const data = await api.get(`/mantenimientos?${params}`);

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron resultados</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(m => `
                <tr>
                    <td>${m.codigo || 'N/A'}</td>
                    <td><strong>${m.equipo}</strong></td>
                    <td>${m.area}</td>
                    <td>${ui.formatDate(m.ultimo_servicio)}</td>
                    <td>${ui.formatDate(m.proximo_servicio)}</td>
                    <td><span class="badge badge-${m.estado}">${m.estado.toUpperCase()}</span></td>
                    <td><span class="badge badge-${m.prioridad}">${m.prioridad.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-action btn-view" onclick="window.maintenanceApp.showDetails(${m.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar datos</td></tr>';
        }
    }

    async loadLogs() {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = ui.getSkeletonHTML('table', 10);

        try {
            const data = await api.get('/logs?limit=20');
            // Assuming data is { logs: [] } or []
            const logs = Array.isArray(data) ? data : (data.logs || []);

            if (!logs.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay historial</td></tr>';
                return;
            }

            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td>${new Date(log.fecha_registro).toLocaleString()}</td>
                    <td>${log.equipo || 'SISTEMA'}</td>
                    <td><span class="badge badge-info">${log.accion}</span></td>
                    <td>${log.valor_anterior || '-'}</td>
                    <td>${log.valor_nuevo || '-'}</td>
                    <td>${log.usuario || '-'}</td>
                </tr>
            `).join('');

        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar historial</td></tr>';
        }
    }

    async showDetails(id) {
        try {
            const m = await api.get(`/mantenimientos/${id}`);
            const modal = document.getElementById('detailsModal');
            document.getElementById('modalTitle').textContent = m.equipo;

            const days = ui.daysUntil(m.proximo_servicio);
            let alertText = '';
            if (days < 0) alertText = `<span class="text-danger">(Vencido hace ${Math.abs(days)} días)</span>`;
            else if (days <= 7) alertText = `<span class="text-warning">(Vence en ${days} días)</span>`;

            document.getElementById('modalBody').innerHTML = `
                <div class="maintenance-details">
                    <div class="detail-row"><span class="detail-label">Código:</span> <span>${m.codigo || 'N/A'}</span></div>
                    <div class="detail-row"><span class="detail-label">Área:</span> <span>${m.area}</span></div>
                    <div class="detail-row"><span class="detail-label">Descripción:</span> <span>${m.descripcion}</span></div>
                    <div class="detail-row"><span class="detail-label">Próximo:</span> <span>${ui.formatDate(m.proximo_servicio)} ${alertText}</span></div>
                    <div class="detail-row"><span class="detail-label">Prioridad:</span> <span class="badge badge-${m.prioridad}">${m.prioridad}</span></div>
                </div>
            `;

            // Setup action buttons
            const completeBtn = document.getElementById('markCompletedBtn');
            const rescheduleBtn = document.getElementById('rescheduleBtn');

            // Cloning to remove old listeners
            const newComplete = completeBtn.cloneNode(true);
            const newReschedule = rescheduleBtn.cloneNode(true);
            completeBtn.parentNode.replaceChild(newComplete, completeBtn);
            rescheduleBtn.parentNode.replaceChild(newReschedule, rescheduleBtn);

            newComplete.onclick = () => this.showCompleteModal(m);
            newReschedule.onclick = () => this.showRescheduleModal(m);

            modal.classList.add('active');
        } catch (error) {
            ui.showToast('Error al cargar detalles', 'error');
        }
    }

    showCompleteModal(m) {
        document.getElementById('detailsModal').classList.remove('active');
        const modal = document.getElementById('completeModal');
        modal.classList.add('active');

        document.getElementById('completionDate').value = new Date().toISOString().split('T')[0];

        const confirmBtn = document.getElementById('confirmCompleteBtn');
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

        newConfirm.onclick = async () => {
            const date = document.getElementById('completionDate').value;
            if (!date) return ui.showToast('Seleccione una fecha', 'warning');

            try {
                await api.put(`/mantenimientos/${m.id}/complete`, { fecha_realizacion: date });
                ui.showToast('Mantenimiento completado', 'success');
                this.closeAllModals();
                this.loadDashboard();
                this.loadMaintenanceTable();
            } catch (e) {
                ui.showToast(e.message, 'error');
            }
        };
    }

    showRescheduleModal(m) {
        document.getElementById('detailsModal').classList.remove('active');
        const modal = document.getElementById('rescheduleModal');
        modal.classList.add('active');

        const confirmBtn = document.getElementById('confirmRescheduleBtn');
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

        newConfirm.onclick = async () => {
            const date = document.getElementById('newDate').value;
            if (!date) return ui.showToast('Seleccione nueva fecha', 'warning');

            try {
                await api.put(`/mantenimientos/${m.id}/reschedule`, { nueva_fecha: date });
                ui.showToast('Mantenimiento reprogramado', 'success');
                this.closeAllModals();
                this.loadDashboard();
                this.loadMaintenanceTable();
            } catch (e) {
                ui.showToast(e.message, 'error');
            }
        };
    }

    async loadAreas() {
        try {
            const data = await api.get('/mantenimientos');
            const areas = [...new Set(data.map(m => m.area))];
            const select = document.getElementById('filterArea');
            if (select) {
                // Keep first option
                select.innerHTML = '<option value="">Todas las áreas</option>';
                areas.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a;
                    opt.textContent = a;
                    select.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Error loading areas', e);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    initCalendar() {
        // ... (Keep existing calendar logic or move to separate controller if needed, but for now fits here)
        window.calendarInitialized = true;
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        window.calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            firstDay: 1,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            events: async (info, success, failure) => {
                try {
                    const year = info.start.getFullYear();
                    const month = info.start.getMonth() + 1;
                    const data = await api.get(`/mantenimientos/calendar?year=${year}&month=${month}`);
                    const events = data.map(m => ({
                        id: m.id,
                        title: m.equipo,
                        start: m.proximo_servicio,
                        backgroundColor: m.estado === 'completado' ? '#2eb85c' : '#3f72af'
                    }));
                    success(events);
                } catch (e) { failure(e); }
            }
        });
        window.calendarInstance.render();

        // Wire up calendar buttons manually if needed, or rely on FullCalendar standard toolbar
    }
}

// Instantiate and expose globally so HTML onclick handlers work
const app = new MaintenanceApp();
window.maintenanceApp = app;

export default app;

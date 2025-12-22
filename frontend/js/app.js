class MaintenanceApp {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));

        this.init();
    }

    async init() {
        console.log('🔧 Inicializando aplicación de mantenimientos...');

        // Verificar autenticación
        if (!this.token || !this.user) {
            console.warn('⚠️  Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
            return;
        }

        this.updateUserInfo();
        this.bindEvents();
        this.loadInitialData();
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.user) {
            userNameElement.textContent = `${this.user.nombre} (${this.user.rol})`;
        }
    }

    bindEvents() {
        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Botón de refresh
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboard());
        }

        // Botón para nuevo mantenimiento
        const newMaintenanceBtn = document.getElementById('newMaintenanceBtn');
        if (newMaintenanceBtn) {
            newMaintenanceBtn.addEventListener('click', () => this.showNewMaintenanceForm());
        }

        // Importar CSV
        const csvFileInput = document.getElementById('csvFile');
        const importBtn = document.getElementById('importBtn');

        if (csvFileInput && importBtn) {
            csvFileInput.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name || 'Ningún archivo seleccionado';
                document.getElementById('fileName').textContent = fileName;
                importBtn.disabled = !e.target.files[0];
            });

            importBtn.addEventListener('click', () => this.importCSV());
        }

        // Botones de filtro
        const filterStatus = document.getElementById('filterStatus');
        const filterArea = document.getElementById('filterArea');
        const filterPriority = document.getElementById('filterPriority');
        const searchInput = document.getElementById('searchInput');

        if (filterStatus) filterStatus.addEventListener('change', () => this.loadMaintenanceTable());
        if (filterArea) filterArea.addEventListener('change', () => this.loadMaintenanceTable());
        if (filterPriority) filterPriority.addEventListener('change', () => this.loadMaintenanceTable());
        if (searchInput) searchInput.addEventListener('input', () => this.loadMaintenanceTable());
    }

    async loadInitialData() {
        // Cargar áreas para el filtro
        await this.loadAreas();

        // Cargar página actual basada en hash
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.loadPage(hash);
    }

    async loadPage(pageName) {
        console.log(`📄 Cargando página: ${pageName}`);

        switch (pageName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'maintenance':
                await this.loadMaintenanceTable();
                break;
            case 'logs':
                await this.loadLogs();
                break;
            case 'import':
                // Página de importación, no necesita carga adicional
                break;
        }
    }

    async loadDashboard() {
        try {
            console.log('📊 Cargando dashboard...');

            // Cargar estadísticas
            const statsResponse = await fetch(`${this.apiUrl}/mantenimientos/stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateStats(stats);
            }

            // Cargar mantenimientos urgentes
            const urgentResponse = await fetch(`${this.apiUrl}/mantenimientos?prioridad=alta&estado=pendiente&limit=5`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (urgentResponse.ok) {
                const urgent = await urgentResponse.json();
                this.displayUrgentMaintenance(urgent);
            }

            // Cargar mantenimientos de próxima semana
            const nextWeekResponse = await fetch(`${this.apiUrl}/mantenimientos?estado=pendiente&limit=5`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (nextWeekResponse.ok) {
                const allPending = await nextWeekResponse.json();
                const nextWeek = allPending.filter(m => {
                    const fecha = new Date(m.proximo_servicio);
                    const hoy = new Date();
                    const unaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return fecha <= unaSemana;
                }).slice(0, 5);

                this.displayNextWeekMaintenance(nextWeek);
            }

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showError('Error al cargar el dashboard');
        }
    }

    updateStats(stats) {
        const elements = {
            totalCount: stats.total || 0,
            pendingCount: stats.pendientes || 0,
            completedCount: stats.completados || 0,
            overdueCount: stats.vencidos || 0,
            statPending: stats.pendientes || 0,
            statDueSoon: stats.por_vencer || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    displayUrgentMaintenance(mantenimientos) {
        const container = document.getElementById('urgentList');
        if (!container) return;

        if (!mantenimientos || mantenimientos.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay mantenimientos urgentes</p>';
            return;
        }

        let html = '';
        mantenimientos.forEach(m => {
            const fecha = new Date(m.proximo_servicio).toLocaleDateString('es-ES');
            const hoy = new Date();
            const fechaProxima = new Date(m.proximo_servicio);
            const diasRestantes = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));

            html += `
                <div class="maintenance-item" data-id="${m.id}">
                    <div class="maintenance-info">
                        <h4>${m.equipo}</h4>
                        <p>${m.area} - Vence: ${fecha}</p>
                    </div>
                    <div>
                        <span class="maintenance-status ${diasRestantes < 0 ? 'status-overdue' : 'status-pending'}">
                            ${diasRestantes < 0 ? 'VENCIDO' : `${diasRestantes} días`}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners
        container.querySelectorAll('.maintenance-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.showMaintenanceDetails(id);
            });
        });
    }

    displayNextWeekMaintenance(mantenimientos) {
        const container = document.getElementById('nextWeekList');
        if (!container) return;

        if (!mantenimientos || mantenimientos.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay mantenimientos programados para la próxima semana</p>';
            return;
        }

        let html = '';
        mantenimientos.forEach(m => {
            const fecha = new Date(m.proximo_servicio).toLocaleDateString('es-ES');

            html += `
                <div class="maintenance-item" data-id="${m.id}">
                    <div class="maintenance-info">
                        <h4>${m.equipo}</h4>
                        <p>${m.area} - ${fecha}</p>
                    </div>
                    <div>
                        <span class="badge badge-${m.prioridad}">
                            ${m.prioridad.toUpperCase()}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners
        container.querySelectorAll('.maintenance-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.showMaintenanceDetails(id);
            });
        });
    }

    async loadMaintenanceTable(page = 1) {
        try {
            const container = document.getElementById('maintenanceTableBody');
            if (!container) return;

            container.innerHTML = '<tr><td colspan="8" class="text-center">Cargando...</td></tr>';

            // Construir URL con filtros
            let url = `${this.apiUrl}/mantenimientos?`;
            const params = new URLSearchParams();

            const status = document.getElementById('filterStatus')?.value;
            const area = document.getElementById('filterArea')?.value;
            const priority = document.getElementById('filterPriority')?.value;
            const search = document.getElementById('searchInput')?.value;

            if (status) params.append('estado', status);
            if (area) params.append('area', area);
            if (priority) params.append('prioridad', priority);
            if (search) params.append('search', search);

            url += params.toString();

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar mantenimientos');
            }

            const mantenimientos = await response.json();
            this.displayMaintenanceTable(mantenimientos);

        } catch (error) {
            console.error('❌ Error cargando mantenimientos:', error);
            const container = document.getElementById('maintenanceTableBody');
            if (container) {
                container.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar los datos</td></tr>';
            }
        }
    }

    displayMaintenanceTable(mantenimientos) {
        const tbody = document.getElementById('maintenanceTableBody');
        if (!tbody) return;

        if (!mantenimientos || mantenimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron mantenimientos</td></tr>';
            return;
        }

        let html = '';
        mantenimientos.forEach(m => {
            const ultimoServicio = new Date(m.ultimo_servicio).toLocaleDateString('es-ES');
            const proximoServicio = new Date(m.proximo_servicio).toLocaleDateString('es-ES');
            const hoy = new Date();
            const fechaProxima = new Date(m.proximo_servicio);
            const diasRestantes = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));

            let fechaClass = '';
            if (diasRestantes < 0) fechaClass = 'text-danger';
            else if (diasRestantes <= 3) fechaClass = 'text-warning';

            html += `
                <tr>
                    <td>${m.codigo || 'N/A'}</td>
                    <td><strong>${m.equipo}</strong></td>
                    <td>${m.area}</td>
                    <td>${ultimoServicio}</td>
                    <td class="${fechaClass}">${proximoServicio}</td>
                    <td><span class="badge badge-${m.estado}">${m.estado.toUpperCase()}</span></td>
                    <td><span class="badge badge-${m.prioridad}">${m.prioridad.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-action btn-view" data-id="${m.id}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" data-id="${m.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Agregar event listeners a los botones
        tbody.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.showMaintenanceDetails(id);
            });
        });

        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editMaintenance(id);
            });
        });
    }

    async loadLogs(page = 1) {
        try {
            const container = document.getElementById('logsTableBody');
            if (!container) return;

            container.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

            const limit = 20;
            const offset = (page - 1) * limit;

            const response = await fetch(`${this.apiUrl}/logs?limit=${limit}&offset=${offset}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar logs');
            }

            const data = await response.json();
            this.displayLogs(data.logs || []);

        } catch (error) {
            console.error('❌ Error cargando logs:', error);
            const container = document.getElementById('logsTableBody');
            if (container) {
                container.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar el historial</td></tr>';
            }
        }
    }

    displayLogs(logs) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros en el historial</td></tr>';
            return;
        }

        let html = '';
        logs.forEach(log => {
            const fecha = new Date(log.fecha_registro).toLocaleString('es-ES');
            const accionClass = log.accion.toLowerCase().includes('realizado') ? 'success' :
                log.accion.toLowerCase().includes('reprogramar') ? 'warning' :
                    log.accion.toLowerCase().includes('import') ? 'info' : 'secondary';

            html += `
                <tr>
                    <td>${fecha}</td>
                    <td>${log.equipo || 'SISTEMA'}</td>
                    <td><span class="badge badge-${accionClass}">${log.accion}</span></td>
                    <td>${log.valor_anterior || '-'}</td>
                    <td>${log.valor_nuevo || '-'}</td>
                    <td>${log.usuario || '-'}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    async loadAreas() {
        try {
            const response = await fetch(`${this.apiUrl}/mantenimientos`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) return;

            const mantenimientos = await response.json();
            const areas = [...new Set(mantenimientos.map(m => m.area).filter(Boolean))];

            const filterArea = document.getElementById('filterArea');
            if (filterArea) {
                // Mantener el valor actual
                const currentValue = filterArea.value;

                // Limpiar opciones excepto la primera
                while (filterArea.options.length > 1) {
                    filterArea.remove(1);
                }

                // Agregar nuevas áreas
                areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    filterArea.appendChild(option);
                });

                // Restaurar valor anterior si existe
                if (areas.includes(currentValue)) {
                    filterArea.value = currentValue;
                }
            }

        } catch (error) {
            console.error('❌ Error cargando áreas:', error);
        }
    }

    async showMaintenanceDetails(id) {
        try {
            const response = await fetch(`${this.apiUrl}/mantenimientos/${id}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar detalles');
            }

            const mantenimiento = await response.json();
            this.showDetailsModal(mantenimiento);

        } catch (error) {
            console.error('❌ Error cargando detalles:', error);
            this.showError('Error al cargar detalles del mantenimiento');
        }
    }

    showDetailsModal(mantenimiento) {
        const modal = document.getElementById('detailsModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) return;

        // Formatear fechas
        const ultimoServicio = new Date(mantenimiento.ultimo_servicio).toLocaleDateString('es-ES');
        const proximoServicio = new Date(mantenimiento.proximo_servicio).toLocaleDateString('es-ES');
        const hoy = new Date();
        const fechaProxima = new Date(mantenimiento.proximo_servicio);
        const diasRestantes = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));

        modalTitle.textContent = mantenimiento.equipo;

        let fechaProximaHTML = proximoServicio;
        if (diasRestantes < 0) {
            fechaProximaHTML += ` <span class="text-danger">(Vencido hace ${Math.abs(diasRestantes)} días)</span>`;
        } else if (diasRestantes === 0) {
            fechaProximaHTML += ` <span class="text-warning">(Hoy)</span>`;
        } else if (diasRestantes === 1) {
            fechaProximaHTML += ` <span class="text-warning">(Mañana)</span>`;
        } else if (diasRestantes <= 3) {
            fechaProximaHTML += ` <span class="text-warning">(En ${diasRestantes} días)</span>`;
        }

        modalBody.innerHTML = `
            <div class="maintenance-details">
                <div class="detail-row">
                    <span class="detail-label">Código:</span>
                    <span class="detail-value">${mantenimiento.codigo || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Área:</span>
                    <span class="detail-value">${mantenimiento.area}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ubicación:</span>
                    <span class="detail-value">${mantenimiento.ubicacion || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Descripción:</span>
                    <span class="detail-value">${mantenimiento.descripcion || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Último Servicio:</span>
                    <span class="detail-value">${ultimoServicio}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Próximo Servicio:</span>
                    <span class="detail-value">${fechaProximaHTML}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Período:</span>
                    <span class="detail-value">${mantenimiento.periodo_dias} días</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">
                        <span class="badge badge-${mantenimiento.estado}">
                            ${mantenimiento.estado.toUpperCase()}
                        </span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Prioridad:</span>
                    <span class="detail-value">
                        <span class="badge badge-${mantenimiento.prioridad}">
                            ${mantenimiento.prioridad.toUpperCase()}
                        </span>
                    </span>
                </div>
            </div>
        `;

        // Configurar botones de acción
        const markCompletedBtn = document.getElementById('markCompletedBtn');
        const rescheduleBtn = document.getElementById('rescheduleBtn');

        if (markCompletedBtn) {
            markCompletedBtn.onclick = () => this.showCompleteModal(mantenimiento);
        }

        if (rescheduleBtn) {
            rescheduleBtn.onclick = () => this.showRescheduleModal(mantenimiento);
        }

        // Mostrar modal
        modal.classList.add('active');
    }

    showCompleteModal(mantenimiento) {
        const modal = document.getElementById('detailsModal');
        const completeModal = document.getElementById('completeModal');

        if (modal) modal.classList.remove('active');
        if (completeModal) {
            completeModal.classList.add('active');

            // Configurar fecha por defecto (hoy)
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('completionDate');
            if (dateInput) dateInput.value = today;

            // Configurar botón de confirmación
            const confirmBtn = document.getElementById('confirmCompleteBtn');
            if (confirmBtn) {
                confirmBtn.onclick = () => this.completeMaintenance(mantenimiento.id);
            }
        }
    }

    showRescheduleModal(mantenimiento) {
        const modal = document.getElementById('detailsModal');
        const rescheduleModal = document.getElementById('rescheduleModal');

        if (modal) modal.classList.remove('active');
        if (rescheduleModal) {
            rescheduleModal.classList.add('active');

            // Configurar fecha mínima (mañana)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const minDate = tomorrow.toISOString().split('T')[0];

            const dateInput = document.getElementById('newDate');
            if (dateInput) {
                dateInput.min = minDate;
                dateInput.value = minDate;
            }

            // Configurar botón de confirmación
            const confirmBtn = document.getElementById('confirmRescheduleBtn');
            if (confirmBtn) {
                confirmBtn.onclick = () => this.rescheduleMaintenance(mantenimiento.id);
            }
        }
    }

    async completeMaintenance(id) {
        const fechaInput = document.getElementById('completionDate');
        const notasInput = document.getElementById('completionNotes');

        if (!fechaInput || !fechaInput.value) {
            this.showError('Por favor, seleccione una fecha');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/mantenimientos/${id}/complete`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha_realizacion: fechaInput.value,
                    notas: notasInput ? notasInput.value : ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al completar mantenimiento');
            }

            this.showSuccess('Mantenimiento marcado como realizado');
            this.closeAllModals();

            // Recargar datos
            this.loadDashboard();
            this.loadMaintenanceTable();

        } catch (error) {
            console.error('❌ Error completando mantenimiento:', error);
            this.showError(error.message);
        }
    }

    async rescheduleMaintenance(id) {
        const fechaInput = document.getElementById('newDate');
        const motivoInput = document.getElementById('rescheduleReason');

        if (!fechaInput || !fechaInput.value) {
            this.showError('Por favor, seleccione una nueva fecha');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/mantenimientos/${id}/reschedule`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nueva_fecha: fechaInput.value,
                    motivo: motivoInput ? motivoInput.value : ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al reprogramar mantenimiento');
            }

            this.showSuccess('Mantenimiento reprogramado correctamente');
            this.closeAllModals();

            // Recargar datos
            this.loadDashboard();
            this.loadMaintenanceTable();

        } catch (error) {
            console.error('❌ Error reprogramando mantenimiento:', error);
            this.showError(error.message);
        }
    }

    async importCSV() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput?.files[0];

        if (!file) {
            this.showError('Por favor, seleccione un archivo CSV');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Mostrar progreso
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressContainer) progressContainer.style.display = 'flex';
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        try {
            // Simular progreso
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (progress > 90) progress = 90;
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${progress}%`;
            }, 200);

            const response = await fetch(`${this.apiUrl}/mantenimientos/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al importar archivo');
            }

            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '100%';

            const result = await response.json();

            setTimeout(() => {
                this.showSuccess(`Importados ${result.count} mantenimientos correctamente`);
                if (progressContainer) progressContainer.style.display = 'none';

                // Resetear formulario
                if (fileInput) fileInput.value = '';
                const fileName = document.getElementById('fileName');
                if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
                const importBtn = document.getElementById('importBtn');
                if (importBtn) importBtn.disabled = true;

                // Recargar datos
                this.loadDashboard();
                this.loadMaintenanceTable();
                this.loadAreas();

            }, 500);

        } catch (error) {
            console.error('❌ Error importando CSV:', error);
            this.showError(error.message);
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }

    showNewMaintenanceForm() {
        // Implementación básica - puedes expandir esto
        alert('Funcionalidad de nuevo mantenimiento en desarrollo. Por ahora, usa la importación CSV.');
    }

    editMaintenance(id) {
        // Implementación básica - puedes expandir esto
        alert(`Editar mantenimiento ${id} - Funcionalidad en desarrollo`);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 3000;
            min-width: 300px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        const icon = type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle';

        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Agregar estilos de animación si no existen
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    window.maintenanceApp = new MaintenanceApp();
});

class UIService {
    constructor() {
        this.injectStyles();
    }

    injectStyles() {
        if (!document.getElementById('ui-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .toast-notification {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 3000;
                    min-width: 300px;
                    max-width: 400px;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideIn 0.3s ease;
                    color: white;
                    font-weight: 500;
                }
                .toast-success { background: linear-gradient(135deg, #2eb85c, #1b9e3e); }
                .toast-error { background: linear-gradient(135deg, #e55353, #c0392b); }
                .toast-info { background: linear-gradient(135deg, #3399ff, #2980b9); }
            `;
            document.head.appendChild(style);
        }
    }

    showToast(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;

        const icon = type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle';

        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getSkeletonHTML(type, count = 1) {
        let html = '';
        for (let i = 0; i < count; i++) {
            if (type === 'table') {
                html += `
                    <tr>
                        <td colspan="100%">
                            <div style="display: flex; gap: 1rem; align-items: center; padding: 0.5rem 0;">
                                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 8px;"></div>
                                <div style="flex: 1">
                                    <div class="skeleton" style="width: 30%; height: 16px; margin-bottom: 8px;"></div>
                                    <div class="skeleton" style="width: 50%; height: 12px;"></div>
                                </div>
                                <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
                            </div>
                        </td>
                    </tr>
                `;
            } else if (type === 'card') {
                html += `
                    <div class="maintenance-item">
                        <div style="width: 100%">
                            <div class="skeleton" style="width: 60%; height: 18px; margin-bottom: 8px;"></div>
                            <div class="skeleton" style="width: 40%; height: 14px;"></div>
                        </div>
                    </div>
                `;
            }
        }
        return html;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    daysUntil(dateString) {
        const target = new Date(dateString);
        const today = new Date();
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }
}

export const ui = new UIService();

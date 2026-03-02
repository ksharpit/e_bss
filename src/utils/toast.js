// ============================================
// Toast Notification Utility
// ============================================

let toastContainer = null;

function ensureContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showToast(message, type = 'info', duration = 3000) {
    const container = ensureContainer();
    const toast = document.createElement('div');

    const colors = {
        success: { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d', icon: 'check_circle' },
        error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: 'error' },
        warning: { bg: '#fefce8', border: '#fde68a', text: '#a16207', icon: 'warning' },
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', icon: 'info' },
    };
    const c = colors[type] || colors.info;

    toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    padding:12px 20px;border-radius:12px;
    background:${c.bg};border:1px solid ${c.border};
    color:${c.text};font-size:14px;font-weight:600;
    box-shadow:0 8px 30px rgba(0,0,0,0.12);
    pointer-events:auto;cursor:pointer;
    animation:slideInRight 0.3s ease;
    font-family:Inter,system-ui,sans-serif;
    max-width:360px;
  `;
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${c.icon}</span> ${message}`;

    container.appendChild(toast);

    toast.addEventListener('click', () => removeToast(toast));
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight { from { transform:translateX(100%);opacity:0 } to { transform:translateX(0);opacity:1 } }
  @keyframes slideOutRight { from { transform:translateX(0);opacity:1 } to { transform:translateX(100%);opacity:0 } }
`;
document.head.appendChild(style);

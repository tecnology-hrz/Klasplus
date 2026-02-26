// Crear el HTML de las notificaciones si no existe
const createNotificationHTML = () => {
    if (!document.getElementById('notificationOverlay')) {
        const notificationHTML = `
            <!-- Notificación -->
            <div class="notification-overlay" id="notificationOverlay">
                <div class="notification-box">
                    <div class="notification-icon" id="notificationIcon">
                        <svg id="notificationSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2 class="notification-title" id="notificationTitle">Título</h2>
                    <p class="notification-message" id="notificationMessage">Mensaje</p>
                    <button class="notification-button" id="notificationButton">Aceptar</button>
                </div>
            </div>

            <!-- Confirmación -->
            <div class="notification-overlay" id="confirmOverlay">
                <div class="notification-box">
                    <div class="notification-icon warning" id="confirmIcon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2 class="notification-title" id="confirmTitle">Confirmar</h2>
                    <p class="notification-message" id="confirmMessage">¿Estás seguro?</p>
                    <div class="notification-buttons">
                        <button class="notification-button cancel" id="confirmCancelButton">Cancelar</button>
                        <button class="notification-button confirm" id="confirmAcceptButton">Aceptar</button>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-spinner"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', notificationHTML);

        // Event listener para cerrar notificación
        document.getElementById('notificationButton').addEventListener('click', () => {
            hideNotification();
        });
    }
};

// Mostrar notificación genérica
export const showNotification = (message, type = 'success') => {
    if (type === 'success') {
        showSuccessNotification('Éxito', message);
    } else if (type === 'error') {
        showErrorNotification('Error', message);
    } else if (type === 'info') {
        showInfoNotification('Información', message);
    }
};

// Mostrar notificación de información
export const showInfoNotification = (title, message) => {
    createNotificationHTML();
    
    const overlay = document.getElementById('notificationOverlay');
    const icon = document.getElementById('notificationIcon');
    const svg = document.getElementById('notificationSvg');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const button = document.getElementById('notificationButton');

    // Configurar como info
    icon.className = 'notification-icon info';
    button.className = 'notification-button info';
    
    // Icono de info
    svg.innerHTML = `
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    `;

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Mostrar
    overlay.classList.add('active');

    // Reset callback
    button.onclick = () => {
        hideNotification();
    };
};

// Mostrar notificación de éxito
export const showSuccessNotification = (title, message, callback) => {
    createNotificationHTML();
    
    const overlay = document.getElementById('notificationOverlay');
    const icon = document.getElementById('notificationIcon');
    const svg = document.getElementById('notificationSvg');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const button = document.getElementById('notificationButton');

    // Configurar como éxito
    icon.className = 'notification-icon success';
    button.className = 'notification-button success';
    
    // Icono de check
    svg.innerHTML = `
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    `;

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Mostrar
    overlay.classList.add('active');

    // Callback al cerrar
    if (callback) {
        button.onclick = () => {
            hideNotification();
            callback();
        };
    }
};

// Mostrar notificación de error
export const showErrorNotification = (title, message) => {
    createNotificationHTML();
    
    const overlay = document.getElementById('notificationOverlay');
    const icon = document.getElementById('notificationIcon');
    const svg = document.getElementById('notificationSvg');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const button = document.getElementById('notificationButton');

    // Configurar como error
    icon.className = 'notification-icon error';
    button.className = 'notification-button error';
    
    // Icono de X
    svg.innerHTML = `
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    `;

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Mostrar
    overlay.classList.add('active');

    // Reset callback
    button.onclick = () => {
        hideNotification();
    };
};

// Ocultar notificación
const hideNotification = () => {
    const overlay = document.getElementById('notificationOverlay');
    overlay.classList.remove('active');
};

// Mostrar loading
export const showLoading = () => {
    createNotificationHTML();
    const loading = document.getElementById('loadingOverlay');
    loading.classList.add('active');
};

// Ocultar loading
export const hideLoading = () => {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.classList.remove('active');
    }
};

// Mostrar confirmación personalizada
export const showConfirm = (title, message) => {
    return new Promise((resolve) => {
        createNotificationHTML();
        
        const overlay = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancelButton');
        const acceptBtn = document.getElementById('confirmAcceptButton');

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Mostrar overlay
        overlay.classList.add('active');

        // Manejadores de eventos
        const handleCancel = () => {
            overlay.classList.remove('active');
            cancelBtn.removeEventListener('click', handleCancel);
            acceptBtn.removeEventListener('click', handleAccept);
            resolve(false);
        };

        const handleAccept = () => {
            overlay.classList.remove('active');
            cancelBtn.removeEventListener('click', handleCancel);
            acceptBtn.removeEventListener('click', handleAccept);
            resolve(true);
        };

        cancelBtn.addEventListener('click', handleCancel);
        acceptBtn.addEventListener('click', handleAccept);
    });
};

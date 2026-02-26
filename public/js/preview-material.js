import { showConfirm } from './notifications.js';

// Inicializar Plyr para el video de introducción
const introPlayer = new Plyr('#videoIntro', {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'],
    settings: ['quality', 'speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
    ratio: null,
    fullscreen: { enabled: true, fallback: true, iosNative: true },
    hideControls: true,
    resetOnEnd: false,
    disableContextMenu: true,
    keyboard: { focused: true, global: false }
});

// Inicializar Plyr para el video del modal
let modalPlayer = null;

// Toggle sidebar
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');
const header = document.querySelector('.header');
const logoFull = document.getElementById('logoFull');
const logoIcon = document.getElementById('logoIcon');
const iconHamburger = document.getElementById('iconHamburger');
const iconArrow = document.getElementById('iconArrow');
let sidebarCollapsed = false;

// Función para actualizar el estado del sidebar según el tamaño de pantalla
function updateSidebarState() {
    if (window.innerWidth <= 1024) {
        sidebar.style.transform = 'translateX(-100%)';
        mainContent.style.marginLeft = '0';
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        header.classList.remove('sidebar-collapsed');
        logoFull.style.display = 'block';
        logoIcon.style.display = 'none';
        iconHamburger.style.display = 'block';
        iconArrow.style.display = 'none';
    } else {
        sidebar.style.transform = 'translateX(0)';
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            header.classList.add('sidebar-collapsed');
            logoFull.style.display = 'none';
            logoIcon.style.display = 'block';
            iconHamburger.style.display = 'none';
            iconArrow.style.display = 'block';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            header.classList.remove('sidebar-collapsed');
            logoFull.style.display = 'block';
            logoIcon.style.display = 'none';
            iconHamburger.style.display = 'block';
            iconArrow.style.display = 'none';
        }
    }
}

updateSidebarState();
window.addEventListener('resize', updateSidebarState);

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (window.innerWidth <= 1024) {
        if (sidebar.style.transform === 'translateX(-100%)' || sidebar.style.transform === '') {
            sidebar.style.transform = 'translateX(0)';
        } else {
            sidebar.style.transform = 'translateX(-100%)';
        }
    } else {
        sidebarCollapsed = !sidebarCollapsed;
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            header.classList.add('sidebar-collapsed');
            logoFull.style.display = 'none';
            logoIcon.style.display = 'block';
            iconHamburger.style.display = 'none';
            iconArrow.style.display = 'block';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            header.classList.remove('sidebar-collapsed');
            logoFull.style.display = 'block';
            logoIcon.style.display = 'none';
            iconHamburger.style.display = 'block';
            iconArrow.style.display = 'none';
        }
    }
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    }
});

// Modal de video
const videoModal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const closeVideoModal = document.getElementById('closeVideoModal');

function openVideoModal(videoSrc) {
    modalVideo.querySelector('source').src = videoSrc;
    modalVideo.load();
    
    // Inicializar Plyr si no existe
    if (!modalPlayer) {
        modalPlayer = new Plyr('#modalVideo', {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'],
            settings: ['quality', 'speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
            ratio: null,
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            hideControls: true,
            resetOnEnd: false,
            disableContextMenu: true,
            keyboard: { focused: true, global: false }
        });
    }
    
    videoModal.classList.add('active');
    modalPlayer.play();
}

function closeModal() {
    videoModal.classList.remove('active');
    if (modalPlayer) {
        modalPlayer.pause();
        modalPlayer.currentTime = 0;
    }
}

closeVideoModal.addEventListener('click', closeModal);

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal.classList.contains('active')) {
        closeModal();
    }
});

// Verificar si el usuario está logueado
function checkUserSession() {
    const userSession = localStorage.getItem('userSession');
    const lockedOverlay = document.getElementById('lockedOverlay');
    const capsulasGrid = document.getElementById('capsulasGrid');
    const authButtons = document.getElementById('authButtons');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userSession) {
        const userData = JSON.parse(userSession);
        
        // Mostrar menú de usuario y ocultar botones de auth
        authButtons.style.display = 'none';
        userDropdown.style.display = 'flex';
        
        // Ocultar overlay de bloqueo
        lockedOverlay.style.display = 'none';
        
        // Habilitar clicks en las cápsulas
        const capsulaCards = document.querySelectorAll('.capsula-card');
        capsulaCards.forEach(card => {
            card.style.pointerEvents = 'auto';
            card.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video');
                openVideoModal(videoSrc);
            });
        });
        
        // Actualizar información del usuario
        document.getElementById('userName').textContent = userData.nombre || 'Usuario';
        document.getElementById('userRole').textContent = userData.tipoUsuario || 'Estudiante';
        
        // Enlace dinámico al dashboard
        const linkDashboard = document.getElementById('linkDashboard');
        if (linkDashboard) {
            const rutasDashboard = {
                'estudiante': 'dashboard-estudiante.html',
                'acudiente': 'dashboard-acudiente.html',
                'institucion': 'dashboard-institucion.html',
                'coordinador': 'dashboard-coordinador.html',
                'profesor': 'dashboard-profesor.html',
                'admin': 'dashboard-admin.html'
            };
            linkDashboard.href = rutasDashboard[userData.tipoUsuario] || 'dashboard-estudiante.html';
        }
        
        // Mostrar foto de perfil si existe
        if (userData.fotoPerfil) {
            const headerImg = document.getElementById('headerAvatarImg');
            const headerPlaceholder = document.querySelector('#headerAvatarContainer .avatar-placeholder');
            if (headerImg) {
                headerImg.src = userData.fotoPerfil;
                headerImg.style.display = 'block';
                if (headerPlaceholder) headerPlaceholder.style.display = 'none';
            }
        }
    } else {
        // Mostrar botones de auth y ocultar menú de usuario
        authButtons.style.display = 'flex';
        userDropdown.style.display = 'none';
        
        // Mostrar overlay de bloqueo
        lockedOverlay.style.display = 'flex';
        
        // Deshabilitar clicks en las cápsulas
        const capsulaCards = document.querySelectorAll('.capsula-card');
        capsulaCards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.6';
        });
    }
}

// Toggle del menú desplegable de usuario
const userDropdownElement = document.getElementById('userDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

if (userDropdownElement) {
    userDropdownElement.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
}

document.addEventListener('click', (e) => {
    if (userDropdownElement && !userDropdownElement.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await showConfirm('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?');
        if (confirmado) {
            localStorage.removeItem('userSession');
            window.location.href = 'campus.html';
        }
    });
}

// ===== Modal de inicio de sesión =====
const loginModal = document.getElementById('loginModal');
const btnLoginModal = document.getElementById('btnLoginModal');
const closeModalLogin = document.getElementById('closeModal');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');

// Abrir modal de login
if (btnLoginModal) {
    btnLoginModal.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
}

// También abrir desde el botón del overlay de bloqueo
const btnLoginOverlay = document.getElementById('btnLoginOverlay');
if (btnLoginOverlay) {
    btnLoginOverlay.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
}

// Cerrar modal de login
if (closeModalLogin) {
    closeModalLogin.addEventListener('click', () => {
        loginModal.classList.remove('active');
    });
}

// Cerrar modal al hacer clic fuera
if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
    });
}

// Toggle mostrar/ocultar contraseña
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });
}

// Verificar sesión al cargar la página
checkUserSession();

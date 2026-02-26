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
        // En móvil/tablet, el sidebar se oculta completamente
        sidebar.style.transform = 'translateX(-100%)';
        mainContent.style.marginLeft = '0';
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        header.classList.remove('sidebar-collapsed');
        // Mostrar logo completo y hamburguesa en móvil
        logoFull.style.display = 'block';
        logoIcon.style.display = 'none';
        iconHamburger.style.display = 'block';
        iconArrow.style.display = 'none';
    } else {
        // En desktop, el sidebar está visible
        sidebar.style.transform = 'translateX(0)';
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            header.classList.add('sidebar-collapsed');
            // Mostrar logo icon y flecha cuando está colapsado
            logoFull.style.display = 'none';
            logoIcon.style.display = 'block';
            iconHamburger.style.display = 'none';
            iconArrow.style.display = 'block';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            header.classList.remove('sidebar-collapsed');
            // Mostrar logo completo y hamburguesa cuando está expandido
            logoFull.style.display = 'block';
            logoIcon.style.display = 'none';
            iconHamburger.style.display = 'block';
            iconArrow.style.display = 'none';
        }
    }
}

// Inicializar estado al cargar
updateSidebarState();

// Actualizar al cambiar tamaño de ventana
window.addEventListener('resize', updateSidebarState);

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (window.innerWidth <= 1024) {
        // En móvil/tablet, toggle show/hide
        if (sidebar.style.transform === 'translateX(-100%)' || sidebar.style.transform === '') {
            sidebar.style.transform = 'translateX(0)';
        } else {
            sidebar.style.transform = 'translateX(-100%)';
        }
    } else {
        // En desktop, toggle collapse/expand
        sidebarCollapsed = !sidebarCollapsed;
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            header.classList.add('sidebar-collapsed');
            // Cambiar a logo icon y flecha
            logoFull.style.display = 'none';
            logoIcon.style.display = 'block';
            iconHamburger.style.display = 'none';
            iconArrow.style.display = 'block';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            header.classList.remove('sidebar-collapsed');
            // Cambiar a logo completo y hamburguesa
            logoFull.style.display = 'block';
            logoIcon.style.display = 'none';
            iconHamburger.style.display = 'block';
            iconArrow.style.display = 'none';
        }
    }
});

// Cerrar sidebar al hacer clic fuera de él en pantallas pequeñas
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    }
});

// Click en tarjetas de usuario
const usuarioCards = document.querySelectorAll('.usuario-card');

usuarioCards.forEach(card => {
    card.addEventListener('click', () => {
        const tipo = card.getAttribute('data-tipo');
        console.log(`Usuario seleccionado: ${tipo}`);
        
        // Redirigir a la página de registro correspondiente
        if (tipo === 'acudiente') {
            window.location.href = 'registro-acudiente.html';
        } else if (tipo === 'estudiante') {
            window.location.href = 'registro-estudiante.html';
        } else if (tipo === 'institucion') {
            window.location.href = 'registro-institucion.html';
        } else if (tipo === 'admin') {
            window.location.href = 'registro-admin.html';
        }
    });
});

// Hover effect para el enlace de administrador
const adminLink = document.querySelector('a[href="registro-admin.html"]');
if (adminLink) {
    adminLink.addEventListener('mouseenter', function() {
        this.style.background = '#0088cc';
        this.style.color = 'white';
    });
    adminLink.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.color = '#0088cc';
    });
}

// Modal de inicio de sesión
const loginModal = document.getElementById('loginModal');
const btnLogin = document.querySelector('.btn-login');
const closeModal = document.getElementById('closeModal');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');

// Abrir modal
btnLogin.addEventListener('click', () => {
    loginModal.classList.add('active');
});

// Cerrar modal
closeModal.addEventListener('click', () => {
    loginModal.classList.remove('active');
});

// Cerrar modal al hacer clic fuera
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
    }
});

// Toggle mostrar/ocultar contraseña
togglePassword.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
});

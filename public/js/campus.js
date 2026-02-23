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

// Animación suave al cargar
window.addEventListener('load', () => {
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(100px)';
    
    setTimeout(() => {
        heroContent.style.transition = 'all 0.8s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 100);
});

// Cambiar entre secciones
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Agregar active al item clickeado
        item.classList.add('active');
        
        // Obtener la sección a mostrar
        const sectionId = item.getAttribute('data-section');
        
        // Ocultar todas las secciones
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Mostrar la sección seleccionada
        document.getElementById(sectionId).classList.add('active');
    });
});

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

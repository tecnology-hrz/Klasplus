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
const inicioSection = document.getElementById('inicioSection');
const cursosSection = document.getElementById('cursosSection');
const materialApoyoSection = document.getElementById('materialApoyoSection');

navItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Agregar active al item clickeado
        item.classList.add('active');
        
        // Mostrar la sección correspondiente
        if (index === 0) {
            // Inicio
            inicioSection.style.display = 'block';
            cursosSection.style.display = 'none';
            materialApoyoSection.style.display = 'none';
        } else if (index === 1) {
            // Cursos
            inicioSection.style.display = 'none';
            cursosSection.style.display = 'block';
            materialApoyoSection.style.display = 'none';
        } else if (index === 2) {
            // Material de Apoyo
            inicioSection.style.display = 'none';
            cursosSection.style.display = 'none';
            materialApoyoSection.style.display = 'block';
        }
        
        // Cerrar sidebar en móvil después de seleccionar
        if (window.innerWidth <= 1024) {
            sidebar.style.transform = 'translateX(-100%)';
        }
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

// Verificar si el usuario está logueado
function checkUserSession() {
    const userSession = localStorage.getItem('userSession');
    const authButtons = document.getElementById('authButtons');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userSession) {
        const userData = JSON.parse(userSession);
        
        authButtons.style.display = 'none';
        userDropdown.style.display = 'flex';
        
        document.getElementById('userName').textContent = userData.nombre || 'Usuario';
        document.getElementById('userRole').textContent = userData.tipoUsuario || 'Estudiante';
        
        // Enlace dinámico al dashboard según tipo de usuario
        const linkDashboard = document.getElementById('linkDashboard');
        if (linkDashboard) {
            const rutasDashboard = {
                'estudiante': 'dashboard-estudiante.html',
                'acudiente': 'dashboard-acudiente.html',
                'institucion': 'dashboard-institucion.html',
                'profesor': 'dashboard-profesor.html'
            };
            linkDashboard.href = rutasDashboard[userData.tipoUsuario] || 'dashboard-estudiante.html';
        }
        
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

// Cerrar el menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (userDropdownElement && !userDropdownElement.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('userSession');
            window.location.reload();
        }
    });
}

// Verificar sesión al cargar la página
checkUserSession();

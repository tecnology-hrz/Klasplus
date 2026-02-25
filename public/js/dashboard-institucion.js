import { db, collection, getDocs, query, where } from './firebase-config.js';
import { showConfirm } from './notifications.js';

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let nombreInstitucion = '';

// ==========================================
// SIDEBAR Y MENÚ MÓVIL
// ==========================================
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

const toggleSidebar = () => {
    sidebar.classList.toggle('active');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

document.querySelectorAll('.sidebar .nav-item:not(.expandable)').forEach(enlace => {
    enlace.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
});

// ==========================================
// MENÚ EXPANDIBLE
// ==========================================
document.querySelectorAll('.nav-item.expandable').forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('active');
        item.nextElementSibling.classList.toggle('show');
    });
});

// ==========================================
// MENÚ DESPLEGABLE DE USUARIO
// ==========================================
const userDropdown = document.getElementById('userDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

if (userDropdown) {
    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
}

document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// ==========================================
// CERRAR SESIÓN
// ==========================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await showConfirm('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?');
        if (confirmado) {
            localStorage.removeItem('userSession');
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    });
}

// ==========================================
// CARGAR DATOS DEL USUARIO
// ==========================================
async function cargarDatosUsuario() {
    const sesionUsuario = localStorage.getItem('userSession');
    
    if (!sesionUsuario) {
        window.location.href = '../../index.html';
        return;
    }
    
    const datosUsuario = JSON.parse(sesionUsuario);
    
    try {
        const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
        const resultado = await getDocs(q);
        
        if (!resultado.empty) {
            const datosDB = resultado.docs[0].data();
            
            nombreInstitucion = datosDB.institucionNombre || datosDB.nombre || datosDB.nombreCompleto || 'Institución';
            const tipoUsuario = datosDB.tipoUsuario || 'Institución';
            
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = nombreInstitucion;
            if (rolElemento) rolElemento.textContent = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1);
            
            const fotoPerfil = datosDB.fotoPerfil;
            if (fotoPerfil) {
                const headerImg = document.getElementById('headerAvatarImg');
                const headerPlaceholder = document.querySelector('#headerAvatarContainer .avatar-placeholder');
                if (headerImg) {
                    headerImg.src = fotoPerfil;
                    headerImg.style.display = 'block';
                    if (headerPlaceholder) headerPlaceholder.style.display = 'none';
                }
                const sesion = JSON.parse(sesionUsuario);
                sesion.fotoPerfil = fotoPerfil;
                localStorage.setItem('userSession', JSON.stringify(sesion));
            }
            
            // Cargar estadísticas después de obtener el nombre de la institución
            await cargarEstadisticas();
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// ==========================================
// CARGAR ESTADÍSTICAS REALES
// ==========================================
async function cargarEstadisticas() {
    try {
        // Obtener todos los usuarios
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        
        let totalEstudiantes = 0;
        let totalCoordinadores = 0;
        
        usuariosSnapshot.forEach(doc => {
            const datos = doc.data();
            const institucionUsuario = datos.institucion || datos.institucionNombre;
            
            // Solo contar usuarios de esta institución
            if (institucionUsuario === nombreInstitucion) {
                if (datos.tipoUsuario === 'estudiante') {
                    totalEstudiantes++;
                } else if (datos.tipoUsuario === 'coordinador') {
                    totalCoordinadores++;
                }
            }
        });
        
        // Actualizar el gráfico de dona
        actualizarGraficoEstudiantes(totalEstudiantes, totalCoordinadores);
        
        // Por ahora, cursos e inscripciones en 0 (se implementarán después)
        const cursosActivos = 0;
        const inscripciones = 0;
        
        // Actualizar las tarjetas pequeñas
        const statCards = document.querySelectorAll('.stat-card-small');
        if (statCards.length >= 2) {
            statCards[0].querySelector('.value-number').textContent = cursosActivos;
            statCards[1].querySelector('.value-number').textContent = inscripciones;
        }
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ==========================================
// ACTUALIZAR GRÁFICO DE DONA
// ==========================================
function actualizarGraficoEstudiantes(estudiantes, coordinadores) {
    const total = estudiantes + coordinadores;
    const porcentaje = total > 0 ? Math.round((estudiantes / total) * 100) : 0;
    
    // Actualizar el círculo del gráfico
    const circulo = document.querySelector('.donut-chart circle:last-child');
    if (circulo) {
        const circunferencia = 2 * Math.PI * 80; // radio = 80
        const offset = circunferencia - (circunferencia * porcentaje / 100);
        circulo.setAttribute('stroke-dasharray', `${circunferencia} ${circunferencia}`);
        circulo.setAttribute('stroke-dashoffset', offset);
    }
    
    // Actualizar el porcentaje central
    const chartPercentage = document.querySelector('.chart-percentage');
    if (chartPercentage) {
        chartPercentage.textContent = `${porcentaje}%`;
    }
    
    // Actualizar la leyenda
    const legendItems = document.querySelectorAll('.legend-item');
    if (legendItems.length >= 2) {
        // Cambiar "Profesores" por "Coordinadores"
        legendItems[0].querySelector('.legend-label').textContent = 'Coordinadores';
        legendItems[0].querySelector('.legend-value').textContent = coordinadores;
        legendItems[0].querySelector('.legend-color').style.background = '#3b82f6';
        
        legendItems[1].querySelector('.legend-label').textContent = 'Estudiantes';
        legendItems[1].querySelector('.legend-value').textContent = estudiantes;
        legendItems[1].querySelector('.legend-color').style.background = '#06b6d4';
    }
    
    // Actualizar el título de la tarjeta
    const statHeader = document.querySelector('.stat-card .stat-header h3');
    if (statHeader) {
        statHeader.textContent = 'Total Usuarios';
    }
}

// ==========================================
// INICIALIZAR
// ==========================================
cargarDatosUsuario();

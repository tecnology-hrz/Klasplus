import { db, collection, getDocs, query, where } from './firebase-config.js';
import { showConfirm } from './notifications.js';

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let nombreInstitucion = '';
let gradoCoordinador = '';

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
            
            nombreInstitucion = datosDB.institucion || '';
            gradoCoordinador = datosDB.grado || '';
            
            const nombreCompleto = datosDB.nombre || datosDB.nombreCompleto || 'Coordinador';
            const tipoUsuario = datosDB.tipoUsuario || 'Coordinador';
            
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = nombreCompleto;
            if (rolElemento) rolElemento.textContent = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1);
            
            // Mostrar el grado del coordinador (si existe)
            const gradoElement = document.getElementById('gradoCoordinador');
            if (gradoElement) {
                if (gradoCoordinador) {
                    gradoElement.textContent = `Grado ${gradoCoordinador}`;
                } else {
                    gradoElement.textContent = 'Todos los grados';
                }
            }
            
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
            
            // Cargar estadísticas después de obtener los datos
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
        let estudiantesEnBrigada = 0;
        let estudiantesMañana = 0;
        let estudiantesTarde = 0;
        let brigadaMañana = 0;
        let brigadaTarde = 0;
        
        usuariosSnapshot.forEach(doc => {
            const datos = doc.data();
            const institucionUsuario = datos.institucion || datos.institucionNombre;
            const gradoUsuario = datos.grado;
            
            // Contar estudiantes de esta institución (y del grado del coordinador si tiene uno asignado)
            if (institucionUsuario === nombreInstitucion && 
                datos.tipoUsuario === 'estudiante') {
                
                // Si el coordinador tiene un grado asignado, solo contar estudiantes de ese grado
                if (gradoCoordinador && gradoUsuario !== gradoCoordinador) {
                    return; // Saltar este estudiante
                }
                
                totalEstudiantes++;
                
                // Contar por jornada
                if (datos.jornada === 'Mañana') {
                    estudiantesMañana++;
                    if (datos.enBrigada) brigadaMañana++;
                } else if (datos.jornada === 'Tarde') {
                    estudiantesTarde++;
                    if (datos.enBrigada) brigadaTarde++;
                }
                
                if (datos.enBrigada) {
                    estudiantesEnBrigada++;
                }
            }
        });
        
        // Actualizar el gráfico de dona
        actualizarGraficoEstudiantes(totalEstudiantes, estudiantesEnBrigada);
        
        // Actualizar estadísticas por jornada
        const elMañana = document.getElementById('estudiantesMañana');
        const elTarde = document.getElementById('estudiantesTarde');
        const elBrigadaMañana = document.getElementById('brigadaMañana');
        const elBrigadaTarde = document.getElementById('brigadaTarde');
        
        if (elMañana) elMañana.textContent = estudiantesMañana;
        if (elTarde) elTarde.textContent = estudiantesTarde;
        if (elBrigadaMañana) elBrigadaMañana.textContent = brigadaMañana;
        if (elBrigadaTarde) elBrigadaTarde.textContent = brigadaTarde;
        
        // Por ahora, cursos e inscripciones en 0 (se implementarán después)
        const cursosActivos = 0;
        const inscripciones = 0;
        
        // Actualizar las tarjetas pequeñas (primeras 2 del primer grid)
        const primerGrid = document.querySelector('.stats-grid');
        if (primerGrid) {
            const statCards = primerGrid.querySelectorAll('.stat-card-small');
            if (statCards.length >= 2) {
                statCards[0].querySelector('.value-number').textContent = cursosActivos;
                statCards[1].querySelector('.value-number').textContent = inscripciones;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ==========================================
// ACTUALIZAR GRÁFICO DE DONA
// ==========================================
function actualizarGraficoEstudiantes(totalEstudiantes, enBrigada) {
    const porcentaje = totalEstudiantes > 0 ? Math.round((enBrigada / totalEstudiantes) * 100) : 0;
    
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
        legendItems[0].querySelector('.legend-label').textContent = 'Estudiantes';
        legendItems[0].querySelector('.legend-value').textContent = totalEstudiantes;
        legendItems[0].querySelector('.legend-color').style.background = '#06b6d4';
        
        legendItems[1].querySelector('.legend-label').textContent = 'En Brigada';
        legendItems[1].querySelector('.legend-value').textContent = enBrigada;
        legendItems[1].querySelector('.legend-color').style.background = '#10b981';
    }
}

// ==========================================
// INICIALIZAR
// ==========================================
cargarDatosUsuario();

// ==========================================
// MATERIAL DE APOYO
// ==========================================
const materialApoyoNav = document.getElementById('materialApoyoNav');
const dashboardContent = document.getElementById('dashboardContent');
const materialApoyoSection = document.getElementById('materialApoyoSection');
const dashboardNavItem = document.querySelector('.nav-item.active');

if (materialApoyoNav) {
    materialApoyoNav.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los nav-items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Agregar active al Material de Apoyo
        materialApoyoNav.classList.add('active');
        
        // Mostrar Material de Apoyo y ocultar Dashboard
        dashboardContent.style.display = 'none';
        materialApoyoSection.style.display = 'block';
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

// Volver al Dashboard al hacer clic en Dashboard
if (dashboardNavItem) {
    dashboardNavItem.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los nav-items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Agregar active al Dashboard
        dashboardNavItem.classList.add('active');
        
        // Mostrar Dashboard y ocultar Material de Apoyo
        dashboardContent.style.display = 'block';
        materialApoyoSection.style.display = 'none';
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

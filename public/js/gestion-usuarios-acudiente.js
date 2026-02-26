import { db, collection, getDocs, query, where, doc, updateDoc, getDoc } from './firebase-config.js';
import { showSuccessNotification, showErrorNotification, showConfirm } from './notifications.js';

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let todosLosEstudiantes = [];
let estudiantesDisponibles = [];
let estudiantesACargo = [];
let datosAcudiente = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await verificarAutenticacion();
    await cargarDatosAcudiente();
    await cargarEstudiantes();
    inicializarEventos();
    manejarVistaURL();
});

// ==========================================
// VERIFICAR AUTENTICACIÓN
// ==========================================
async function verificarAutenticacion() {
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
            
            const nombreCompleto = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            const tipoUsuario = datosDB.tipoUsuario || 'Acudiente';
            
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = nombreCompleto;
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
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// ==========================================
// CARGAR DATOS DEL ACUDIENTE
// ==========================================
async function cargarDatosAcudiente() {
    const sesionUsuario = localStorage.getItem('userSession');
    if (!sesionUsuario) return;
    
    const datosUsuario = JSON.parse(sesionUsuario);
    
    try {
        const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
        const resultado = await getDocs(q);
        
        if (!resultado.empty) {
            datosAcudiente = {
                id: resultado.docs[0].id,
                ...resultado.docs[0].data()
            };
            
            // Cargar IDs de estudiantes a cargo actuales
            if (datosAcudiente.estudiantesACargo && Array.isArray(datosAcudiente.estudiantesACargo)) {
                estudiantesACargo = datosAcudiente.estudiantesACargo;
            } else {
                estudiantesACargo = [];
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del acudiente:', error);
    }
}

// ==========================================
// CARGAR ESTUDIANTES
// ==========================================
async function cargarEstudiantes() {
    const tableBody = document.getElementById('usuariosTableBody');
    const infoMessage = document.getElementById('infoMessage');
    
    // Verificar si el acudiente tiene institución, grado y jornada configurados
    if (!datosAcudiente || !datosAcudiente.institucion || !datosAcudiente.grado || !datosAcudiente.jornada) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">Por favor, completa tu perfil primero.</td></tr>';
        if (infoMessage) infoMessage.style.display = 'flex';
        return;
    }
    
    if (infoMessage) infoMessage.style.display = 'none';
    
    try {
        // Filtrar estudiantes por institución, grado y jornada del acudiente
        const q = query(
            collection(db, 'usuarios'),
            where('tipoUsuario', '==', 'estudiante'),
            where('institucion', '==', datosAcudiente.institucion),
            where('grado', '==', datosAcudiente.grado),
            where('jornada', '==', datosAcudiente.jornada)
        );
        
        const resultado = await getDocs(q);
        todosLosEstudiantes = [];
        
        resultado.forEach(doc => {
            todosLosEstudiantes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Separar estudiantes disponibles y a cargo
        separarEstudiantes();
        mostrarEstudiantesDisponibles(estudiantesDisponibles);
        mostrarEstudiantesACargo();
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="error-row">Error al cargar estudiantes</td></tr>';
        showErrorNotification('Error', 'No se pudieron cargar los estudiantes');
    }
}

// ==========================================
// SEPARAR ESTUDIANTES
// ==========================================
function separarEstudiantes() {
    estudiantesDisponibles = todosLosEstudiantes.filter(est => !estudiantesACargo.includes(est.id));
}

// ==========================================
// MOSTRAR ESTUDIANTES DISPONIBLES
// ==========================================
function mostrarEstudiantesDisponibles(estudiantes) {
    const tableBody = document.getElementById('usuariosTableBody');
    
    if (estudiantes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No hay estudiantes disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    estudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${estudiante.nombre || estudiante.nombreCompleto || 'Sin nombre'}</td>
            <td>${estudiante.documento || estudiante.numeroDocumento || 'N/A'}</td>
            <td>${estudiante.email || 'N/A'}</td>
            <td>${estudiante.grado || 'N/A'}</td>
            <td>${estudiante.jornada || 'N/A'}</td>
            <td>
                <button class="btn-agregar" data-id="${estudiante.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Agregar a mi cargo
                </button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            agregarEstudiante(estudianteId);
        });
    });
}

// ==========================================
// MOSTRAR ESTUDIANTES A CARGO
// ==========================================
function mostrarEstudiantesACargo() {
    const tableBody = document.getElementById('estudiantesACargoBody');
    const seccionACargo = document.getElementById('seccionACargo');
    
    const estudiantesACargoData = todosLosEstudiantes.filter(est => estudiantesACargo.includes(est.id));
    
    if (estudiantesACargoData.length === 0) {
        if (seccionACargo) seccionACargo.style.display = 'none';
        return;
    }
    
    if (seccionACargo) seccionACargo.style.display = 'block';
    tableBody.innerHTML = '';
    
    estudiantesACargoData.forEach(estudiante => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${estudiante.nombre || estudiante.nombreCompleto || 'Sin nombre'}</td>
            <td>${estudiante.documento || estudiante.numeroDocumento || 'N/A'}</td>
            <td>${estudiante.email || 'N/A'}</td>
            <td>${estudiante.grado || 'N/A'}</td>
            <td>${estudiante.jornada || 'N/A'}</td>
            <td>
                <button class="btn-quitar" data-id="${estudiante.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Quitar
                </button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            quitarEstudiante(estudianteId);
        });
    });
}

// ==========================================
// AGREGAR ESTUDIANTE A CARGO
// ==========================================
async function agregarEstudiante(estudianteId) {
    if (!datosAcudiente) {
        showErrorNotification('Error', 'No se encontraron datos del acudiente');
        return;
    }
    
    const estudiante = todosLosEstudiantes.find(est => est.id === estudianteId);
    const nombreEstudiante = estudiante ? (estudiante.nombre || estudiante.nombreCompleto || 'este estudiante') : 'este estudiante';
    
    const confirmado = await showConfirm(
        'Agregar estudiante',
        `¿Deseas agregar a ${nombreEstudiante} a tu cargo?`
    );
    
    if (!confirmado) return;
    
    try {
        // Agregar el ID al array
        if (!estudiantesACargo.includes(estudianteId)) {
            estudiantesACargo.push(estudianteId);
        }
        
        const acudienteRef = doc(db, 'usuarios', datosAcudiente.id);
        
        await updateDoc(acudienteRef, {
            estudiantesACargo: estudiantesACargo
        });
        
        showSuccessNotification('Éxito', 'Estudiante agregado correctamente');
        
        // Actualizar vistas según el contexto
        const urlParams = new URLSearchParams(window.location.search);
        const vista = urlParams.get('vista');
        
        if (vista === 'acargo') {
            // Si estamos en vista "a cargo", actualizar esa sección
            mostrarEstudiantesACargo();
        } else {
            // Si estamos en vista "gestionar", actualizar tabla completa
            separarEstudiantes();
            mostrarTodosLosEstudiantes();
        }
        
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('Error al agregar estudiante:', error);
        showErrorNotification('Error', 'No se pudo agregar el estudiante');
    }
}

// ==========================================
// QUITAR ESTUDIANTE DE CARGO
// ==========================================
async function quitarEstudiante(estudianteId) {
    if (!datosAcudiente) {
        showErrorNotification('Error', 'No se encontraron datos del acudiente');
        return;
    }
    
    const estudiante = todosLosEstudiantes.find(est => est.id === estudianteId);
    const nombreEstudiante = estudiante ? (estudiante.nombre || estudiante.nombreCompleto || 'este estudiante') : 'este estudiante';
    
    const confirmado = await showConfirm(
        'Quitar estudiante',
        `¿Deseas quitar a ${nombreEstudiante} de tu cargo?`
    );
    
    if (!confirmado) return;
    
    try {
        // Quitar el ID del array
        estudiantesACargo = estudiantesACargo.filter(id => id !== estudianteId);
        
        const acudienteRef = doc(db, 'usuarios', datosAcudiente.id);
        
        await updateDoc(acudienteRef, {
            estudiantesACargo: estudiantesACargo
        });
        
        showSuccessNotification('Éxito', 'Estudiante quitado correctamente');
        
        // Actualizar vistas según el contexto
        const urlParams = new URLSearchParams(window.location.search);
        const vista = urlParams.get('vista');
        
        if (vista === 'acargo') {
            // Si estamos en vista "a cargo", actualizar esa sección
            mostrarEstudiantesACargo();
        } else {
            // Si estamos en vista "gestionar", actualizar tabla completa
            separarEstudiantes();
            mostrarTodosLosEstudiantes();
        }
        
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('Error al quitar estudiante:', error);
        showErrorNotification('Error', 'No se pudo quitar el estudiante');
    }
}

// ==========================================
// ACTUALIZAR ESTADÍSTICAS
// ==========================================
function actualizarEstadisticas() {
    const totalElement = document.getElementById('totalEstudiantes');
    const aCargoElement = document.getElementById('estudiantesACargo');
    
    if (totalElement) totalElement.textContent = estudiantesDisponibles.length;
    if (aCargoElement) aCargoElement.textContent = estudiantesACargo.length;
}

// ==========================================
// BUSCAR ESTUDIANTES
// ==========================================
function buscarEstudiantes(termino) {
    const terminoLower = termino.toLowerCase().trim();
    const urlParams = new URLSearchParams(window.location.search);
    const vista = urlParams.get('vista');
    
    if (!terminoLower) {
        if (vista === 'acargo') {
            mostrarEstudiantesACargo();
        } else {
            mostrarTodosLosEstudiantes();
        }
        return;
    }
    
    const estudiantesFiltrados = todosLosEstudiantes.filter(estudiante => {
        const nombre = (estudiante.nombre || estudiante.nombreCompleto || '').toLowerCase();
        const documento = (estudiante.documento || estudiante.numeroDocumento || '').toLowerCase();
        
        return nombre.includes(terminoLower) || documento.includes(terminoLower);
    });
    
    if (vista === 'acargo') {
        // Filtrar solo los que están a cargo
        const aCargoFiltrados = estudiantesFiltrados.filter(est => estudiantesACargo.includes(est.id));
        mostrarEstudiantesACargoFiltrados(aCargoFiltrados);
    } else {
        // Mostrar todos los filtrados
        mostrarTodosLosEstudiantesFiltrados(estudiantesFiltrados);
    }
}

// ==========================================
// MOSTRAR ESTUDIANTES A CARGO FILTRADOS
// ==========================================
function mostrarEstudiantesACargoFiltrados(estudiantes) {
    const tableBody = document.getElementById('estudiantesACargoBody');
    
    if (estudiantes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No se encontraron estudiantes</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    estudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${estudiante.nombre || estudiante.nombreCompleto || 'Sin nombre'}</td>
            <td>${estudiante.documento || estudiante.numeroDocumento || 'N/A'}</td>
            <td>${estudiante.email || 'N/A'}</td>
            <td>${estudiante.grado || 'N/A'}</td>
            <td>${estudiante.jornada || 'N/A'}</td>
            <td>
                <button class="btn-quitar" data-id="${estudiante.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Quitar
                </button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            quitarEstudiante(estudianteId);
        });
    });
}

// ==========================================
// MOSTRAR TODOS LOS ESTUDIANTES FILTRADOS
// ==========================================
function mostrarTodosLosEstudiantesFiltrados(estudiantes) {
    const tableBody = document.getElementById('usuariosTableBody');
    
    if (estudiantes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No se encontraron estudiantes</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    estudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        const isACargo = estudiantesACargo.includes(estudiante.id);
        
        tr.innerHTML = `
            <td>${estudiante.nombre || estudiante.nombreCompleto || 'Sin nombre'}</td>
            <td>${estudiante.documento || estudiante.numeroDocumento || 'N/A'}</td>
            <td>${estudiante.email || 'N/A'}</td>
            <td>${estudiante.grado || 'N/A'}</td>
            <td>${estudiante.jornada || 'N/A'}</td>
            <td>
                ${isACargo ? `
                    <button class="btn-quitar" data-id="${estudiante.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Quitar
                    </button>
                ` : `
                    <button class="btn-agregar" data-id="${estudiante.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Agregar a mi cargo
                    </button>
                `}
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            agregarEstudiante(estudianteId);
        });
    });
    
    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            quitarEstudiante(estudianteId);
        });
    });
}

// ==========================================
// INICIALIZAR EVENTOS
// ==========================================
function inicializarEventos() {
    // Dropdown de usuario
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
    
    // Cerrar sesión
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
    
    // Toggle sidebar móvil
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    };
    
    if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    
    // Menú expandible
    document.querySelectorAll('.nav-item.expandable').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            const submenu = item.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('show');
            }
        });
    });
    
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            buscarEstudiantes(e.target.value);
        });
    }
    
    // Material de Apoyo
    const materialApoyoNav = document.getElementById('materialApoyoNav');
    const usuariosContent = document.getElementById('usuariosContent');
    const materialApoyoSection = document.getElementById('materialApoyoSection');
    
    if (materialApoyoNav && usuariosContent && materialApoyoSection) {
        materialApoyoNav.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item.expandable').forEach(item => item.classList.remove('active'));
            materialApoyoNav.classList.add('active');
            
            usuariosContent.style.display = 'none';
            materialApoyoSection.style.display = 'block';
            
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
    }
    
    // Volver a gestión de usuarios
    const gestionUsuariosExpandable = document.querySelector('.nav-item.expandable');
    if (gestionUsuariosExpandable) {
        gestionUsuariosExpandable.addEventListener('click', (e) => {
            if (materialApoyoNav) {
                materialApoyoNav.classList.remove('active');
            }
            
            if (usuariosContent && materialApoyoSection) {
                usuariosContent.style.display = 'block';
                materialApoyoSection.style.display = 'none';
            }
        });
    }
}


// ==========================================
// MANEJAR VISTA SEGÚN URL
// ==========================================
function manejarVistaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const vista = urlParams.get('vista');
    
    const seccionACargo = document.getElementById('seccionACargo');
    const seccionDisponibles = document.querySelector('.seccion-disponibles');
    const titulo = document.querySelector('.usuarios-header h1');
    
    if (vista === 'acargo') {
        // Vista "Estudiantes a cargo": Mostrar solo estudiantes a cargo
        if (seccionDisponibles) seccionDisponibles.style.display = 'none';
        if (seccionACargo) seccionACargo.style.display = 'block';
        if (titulo) titulo.textContent = 'Estudiantes a mi Cargo';
        
        // Ocultar estadística de disponibles
        const totalElement = document.getElementById('totalEstudiantes');
        if (totalElement && totalElement.parentElement) {
            totalElement.parentElement.style.display = 'none';
        }
    } else {
        // Vista "Gestionar estudiantes": Mostrar todos en una sola tabla
        if (seccionDisponibles) seccionDisponibles.style.display = 'block';
        if (seccionACargo) seccionACargo.style.display = 'none'; // Ocultar sección a cargo
        if (titulo) titulo.textContent = 'Gestión de Estudiantes a Cargo';
        
        // Cambiar título de la sección
        const tituloSeccion = seccionDisponibles?.querySelector('.seccion-titulo');
        if (tituloSeccion) {
            tituloSeccion.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Todos los estudiantes
            `;
        }
        
        // Mostrar todas las estadísticas
        const totalElement = document.getElementById('totalEstudiantes');
        if (totalElement && totalElement.parentElement) {
            totalElement.parentElement.style.display = 'flex';
        }
        
        // Mostrar TODOS los estudiantes (disponibles + a cargo) en una sola tabla
        mostrarTodosLosEstudiantes();
    }
}

// ==========================================
// MOSTRAR TODOS LOS ESTUDIANTES (DISPONIBLES + A CARGO)
// ==========================================
function mostrarTodosLosEstudiantes() {
    const tableBody = document.getElementById('usuariosTableBody');
    
    if (todosLosEstudiantes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No hay estudiantes</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    todosLosEstudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        const isACargo = estudiantesACargo.includes(estudiante.id);
        
        tr.innerHTML = `
            <td>${estudiante.nombre || estudiante.nombreCompleto || 'Sin nombre'}</td>
            <td>${estudiante.documento || estudiante.numeroDocumento || 'N/A'}</td>
            <td>${estudiante.email || 'N/A'}</td>
            <td>${estudiante.grado || 'N/A'}</td>
            <td>${estudiante.jornada || 'N/A'}</td>
            <td>
                ${isACargo ? `
                    <button class="btn-quitar" data-id="${estudiante.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Quitar
                    </button>
                ` : `
                    <button class="btn-agregar" data-id="${estudiante.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Agregar a mi cargo
                    </button>
                `}
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            agregarEstudiante(estudianteId);
        });
    });
    
    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const estudianteId = e.currentTarget.dataset.id;
            quitarEstudiante(estudianteId);
        });
    });
    
    // Actualizar estadísticas
    const totalDisponibles = todosLosEstudiantes.filter(est => !estudiantesACargo.includes(est.id)).length;
    const totalElement = document.getElementById('totalEstudiantes');
    if (totalElement) totalElement.textContent = totalDisponibles;
}

import { db, collection, getDocs, query, where, doc, updateDoc } from './firebase-config.js';
import { showConfirm, showErrorNotification, showSuccessNotification } from './notifications.js';

let usuariosData = [];
let tipoUsuario = 'estudiantes';
let nombreInstitucion = '';
let gradoProfesor = '';
let jornadaSeleccionada = '';

const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const userDropdown = document.getElementById('userDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

const toggleSidebar = () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);
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

document.querySelectorAll('.nav-item.expandable').forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('active');
        item.nextElementSibling.classList.toggle('show');
    });
});

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

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const confirmado = await showConfirm('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?');
    if (confirmado) {
        localStorage.removeItem('userSession');
        sessionStorage.clear();
        window.location.href = '../../index.html';
    }
});

function obtenerTipoUsuario() {
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = urlParams.get('tipo') || 'estudiantes';
    return tipo;
}

function actualizarTitulo() {
    const titulo = document.getElementById('tituloSeccion');
    const titulos = {
        'estudiantes': 'Gestión de Estudiantes',
        'brigada': 'Gestión de Brigada'
    };
    
    if (titulo) {
        titulo.textContent = titulos[tipoUsuario] || 'Gestión de Usuarios';
    }
    
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.remove('active');
        if (item.href.includes(`tipo=${tipoUsuario}`)) {
            item.classList.add('active');
        }
    });
}

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
            
            if (datosDB.tipoUsuario !== 'profesor') {
                showErrorNotification('Acceso denegado', 'Solo los profesores pueden acceder a esta sección.');
                setTimeout(() => {
                    window.location.href = 'campus.html';
                }, 2000);
                return;
            }
            
            nombreInstitucion = datosDB.institucion || datosDB.institucionNombre || datosDB.nombre || datosDB.nombreCompleto;
            gradoProfesor = datosDB.grado || '';
            
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            if (rolElemento) rolElemento.textContent = 'Profesor';
            
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
            
            await cargarUsuarios();
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showErrorNotification('Error', 'No se pudieron cargar los datos del usuario.');
    }
}

async function cargarUsuarios() {
    const tableBody = document.getElementById('usuariosTableBody');
    
    if (!nombreInstitucion) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No se pudo identificar la institución</td></tr>';
        return;
    }
    
    if (!gradoProfesor) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No tienes un grado asignado. Contacta al coordinador.</td></tr>';
        return;
    }
    
    try {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-row">Cargando usuarios...</td></tr>';
        
        if (tipoUsuario === 'estudiantes') {
            // Cargar solo estudiantes del grado del profesor
            const q = query(
                collection(db, 'usuarios'),
                where('tipoUsuario', '==', 'estudiante'),
                where('institucion', '==', nombreInstitucion),
                where('grado', '==', gradoProfesor)
            );
            
            const resultado = await getDocs(q);
            usuariosData = [];
            
            resultado.forEach(doc => {
                usuariosData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderizarUsuarios(usuariosData);
            actualizarEstadisticas(usuariosData);
            
        } else if (tipoUsuario === 'brigada') {
            // Cargar solo estudiantes de brigada del grado del profesor
            const q = query(
                collection(db, 'usuarios'),
                where('tipoUsuario', '==', 'estudiante'),
                where('institucion', '==', nombreInstitucion),
                where('grado', '==', gradoProfesor),
                where('enBrigada', '==', true)
            );
            
            const resultado = await getDocs(q);
            usuariosData = [];
            
            resultado.forEach(doc => {
                usuariosData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderizarUsuarios(usuariosData);
            actualizarEstadisticas(usuariosData);
            
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">Esta sección estará disponible próximamente</td></tr>';
            document.getElementById('totalUsuarios').textContent = '0';
            document.getElementById('usuariosActivos').textContent = '0';
        }
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">Error al cargar los usuarios</td></tr>';
        showErrorNotification('Error', 'No se pudieron cargar los usuarios.');
    }
}

function renderizarUsuarios(usuarios) {
    const tableBody = document.getElementById('usuariosTableBody');
    
    // Filtrar por jornada si hay una seleccionada
    let usuariosFiltrados = usuarios;
    if (jornadaSeleccionada) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.jornada === jornadaSeleccionada);
    }
    
    if (usuariosFiltrados.length === 0) {
        let mensaje = tipoUsuario === 'brigada' 
            ? `No hay estudiantes de ${gradoProfesor} grado en la brigada` 
            : `No hay estudiantes registrados en ${gradoProfesor} grado`;
        
        if (jornadaSeleccionada) {
            mensaje = tipoUsuario === 'brigada'
                ? `No hay estudiantes de ${gradoProfesor} grado - jornada ${jornadaSeleccionada} en la brigada`
                : `No hay estudiantes de ${gradoProfesor} grado - jornada ${jornadaSeleccionada}`;
        }
        
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-row">${mensaje}</td></tr>`;
        actualizarEstadisticas(usuariosFiltrados);
        return;
    }
    
    tableBody.innerHTML = '';
    
    usuariosFiltrados.forEach(usuario => {
        const row = document.createElement('tr');
        
        const nombre = usuario.nombre || usuario.nombreCompleto || 'Sin nombre';
        const documento = usuario.numeroDocumento || usuario.documento || 'N/A';
        const email = usuario.email || 'N/A';
        const gradoUsuario = usuario.grado || 'N/A';
        const jornadaUsuario = usuario.jornada || 'N/A';
        const estado = 'Activo';
        const enBrigada = usuario.enBrigada || false;
        
        let accionesHTML = '';
        
        if (tipoUsuario === 'estudiantes') {
            if (enBrigada) {
                accionesHTML = `
                    <button class="btn-action btn-remove" onclick="quitarDeBrigada('${usuario.id}', '${nombre}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                        <span>Quitar de Brigada</span>
                    </button>
                `;
            } else {
                accionesHTML = `
                    <button class="btn-action btn-add" onclick="agregarABrigada('${usuario.id}', '${nombre}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        <span>Agregar a Brigada</span>
                    </button>
                `;
            }
        } else if (tipoUsuario === 'brigada') {
            accionesHTML = `
                <button class="btn-action btn-remove" onclick="quitarDeBrigada('${usuario.id}', '${nombre}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                    <span>Quitar</span>
                </button>
            `;
        }
        
        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small">
                        ${usuario.fotoPerfil 
                            ? `<img src="${usuario.fotoPerfil}" alt="${nombre}">` 
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>`
                        }
                    </div>
                    <span>${nombre}</span>
                </div>
            </td>
            <td>${documento}</td>
            <td>${email}</td>
            <td><span class="badge badge-info">${gradoUsuario}</span></td>
            <td><span class="badge badge-warning">${jornadaUsuario}</span></td>
            <td><span class="badge badge-success">${estado}</span></td>
            <td>${accionesHTML}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    actualizarEstadisticas(usuariosFiltrados);
}

function actualizarEstadisticas(usuarios) {
    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('usuariosActivos').textContent = usuarios.length;
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderizarUsuarios(usuariosData);
        return;
    }
    
    const usuariosFiltrados = usuariosData.filter(usuario => {
        const nombre = (usuario.nombre || usuario.nombreCompleto || '').toLowerCase();
        const documento = (usuario.numeroDocumento || usuario.documento || '').toLowerCase();
        const email = (usuario.email || '').toLowerCase();
        
        return nombre.includes(searchTerm) || 
               documento.includes(searchTerm) || 
               email.includes(searchTerm);
    });
    
    renderizarUsuarios(usuariosFiltrados);
});

// Filtro por jornada
const filtroJornadaEl = document.getElementById('filtroJornada');
if (filtroJornadaEl) {
    filtroJornadaEl.addEventListener('change', (e) => {
        jornadaSeleccionada = e.target.value;
        renderizarUsuarios(usuariosData);
    });
}

tipoUsuario = obtenerTipoUsuario();
actualizarTitulo();
cargarDatosUsuario();

// Funciones globales para los botones
window.agregarABrigada = async (userId, nombre) => {
    const confirmado = await showConfirm(
        'Agregar a Brigada',
        `¿Estás seguro de agregar a ${nombre} a la brigada?`
    );
    
    if (!confirmado) return;
    
    try {
        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, {
            enBrigada: true
        });
        
        showSuccessNotification('¡Agregado!', `${nombre} ha sido agregado a la brigada.`);
        await cargarUsuarios();
    } catch (error) {
        console.error('Error al agregar a brigada:', error);
        showErrorNotification('Error', 'No se pudo agregar el estudiante a la brigada.');
    }
};

window.quitarDeBrigada = async (userId, nombre) => {
    const confirmado = await showConfirm(
        'Quitar de Brigada',
        `¿Estás seguro de quitar a ${nombre} de la brigada?`
    );
    
    if (!confirmado) return;
    
    try {
        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, {
            enBrigada: false
        });
        
        showSuccessNotification('¡Quitado!', `${nombre} ha sido quitado de la brigada.`);
        await cargarUsuarios();
    } catch (error) {
        console.error('Error al quitar de brigada:', error);
        showErrorNotification('Error', 'No se pudo quitar el estudiante de la brigada.');
    }
};

// ==========================================
// MATERIAL DE APOYO
// ==========================================
const materialApoyoNav = document.getElementById('materialApoyoNav');
const usuariosContent = document.getElementById('usuariosContent');
const materialApoyoSection = document.getElementById('materialApoyoSection');

if (materialApoyoNav) {
    materialApoyoNav.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los nav-items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.nav-item.expandable').forEach(item => item.classList.remove('active'));
        
        // Agregar active al Material de Apoyo
        materialApoyoNav.classList.add('active');
        
        // Mostrar Material de Apoyo y ocultar Gestión de Usuarios
        usuariosContent.style.display = 'none';
        materialApoyoSection.style.display = 'block';
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

// Volver a Gestión de Usuarios al hacer clic en el menú expandible
const gestionUsuariosExpandable = document.querySelector('.nav-item.expandable');
if (gestionUsuariosExpandable) {
    gestionUsuariosExpandable.addEventListener('click', (e) => {
        // Remover active de Material de Apoyo
        if (materialApoyoNav) {
            materialApoyoNav.classList.remove('active');
        }
        
        // Mostrar Gestión de Usuarios y ocultar Material de Apoyo
        usuariosContent.style.display = 'block';
        materialApoyoSection.style.display = 'none';
    });
}

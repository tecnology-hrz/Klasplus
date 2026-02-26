import { db, collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from './firebase-config.js';
import { showNotification, showConfirm } from './notifications.js';

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const userDropdown = document.getElementById('userDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const dashboardNav = document.getElementById('dashboardNav');
const dashboardContent = document.getElementById('dashboardContent');
const gestionUsuariosContent = document.getElementById('gestionUsuariosContent');

// ==========================================
// NAVEGACIÓN Y MENÚ
// ==========================================
userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target)) {
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

const toggleSidebar = () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

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

// ==========================================
// NAVEGACIÓN ENTRE SECCIONES
// ==========================================
dashboardNav.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    dashboardNav.classList.add('active');
    dashboardContent.style.display = 'block';
    gestionUsuariosContent.style.display = 'none';
    materialApoyoSection.style.display = 'none';
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
});

// Material de Apoyo
const materialApoyoNav = document.getElementById('materialApoyoNav');
const materialApoyoSection = document.getElementById('materialApoyoSection');

if (materialApoyoNav) {
    materialApoyoNav.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos los nav-items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Agregar active al Material de Apoyo
        materialApoyoNav.classList.add('active');
        
        // Mostrar Material de Apoyo y ocultar otras secciones
        dashboardContent.style.display = 'none';
        gestionUsuariosContent.style.display = 'none';
        materialApoyoSection.style.display = 'block';
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

document.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tipo = item.getAttribute('data-tipo');
        mostrarGestionUsuarios(tipo);
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.closest('.nav-item.expandable').classList.add('active');
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
});

function mostrarGestionUsuarios(tipo) {
    dashboardContent.style.display = 'none';
    gestionUsuariosContent.style.display = 'block';
    materialApoyoSection.style.display = 'none';
    
    const filtroRol = document.getElementById('filtroRol');
    filtroRol.value = tipo;
    
    const titulos = {
        'todos': 'Gestión de Usuarios',
        'institucion': 'Gestión de Instituciones',
        'coordinador': 'Gestión de Coordinadores',
        'profesor': 'Gestión de Profesores',
        'estudiante': 'Gestión de Estudiantes',
        'acudiente': 'Gestión de Acudientes'
    };
    
    document.getElementById('tituloGestion').textContent = titulos[tipo] || 'Gestión de Usuarios';
    cargarUsuarios(tipo);
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
            
            const nombreCompleto = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            const tipoUsuario = datosDB.tipoUsuario || 'Administrador';
            
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
// CARGAR ESTADÍSTICAS
// ==========================================
async function cargarEstadisticas() {
    try {
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        const usuarios = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const instituciones = usuarios.filter(u => u.tipoUsuario === 'institucion').length;
        const coordinadores = usuarios.filter(u => u.tipoUsuario === 'coordinador').length;
        const profesores = usuarios.filter(u => u.tipoUsuario === 'profesor').length;
        const estudiantes = usuarios.filter(u => u.tipoUsuario === 'estudiante').length;
        const acudientes = usuarios.filter(u => u.tipoUsuario === 'acudiente').length;
        const total = usuarios.length;
        
        document.getElementById('totalUsuarios').textContent = total;
        document.getElementById('totalInstituciones').textContent = instituciones;
        document.getElementById('totalCoordinadores').textContent = coordinadores;
        document.getElementById('totalProfesores').textContent = profesores;
        document.getElementById('totalEstudiantes').textContent = estudiantes;
        document.getElementById('totalAcudientes').textContent = acudientes;
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================
let todosLosUsuarios = [];
let usuariosFiltrados = [];

async function cargarUsuarios(filtroTipo = 'todos') {
    const tablaUsuarios = document.getElementById('tablaUsuarios');
    tablaUsuarios.innerHTML = '<tr class="loading-row"><td colspan="5">Cargando usuarios...</td></tr>';
    
    try {
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        todosLosUsuarios = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        aplicarFiltros();
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        tablaUsuarios.innerHTML = '<tr class="empty-row"><td colspan="5">Error al cargar usuarios</td></tr>';
        showNotification('Error al cargar usuarios', 'error');
    }
}

function aplicarFiltros() {
    const filtroRol = document.getElementById('filtroRol').value;
    const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
    
    usuariosFiltrados = todosLosUsuarios.filter(usuario => {
        const cumpleFiltroRol = filtroRol === 'todos' || usuario.tipoUsuario === filtroRol;
        const cumpleBusqueda = !searchTerm || 
            (usuario.nombre && usuario.nombre.toLowerCase().includes(searchTerm)) ||
            (usuario.nombreCompleto && usuario.nombreCompleto.toLowerCase().includes(searchTerm)) ||
            (usuario.email && usuario.email.toLowerCase().includes(searchTerm));
        
        return cumpleFiltroRol && cumpleBusqueda;
    });
    
    mostrarUsuarios();
    actualizarEstadisticasFiltradas();
}

function mostrarUsuarios() {
    const tablaUsuarios = document.getElementById('tablaUsuarios');
    
    if (usuariosFiltrados.length === 0) {
        tablaUsuarios.innerHTML = '<tr class="empty-row"><td colspan="5">No se encontraron usuarios</td></tr>';
        return;
    }
    
    tablaUsuarios.innerHTML = usuariosFiltrados.map(usuario => {
        const nombre = usuario.nombre || usuario.nombreCompleto || 'Sin nombre';
        const email = usuario.email || 'Sin email';
        const rol = usuario.tipoUsuario || 'Sin rol';
        const estado = usuario.estado || 'activo';
        
        const badgeClass = {
            'activo': 'badge-success',
            'inactivo': 'badge-danger',
            'pendiente': 'badge-warning'
        }[estado] || 'badge-info';
        
        const rolLabel = {
            'institucion': 'Institución',
            'coordinador': 'Coordinador',
            'profesor': 'Profesor',
            'estudiante': 'Estudiante',
            'acudiente': 'Acudiente',
            'admin': 'Administrador'
        }[rol] || rol;
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">
                            ${usuario.fotoPerfil ? 
                                `<img src="${usuario.fotoPerfil}" alt="${nombre}">` :
                                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>`
                            }
                        </div>
                        <span>${nombre}</span>
                    </div>
                </td>
                <td>${email}</td>
                <td><span class="badge badge-info">${rolLabel}</span></td>
                <td><span class="badge ${badgeClass}">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span></td>
                <td>
                    <button class="btn-action btn-edit" onclick="editarUsuario('${usuario.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Editar</span>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarUsuario('${usuario.id}', '${nombre}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Eliminar</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarEstadisticasFiltradas() {
    document.getElementById('statTotalUsuarios').textContent = todosLosUsuarios.length;
    document.getElementById('statUsuariosFiltrados').textContent = usuariosFiltrados.length;
    
    const filtroRol = document.getElementById('filtroRol').value;
    const labels = {
        'todos': 'Usuarios Mostrados',
        'institucion': 'Instituciones',
        'coordinador': 'Coordinadores',
        'profesor': 'Profesores',
        'estudiante': 'Estudiantes',
        'acudiente': 'Acudientes'
    };
    document.getElementById('statLabelFiltrados').textContent = labels[filtroRol] || 'Usuarios Mostrados';
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.getElementById('filtroRol').addEventListener('change', aplicarFiltros);
document.getElementById('searchUsuarios').addEventListener('input', aplicarFiltros);

// ==========================================
// MODAL GESTIÓN DE USUARIOS
// ==========================================
const modalUsuario = document.getElementById('modalUsuario');
const formUsuario = document.getElementById('formUsuario');
const btnCrearUsuario = document.getElementById('btnCrearUsuario');
const closeModalUsuario = document.getElementById('closeModalUsuario');
const btnCancelarModal = document.getElementById('btnCancelarModal');
const modalTitulo = document.getElementById('modalTitulo');
const tipoUsuarioSelect = document.getElementById('tipoUsuario');
const gradoGroup = document.getElementById('gradoGroup');
const passwordGroup = document.getElementById('passwordGroup');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

let modoEdicion = false;
let usuarioEditandoId = null;

// Función para hashear contraseña
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Abrir modal para crear usuario
btnCrearUsuario.addEventListener('click', () => {
    modoEdicion = false;
    usuarioEditandoId = null;
    modalTitulo.textContent = 'Crear Usuario';
    formUsuario.reset();
    passwordInput.required = true;
    confirmPasswordInput.required = true;
    document.getElementById('passwordRequired').style.display = 'inline';
    document.getElementById('confirmPasswordRequired').style.display = 'inline';
    modalUsuario.classList.add('show');
});

// Cerrar modal
const cerrarModal = () => {
    modalUsuario.classList.remove('show');
    formUsuario.reset();
    modoEdicion = false;
    usuarioEditandoId = null;
};

closeModalUsuario.addEventListener('click', cerrarModal);
btnCancelarModal.addEventListener('click', cerrarModal);

modalUsuario.addEventListener('click', (e) => {
    if (e.target === modalUsuario) {
        cerrarModal();
    }
});

// Mostrar/ocultar campo de grado según tipo de usuario
tipoUsuarioSelect.addEventListener('change', () => {
    const tipo = tipoUsuarioSelect.value;
    if (tipo === 'estudiante') {
        gradoGroup.style.display = 'block';
        document.getElementById('grado').required = true;
    } else {
        gradoGroup.style.display = 'none';
        document.getElementById('grado').required = false;
    }
});

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
});

document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
    const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    confirmPasswordInput.type = type;
});

// Validar contraseñas en tiempo real
confirmPasswordInput.addEventListener('input', () => {
    if (passwordInput.value && confirmPasswordInput.value) {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }
});

// Enviar formulario
formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(formUsuario);
    const datos = Object.fromEntries(formData);
    
    // Validar contraseñas si se están ingresando
    if (datos.password || datos.confirmPassword) {
        if (datos.password !== datos.confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (datos.password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
    }
    
    // Validar contraseña requerida en modo creación
    if (!modoEdicion && !datos.password) {
        showNotification('La contraseña es requerida', 'error');
        return;
    }
    
    try {
        const nombreCompleto = `${datos.nombres} ${datos.apellidos}`;
        
        // Preparar datos del usuario
        const datosUsuario = {
            email: datos.email,
            nombre: nombreCompleto,
            nombres: datos.nombres,
            apellidos: datos.apellidos,
            nombreCompleto: nombreCompleto,
            tipoDocumento: datos.tipoDocumento,
            numeroDocumento: datos.numeroDocumento,
            documento: datos.numeroDocumento,
            telefono: datos.telefono,
            genero: datos.genero,
            tipoUsuario: datos.tipoUsuario,
            estado: datos.estado
        };
        
        // Agregar grado si es estudiante
        if (datos.tipoUsuario === 'estudiante' && datos.grado) {
            datosUsuario.grado = datos.grado;
        }
        
        if (modoEdicion) {
            // Actualizar usuario existente
            const usuarioRef = doc(db, 'usuarios', usuarioEditandoId);
            
            // Solo actualizar contraseña si se proporcionó una nueva
            if (datos.password) {
                const hashedPassword = await hashPassword(datos.password);
                datosUsuario.password = hashedPassword;
            }
            
            datosUsuario.fechaActualizacion = new Date().toISOString();
            
            await updateDoc(usuarioRef, datosUsuario);
            showNotification('Usuario actualizado correctamente', 'success');
            
        } else {
            // Crear nuevo usuario
            
            // Verificar si el email ya existe
            const q = query(collection(db, 'usuarios'), where('email', '==', datos.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                showNotification('Este correo electrónico ya está registrado', 'error');
                return;
            }
            
            // Hashear contraseña
            const hashedPassword = await hashPassword(datos.password);
            datosUsuario.password = hashedPassword;
            datosUsuario.fechaRegistro = new Date().toISOString();
            
            await addDoc(collection(db, 'usuarios'), datosUsuario);
            showNotification('Usuario creado correctamente', 'success');
        }
        
        cerrarModal();
        const filtroActual = document.getElementById('filtroRol').value;
        cargarUsuarios(filtroActual);
        cargarEstadisticas();
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showNotification('Error al guardar usuario: ' + error.message, 'error');
    }
});

// ==========================================
// FUNCIONES GLOBALES
// ==========================================
window.editarUsuario = async function(usuarioId) {
    try {
        const usuario = todosLosUsuarios.find(u => u.id === usuarioId);
        
        if (!usuario) {
            showNotification('Usuario no encontrado', 'error');
            return;
        }
        
        modoEdicion = true;
        usuarioEditandoId = usuarioId;
        modalTitulo.textContent = 'Editar Usuario';
        
        // Llenar formulario con datos del usuario
        document.getElementById('usuarioId').value = usuarioId;
        document.getElementById('tipoUsuario').value = usuario.tipoUsuario || '';
        document.getElementById('estado').value = usuario.estado || 'activo';
        document.getElementById('nombres').value = usuario.nombres || '';
        document.getElementById('apellidos').value = usuario.apellidos || '';
        document.getElementById('tipoDocumento').value = usuario.tipoDocumento || '';
        document.getElementById('numeroDocumento').value = usuario.numeroDocumento || usuario.documento || '';
        document.getElementById('email').value = usuario.email || '';
        document.getElementById('telefono').value = usuario.telefono || '';
        document.getElementById('genero').value = usuario.genero || '';
        
        // Mostrar campo de grado si es estudiante
        if (usuario.tipoUsuario === 'estudiante') {
            gradoGroup.style.display = 'block';
            document.getElementById('grado').value = usuario.grado || '';
            document.getElementById('grado').required = true;
        } else {
            gradoGroup.style.display = 'none';
            document.getElementById('grado').required = false;
        }
        
        // Hacer contraseña opcional en edición
        passwordInput.required = false;
        confirmPasswordInput.required = false;
        passwordInput.placeholder = 'Dejar vacío para mantener la actual';
        confirmPasswordInput.placeholder = 'Dejar vacío para mantener la actual';
        document.getElementById('passwordRequired').style.display = 'none';
        document.getElementById('confirmPasswordRequired').style.display = 'none';
        
        modalUsuario.classList.add('show');
        
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showNotification('Error al cargar datos del usuario', 'error');
    }
};

window.eliminarUsuario = async function(usuarioId, nombreUsuario) {
    const confirmado = await showConfirm(
        'Eliminar usuario',
        `¿Estás seguro de que deseas eliminar a ${nombreUsuario}? Esta acción no se puede deshacer.`
    );
    
    if (confirmado) {
        try {
            await deleteDoc(doc(db, 'usuarios', usuarioId));
            showNotification('Usuario eliminado correctamente', 'success');
            const filtroActual = document.getElementById('filtroRol').value;
            cargarUsuarios(filtroActual);
            cargarEstadisticas();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showNotification('Error al eliminar usuario', 'error');
        }
    }
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
cargarDatosUsuario();
cargarEstadisticas();

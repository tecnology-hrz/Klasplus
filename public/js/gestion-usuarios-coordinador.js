import { db, collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc } from './firebase-config.js';
import { showConfirm, showErrorNotification, showSuccessNotification, showLoading, hideLoading } from './notifications.js';

let usuariosData = [];
let tipoUsuario = 'estudiantes';
let nombreInstitucion = '';
let gradoCoordinador = '';
let gradoSeleccionado = '';
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

// Mostrar/ocultar botón según el tipo de usuario
function actualizarBotonCrear() {
    const btnCrearProfesor = document.getElementById('btnCrearProfesor');
    if (tipoUsuario === 'profesores' && btnCrearProfesor) {
        btnCrearProfesor.style.display = 'flex';
    } else if (btnCrearProfesor) {
        btnCrearProfesor.style.display = 'none';
    }
}

function actualizarTitulo() {
    const titulo = document.getElementById('tituloSeccion');
    const titulos = {
        'estudiantes': 'Gestión de Estudiantes',
        'brigada': 'Gestión de Brigada',
        'profesores': 'Gestión de Profesores'
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
    
    // Actualizar botón de crear profesor
    actualizarBotonCrear();
    
    // Mostrar/ocultar filtro de grado y jornada según la sección
    const filtroGrado = document.getElementById('filtroGrado');
    const filtroJornada = document.getElementById('filtroJornada');
    if (filtroGrado) {
        if (tipoUsuario === 'estudiantes' || tipoUsuario === 'brigada') {
            filtroGrado.style.display = 'block';
        } else {
            filtroGrado.style.display = 'none';
        }
    }
    if (filtroJornada) {
        if (tipoUsuario === 'estudiantes' || tipoUsuario === 'brigada') {
            filtroJornada.style.display = 'block';
        } else {
            filtroJornada.style.display = 'none';
        }
    }
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
            
            if (datosDB.tipoUsuario !== 'coordinador') {
                showErrorNotification('Acceso denegado', 'Solo los coordinadores pueden acceder a esta sección.');
                setTimeout(() => {
                    window.location.href = 'campus.html';
                }, 2000);
                return;
            }
            
            nombreInstitucion = datosDB.institucion || datosDB.institucionNombre || datosDB.nombre || datosDB.nombreCompleto;
            gradoCoordinador = datosDB.grado || '';
            
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            if (rolElemento) rolElemento.textContent = 'Coordinador';
            
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
    
    try {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-row">Cargando usuarios...</td></tr>';
        
        if (tipoUsuario === 'estudiantes') {
            const q = query(
                collection(db, 'usuarios'),
                where('tipoUsuario', '==', 'estudiante'),
                where('institucion', '==', nombreInstitucion)
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
            const q = query(
                collection(db, 'usuarios'),
                where('tipoUsuario', '==', 'estudiante'),
                where('institucion', '==', nombreInstitucion),
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
            
        } else if (tipoUsuario === 'profesores') {
            const q = query(
                collection(db, 'usuarios'),
                where('tipoUsuario', '==', 'profesor'),
                where('institucion', '==', nombreInstitucion)
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
    
    // Filtrar por grado si hay uno seleccionado
    let usuariosFiltrados = usuarios;
    if (gradoSeleccionado) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.grado === gradoSeleccionado);
    }
    // Filtrar por jornada si hay una seleccionada
    if (jornadaSeleccionada) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.jornada === jornadaSeleccionada);
    }
    
    if (usuariosFiltrados.length === 0) {
        let mensaje = tipoUsuario === 'brigada' 
            ? 'No hay estudiantes asignados a la brigada' 
            : tipoUsuario === 'profesores'
            ? 'No hay profesores registrados en esta institución'
            : 'No hay estudiantes registrados en esta institución';
        
        if (gradoSeleccionado || jornadaSeleccionada) {
            const filtroTexto = [
                gradoSeleccionado ? `${gradoSeleccionado} grado` : '',
                jornadaSeleccionada ? `jornada ${jornadaSeleccionada}` : ''
            ].filter(Boolean).join(' - ');
            mensaje = `No hay estudiantes de ${filtroTexto}`;
            if (tipoUsuario === 'brigada') {
                mensaje = `No hay estudiantes de ${filtroTexto} en la brigada`;
            }
        }
        
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-row">${mensaje}</td></tr>`;
        actualizarEstadisticas(usuariosFiltrados);
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Renderizar usuarios sin agrupar en la tabla
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
        } else if (tipoUsuario === 'profesores') {
            accionesHTML = `
                <button class="btn-action btn-edit" onclick="editarProfesor('${usuario.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Editar</span>
                </button>
                <button class="btn-action btn-delete" onclick="eliminarProfesor('${usuario.id}', '${nombre}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Eliminar</span>
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

// Filtro por grado
document.getElementById('filtroGrado').addEventListener('change', (e) => {
    gradoSeleccionado = e.target.value;
    renderizarUsuarios(usuariosData);
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
// MODAL CREAR PROFESOR
// ==========================================

const btnCrearProfesor = document.getElementById('btnCrearProfesor');
const modalCrearProfesor = document.getElementById('modalCrearProfesor');
const formCrearProfesor = document.getElementById('formCrearProfesor');

// Abrir modal
if (btnCrearProfesor) {
    btnCrearProfesor.addEventListener('click', () => {
        modalCrearProfesor.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
}

// Cerrar modal profesor
function cerrarModalProfesor() {
    if (modalCrearProfesor) {
        modalCrearProfesor.classList.remove('show');
    }
    document.body.style.overflow = '';
    if (formCrearProfesor) {
        formCrearProfesor.reset();
        delete formCrearProfesor.dataset.editandoId;
    }
    const modalHeader = document.querySelector('#modalCrearProfesor .modal-header h2');
    const btnGuardar = document.querySelector('#modalCrearProfesor .btn-guardar');
    if (modalHeader) modalHeader.textContent = 'Crear Nuevo Profesor';
    if (btnGuardar) btnGuardar.textContent = 'Crear Profesor';
}

// Botones de cerrar modal profesor
const btnCerrarModalProfesor = document.getElementById('btnCerrarModalProfesor');
const btnCancelarProfesor = document.getElementById('btnCancelarProfesor');

if (btnCerrarModalProfesor) {
    btnCerrarModalProfesor.addEventListener('click', cerrarModalProfesor);
}

if (btnCancelarProfesor) {
    btnCancelarProfesor.addEventListener('click', cerrarModalProfesor);
}

// Cerrar modal al hacer clic fuera
if (modalCrearProfesor) {
    modalCrearProfesor.addEventListener('click', (e) => {
        if (e.target === modalCrearProfesor) {
            cerrarModalProfesor();
        }
    });
}

// Enviar formulario profesor
if (formCrearProfesor) {
    formCrearProfesor.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('profNombre').value.trim();
        const email = document.getElementById('profEmail').value.trim();
        const grado = document.getElementById('profGrado').value;
        const password = document.getElementById('profPassword').value;
        const passwordConfirm = document.getElementById('profPasswordConfirm').value;
        
        const editandoId = formCrearProfesor.dataset.editandoId;
        
        // Validaciones
        if (!nombre || !email || !grado) {
            showErrorNotification('Error', 'Por favor completa todos los campos obligatorios.');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showErrorNotification('Error', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        
        // Si hay contraseña, validar
        if (password || passwordConfirm) {
            if (password !== passwordConfirm) {
                showErrorNotification('Error', 'Las contraseñas no coinciden.');
                return;
            }
            
            if (password.length < 6) {
                showErrorNotification('Error', 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }
        } else if (!editandoId) {
            // Si es creación nueva, la contraseña es obligatoria
            showErrorNotification('Error', 'La contraseña es obligatoria.');
            return;
        }
        
        showLoading();
        
        try {
            if (editandoId) {
                // EDITAR PROFESOR EXISTENTE
                const profesorRef = doc(db, 'usuarios', editandoId);
                
                const datosActualizar = {
                    nombre: nombre,
                    nombreCompleto: nombre,
                    email: email,
                    grado: grado,
                    fechaActualizacion: new Date().toISOString()
                };
                
                // Si hay nueva contraseña, encriptarla y agregarla
                if (password) {
                    const hashedPassword = await hashPassword(password);
                    datosActualizar.password = hashedPassword;
                }
                
                await updateDoc(profesorRef, datosActualizar);
                
                hideLoading();
                cerrarModalProfesor();
                
                showSuccessNotification(
                    '¡Profesor actualizado!',
                    `El profesor ${nombre} ha sido actualizado exitosamente.`,
                    () => {
                        cargarUsuarios();
                    }
                );
                
            } else {
                // CREAR NUEVO PROFESOR
                
                // Verificar si el email ya existe
                const qEmail = query(collection(db, 'usuarios'), where('email', '==', email));
                const resultadoEmail = await getDocs(qEmail);
                
                if (!resultadoEmail.empty) {
                    hideLoading();
                    showErrorNotification('Error', 'Este correo electrónico ya está registrado.');
                    return;
                }
                
                // Encriptar contraseña
                const hashedPassword = await hashPassword(password);
                
                // Crear profesor
                const nuevoProfesor = {
                    nombre: nombre,
                    nombreCompleto: nombre,
                    email: email,
                    password: hashedPassword,
                    grado: grado,
                    tipoUsuario: 'profesor',
                    institucion: nombreInstitucion,
                    estado: 'activo',
                    fechaCreacion: new Date().toISOString()
                };
                
                await addDoc(collection(db, 'usuarios'), nuevoProfesor);
                
                hideLoading();
                cerrarModalProfesor();
                
                showSuccessNotification(
                    '¡Profesor creado!',
                    `El profesor ${nombre} ha sido creado exitosamente.`,
                    () => {
                        cargarUsuarios();
                    }
                );
            }
            
        } catch (error) {
            console.error('Error al guardar profesor:', error);
            hideLoading();
            showErrorNotification('Error', 'No se pudo guardar el profesor. Intenta nuevamente.');
        }
    });
}

// ==========================================
// EDITAR PROFESOR
// ==========================================

window.editarProfesor = async function(profesorId) {
    try {
        const profesor = usuariosData.find(u => u.id === profesorId);
        
        if (!profesor) {
            showErrorNotification('Error', 'No se encontró el profesor.');
            return;
        }
        
        document.getElementById('profNombre').value = profesor.nombre || profesor.nombreCompleto || '';
        document.getElementById('profEmail').value = profesor.email || '';
        document.getElementById('profGrado').value = profesor.grado || '';
        document.getElementById('profPassword').value = '';
        document.getElementById('profPasswordConfirm').value = '';
        
        document.querySelector('#modalCrearProfesor .modal-header h2').textContent = 'Editar Profesor';
        document.querySelector('#modalCrearProfesor .btn-guardar').textContent = 'Actualizar Profesor';
        
        formCrearProfesor.dataset.editandoId = profesorId;
        
        modalCrearProfesor.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error al editar profesor:', error);
        showErrorNotification('Error', 'No se pudo cargar los datos del profesor.');
    }
};

// ==========================================
// ELIMINAR PROFESOR
// ==========================================

window.eliminarProfesor = async function(profesorId, nombreProfesor) {
    const confirmado = await showConfirm(
        'Eliminar Profesor',
        `¿Estás seguro de que deseas eliminar al profesor "${nombreProfesor}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmado) return;
    
    showLoading();
    
    try {
        const profesorRef = doc(db, 'usuarios', profesorId);
        await deleteDoc(profesorRef);
        
        hideLoading();
        
        showSuccessNotification(
            '¡Profesor eliminado!',
            `El profesor "${nombreProfesor}" ha sido eliminado exitosamente.`,
            () => {
                cargarUsuarios();
            }
        );
        
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        hideLoading();
        showErrorNotification('Error', 'No se pudo eliminar el profesor. Intenta nuevamente.');
    }
};


// ==========================================
// MODAL CREAR COORDINADOR
// ==========================================

const btnCrearCoordinador = document.getElementById('btnCrearCoordinador');
const modalCrearCoordinador = document.getElementById('modalCrearCoordinador');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnCancelar = document.getElementById('btnCancelar');
const formCrearCoordinador = document.getElementById('formCrearCoordinador');

// Abrir modal
if (btnCrearCoordinador) {
    btnCrearCoordinador.addEventListener('click', () => {
        modalCrearCoordinador.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
}

// Cerrar modal
function cerrarModal() {
    if (modalCrearCoordinador) {
        modalCrearCoordinador.classList.remove('show');
    }
    document.body.style.overflow = '';
    if (formCrearCoordinador) {
        formCrearCoordinador.reset();
    }
}

if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModal);
}

if (btnCancelar) {
    btnCancelar.addEventListener('click', cerrarModal);
}

// Cerrar modal al hacer clic fuera
if (modalCrearCoordinador) {
    modalCrearCoordinador.addEventListener('click', (e) => {
        if (e.target === modalCrearCoordinador) {
            cerrarModal();
        }
    });
}

// Toggle password visibility
document.querySelectorAll('.toggle-password-btn').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = `
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                input.type = 'password';
                button.innerHTML = `
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        }
    });
});

// Función para encriptar contraseña
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Enviar formulario
if (formCrearCoordinador) {
    formCrearCoordinador.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('coordNombre').value.trim();
        const email = document.getElementById('coordEmail').value.trim();
        const grado = document.getElementById('coordGrado').value;
        const password = document.getElementById('coordPassword').value;
        const passwordConfirm = document.getElementById('coordPasswordConfirm').value;
        
        // Validaciones
        if (!nombre || !email || !grado || !password || !passwordConfirm) {
            showErrorNotification('Error', 'Por favor completa todos los campos obligatorios.');
            return;
        }
        
        if (password !== passwordConfirm) {
            showErrorNotification('Error', 'Las contraseñas no coinciden.');
            return;
        }
        
        if (password.length < 6) {
            showErrorNotification('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showErrorNotification('Error', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        
        showLoading();
        
        try {
            // Verificar si el email ya existe
            const qEmail = query(collection(db, 'usuarios'), where('email', '==', email));
            const resultadoEmail = await getDocs(qEmail);
            
            if (!resultadoEmail.empty) {
                hideLoading();
                showErrorNotification('Error', 'Este correo electrónico ya está registrado.');
                return;
            }
            
            // Encriptar contraseña
            const hashedPassword = await hashPassword(password);
            
            // Crear coordinador
            const nuevoCoordinador = {
                nombre: nombre,
                nombreCompleto: nombre,
                email: email,
                password: hashedPassword,
                grado: grado,
                tipoUsuario: 'coordinador',
                institucion: nombreInstitucion,
                estado: 'activo',
                fechaCreacion: new Date().toISOString()
            };
            
            await addDoc(collection(db, 'usuarios'), nuevoCoordinador);
            
            hideLoading();
            cerrarModal();
            
            showSuccessNotification(
                '¡Coordinador creado!',
                `El coordinador ${nombre} ha sido creado exitosamente.`,
                () => {
                    cargarUsuarios();
                }
            );
            
        } catch (error) {
            console.error('Error al crear coordinador:', error);
            hideLoading();
            showErrorNotification('Error', 'No se pudo crear el coordinador. Intenta nuevamente.');
        }
    });
}


// ==========================================
// EDITAR COORDINADOR
// ==========================================

window.editarCoordinador = async function(coordinadorId) {
    try {
        // Buscar el coordinador en los datos cargados
        const coordinador = usuariosData.find(u => u.id === coordinadorId);
        
        if (!coordinador) {
            showErrorNotification('Error', 'No se encontró el coordinador.');
            return;
        }
        
        // Llenar el formulario con los datos del coordinador
        document.getElementById('coordNombre').value = coordinador.nombre || coordinador.nombreCompleto || '';
        document.getElementById('coordEmail').value = coordinador.email || '';
        document.getElementById('coordGrado').value = coordinador.grado || '';
        
        // Limpiar campos de contraseña
        document.getElementById('coordPassword').value = '';
        document.getElementById('coordPasswordConfirm').value = '';
        
        // Cambiar el título del modal
        document.querySelector('.modal-header h2').textContent = 'Editar Coordinador';
        
        // Cambiar el texto del botón
        const btnGuardar = document.querySelector('.btn-guardar');
        btnGuardar.textContent = 'Actualizar Coordinador';
        
        // Guardar el ID del coordinador que se está editando
        formCrearCoordinador.dataset.editandoId = coordinadorId;
        
        // Abrir el modal
        modalCrearCoordinador.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error al editar coordinador:', error);
        showErrorNotification('Error', 'No se pudo cargar los datos del coordinador.');
    }
};

// ==========================================
// ELIMINAR COORDINADOR
// ==========================================

window.eliminarCoordinador = async function(coordinadorId, nombreCoordinador) {
    const confirmado = await showConfirm(
        'Eliminar Coordinador',
        `¿Estás seguro de que deseas eliminar al coordinador "${nombreCoordinador}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmado) return;
    
    showLoading();
    
    try {
        const coordinadorRef = doc(db, 'usuarios', coordinadorId);
        await deleteDoc(coordinadorRef);
        
        hideLoading();
        
        showSuccessNotification(
            '¡Coordinador eliminado!',
            `El coordinador "${nombreCoordinador}" ha sido eliminado exitosamente.`,
            () => {
                cargarUsuarios();
            }
        );
        
    } catch (error) {
        console.error('Error al eliminar coordinador:', error);
        hideLoading();
        showErrorNotification('Error', 'No se pudo eliminar el coordinador. Intenta nuevamente.');
    }
};

// ==========================================
// ACTUALIZAR FORMULARIO PARA EDICIÓN
// ==========================================

// Modificar el evento submit del formulario para manejar tanto creación como edición
if (formCrearCoordinador) {
    formCrearCoordinador.removeEventListener('submit', formCrearCoordinador._submitHandler);
    
    formCrearCoordinador._submitHandler = async function(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('coordNombre').value.trim();
        const email = document.getElementById('coordEmail').value.trim();
        const grado = document.getElementById('coordGrado').value;
        const password = document.getElementById('coordPassword').value;
        const passwordConfirm = document.getElementById('coordPasswordConfirm').value;
        
        const editandoId = formCrearCoordinador.dataset.editandoId;
        
        // Validaciones
        if (!nombre || !email || !grado) {
            showErrorNotification('Error', 'Por favor completa todos los campos obligatorios.');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showErrorNotification('Error', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        
        // Si hay contraseña, validar
        if (password || passwordConfirm) {
            if (password !== passwordConfirm) {
                showErrorNotification('Error', 'Las contraseñas no coinciden.');
                return;
            }
            
            if (password.length < 6) {
                showErrorNotification('Error', 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }
        } else if (!editandoId) {
            // Si es creación nueva, la contraseña es obligatoria
            showErrorNotification('Error', 'La contraseña es obligatoria.');
            return;
        }
        
        showLoading();
        
        try {
            if (editandoId) {
                // EDITAR COORDINADOR EXISTENTE
                const coordinadorRef = doc(db, 'usuarios', editandoId);
                
                const datosActualizar = {
                    nombre: nombre,
                    nombreCompleto: nombre,
                    email: email,
                    grado: grado,
                    fechaActualizacion: new Date().toISOString()
                };
                
                // Si hay nueva contraseña, encriptarla y agregarla
                if (password) {
                    const hashedPassword = await hashPassword(password);
                    datosActualizar.password = hashedPassword;
                }
                
                await updateDoc(coordinadorRef, datosActualizar);
                
                hideLoading();
                cerrarModal();
                
                showSuccessNotification(
                    '¡Coordinador actualizado!',
                    `El coordinador ${nombre} ha sido actualizado exitosamente.`,
                    () => {
                        cargarUsuarios();
                    }
                );
                
            } else {
                // CREAR NUEVO COORDINADOR
                
                // Verificar si el email ya existe
                const qEmail = query(collection(db, 'usuarios'), where('email', '==', email));
                const resultadoEmail = await getDocs(qEmail);
                
                if (!resultadoEmail.empty) {
                    hideLoading();
                    showErrorNotification('Error', 'Este correo electrónico ya está registrado.');
                    return;
                }
                
                // Encriptar contraseña
                const hashedPassword = await hashPassword(password);
                
                // Crear coordinador
                const nuevoCoordinador = {
                    nombre: nombre,
                    nombreCompleto: nombre,
                    email: email,
                    password: hashedPassword,
                    grado: grado,
                    tipoUsuario: 'coordinador',
                    institucion: nombreInstitucion,
                    estado: 'activo',
                    fechaCreacion: new Date().toISOString()
                };
                
                await addDoc(collection(db, 'usuarios'), nuevoCoordinador);
                
                hideLoading();
                cerrarModal();
                
                showSuccessNotification(
                    '¡Coordinador creado!',
                    `El coordinador ${nombre} ha sido creado exitosamente.`,
                    () => {
                        cargarUsuarios();
                    }
                );
            }
            
        } catch (error) {
            console.error('Error al guardar coordinador:', error);
            hideLoading();
            showErrorNotification('Error', 'No se pudo guardar el coordinador. Intenta nuevamente.');
        }
    };
    
    formCrearCoordinador.addEventListener('submit', formCrearCoordinador._submitHandler);
}

// Limpiar el formulario al cerrar el modal
const cerrarModalOriginal = cerrarModal;
cerrarModal = function() {
    cerrarModalOriginal();
    
    // Resetear el formulario
    formCrearCoordinador.reset();
    delete formCrearCoordinador.dataset.editandoId;
    
    // Restaurar título y botón
    document.querySelector('.modal-header h2').textContent = 'Crear Nuevo Coordinador';
    document.querySelector('.btn-guardar').textContent = 'Crear Coordinador';
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
    const originalClickHandler = gestionUsuariosExpandable.onclick;
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

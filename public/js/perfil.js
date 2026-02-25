import { db, collection, getDocs, query, where } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading, showConfirm } from './notifications.js';

const IMGBB_API_KEY = 'cecb7463734f9b0b470426456e4be69d';

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
    enlace.addEventListener('click', (e) => {
        if (enlace.querySelector('span') && enlace.querySelector('span').textContent === 'Certificados') {
            e.preventDefault();
            showErrorNotification('En desarrollo', 'Esta sección estará disponible próximamente');
            return;
        }
        
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
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
// MENÚ EXPANDIBLE (SUBMENÚS)
// ==========================================

document.querySelectorAll('.nav-item.expandable').forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('active');
        item.nextElementSibling.classList.toggle('show');
    });
});

// ==========================================
// MANEJO DE TABS
// ==========================================

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

// ==========================================
// VARIABLE GLOBAL PARA EL ID DEL DOCUMENTO
// ==========================================
let documentoIdUsuario = null;

// ==========================================
// CARGAR INSTITUCIONES DESDE FIREBASE
// ==========================================
async function cargarInstituciones() {
    try {
        const q = query(collection(db, 'usuarios'), where('tipoUsuario', '==', 'institucion'));
        const resultado = await getDocs(q);
        
        const selectInstitucion = document.getElementById('inputInstitucion');
        if (!selectInstitucion) return;
        
        // Limpiar opciones existentes excepto la primera
        selectInstitucion.innerHTML = '<option value="">Selecciona una institución</option>';
        
        resultado.forEach(doc => {
            const datos = doc.data();
            const nombreInstitucion = datos.institucionNombre || datos.nombre || datos.nombreCompleto;
            
            if (nombreInstitucion) {
                const option = document.createElement('option');
                option.value = nombreInstitucion;
                option.textContent = nombreInstitucion;
                selectInstitucion.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
    }
}

// ==========================================
// FUNCIONES DE AVATAR
// ==========================================

function mostrarAvatar(urlImagen) {
    if (!urlImagen) return;
    
    // Avatar grande del banner
    const avatarImg = document.getElementById('perfilAvatarImg');
    const avatarPlaceholder = document.querySelector('#perfilAvatarLarge .avatar-placeholder');
    if (avatarImg) {
        avatarImg.src = urlImagen;
        avatarImg.style.display = 'block';
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    }
    
    // Cambiar texto del botón a "Cambiar foto"
    const btnSubir = document.getElementById('btnSubirFoto');
    if (btnSubir) {
        btnSubir.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Cambiar foto`;
    }
    
    // Avatar pequeño del header
    const headerImg = document.getElementById('headerAvatarImg');
    const headerPlaceholder = document.querySelector('#headerAvatarContainer .avatar-placeholder');
    if (headerImg) {
        headerImg.src = urlImagen;
        headerImg.style.display = 'block';
        if (headerPlaceholder) headerPlaceholder.style.display = 'none';
    }
    
    // Guardar en localStorage para otras páginas
    const sesion = localStorage.getItem('userSession');
    if (sesion) {
        const datos = JSON.parse(sesion);
        datos.fotoPerfil = urlImagen;
        localStorage.setItem('userSession', JSON.stringify(datos));
    }
}

async function subirImagenImgBB(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                const formData = new FormData();
                formData.append('key', IMGBB_API_KEY);
                formData.append('image', base64);
                
                const respuesta = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const resultado = await respuesta.json();
                
                if (resultado.success) {
                    resolve(resultado.data.display_url);
                } else {
                    reject(new Error(resultado.error?.message || 'Error al subir imagen'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(archivo);
    });
}

// ==========================================
// EVENTO DE SUBIR FOTO
// ==========================================

const btnSubirFoto = document.getElementById('btnSubirFoto');
const inputFotoPerfil = document.getElementById('inputFotoPerfil');

if (btnSubirFoto && inputFotoPerfil) {
    btnSubirFoto.addEventListener('click', () => {
        inputFotoPerfil.click();
    });
    
    inputFotoPerfil.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        
        if (!archivo.type.startsWith('image/')) {
            showErrorNotification('Error', 'Por favor selecciona un archivo de imagen válido.');
            return;
        }
        
        if (archivo.size > 5 * 1024 * 1024) {
            showErrorNotification('Error', 'La imagen no debe superar los 5 MB.');
            return;
        }
        
        showLoading();
        
        try {
            const urlImagen = await subirImagenImgBB(archivo);
            
            // Guardar URL en Firebase
            if (documentoIdUsuario) {
                const referenciaDoc = doc(db, 'usuarios', documentoIdUsuario);
                await updateDoc(referenciaDoc, { fotoPerfil: urlImagen });
            }
            
            mostrarAvatar(urlImagen);
            
            hideLoading();
            showSuccessNotification('¡Foto actualizada!', 'Tu foto de perfil se ha actualizado correctamente.');
        } catch (error) {
            console.error('Error al subir foto:', error);
            hideLoading();
            showErrorNotification('Error', 'No se pudo subir la foto. Intenta nuevamente.');
        }
        
        inputFotoPerfil.value = '';
    });
}

// ==========================================
// CARGAR DATOS DEL USUARIO DESDE FIREBASE
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
            const documentoUsuario = resultado.docs[0];
            const datosDB = documentoUsuario.data();
            
            documentoIdUsuario = documentoUsuario.id;
            
            const nombreCompleto = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            const primerNombre = nombreCompleto.split(' ')[0];
            
            // Header: nombre y rol
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = nombreCompleto;
            if (rolElemento) {
                const tipo = datosDB.tipoUsuario || 'Estudiante';
                rolElemento.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            }
            
            // Banner: nombre
            const perfilNombre = document.getElementById('perfilNombre');
            if (perfilNombre) perfilNombre.textContent = nombreCompleto;
            
            // Banner: solo número de documento
            const perfilDocLabel = document.querySelector('.perfil-documento');
            const numDoc = datosDB.numeroDocumento || datosDB.documento || '';
            if (perfilDocLabel && numDoc) {
                perfilDocLabel.innerHTML = `Documento: <span id="perfilDocumento">${numDoc}</span>`;
            } else if (perfilDocLabel) {
                perfilDocLabel.innerHTML = `Documento: <span id="perfilDocumento">N/A</span>`;
            }
            
            // Bienvenida
            const highlight = document.querySelector('.welcome-message .highlight');
            if (highlight) highlight.textContent = primerNombre;
            
            // Foto de perfil
            if (datosDB.fotoPerfil) {
                mostrarAvatar(datosDB.fotoPerfil);
            }
            
            // Formulario de configuración
            const inputNombres = document.getElementById('inputNombres');
            const inputApellidos = document.getElementById('inputApellidos');
            
            if (inputNombres) {
                if (datosDB.nombres) {
                    inputNombres.value = datosDB.nombres;
                } else {
                    const partes = nombreCompleto.split(' ');
                    inputNombres.value = partes.length >= 2
                        ? partes.slice(0, Math.ceil(partes.length / 2)).join(' ')
                        : nombreCompleto;
                }
            }
            
            if (inputApellidos) {
                if (datosDB.apellidos) {
                    inputApellidos.value = datosDB.apellidos;
                } else {
                    const partes = nombreCompleto.split(' ');
                    inputApellidos.value = partes.length >= 2
                        ? partes.slice(Math.ceil(partes.length / 2)).join(' ')
                        : '';
                }
            }
            
            const inputTipoDoc = document.getElementById('inputTipoDoc');
            if (inputTipoDoc && datosDB.tipoDocumento) {
                for (let i = 0; i < inputTipoDoc.options.length; i++) {
                    if (inputTipoDoc.options[i].value === datosDB.tipoDocumento || 
                        inputTipoDoc.options[i].text === datosDB.tipoDocumento) {
                        inputTipoDoc.selectedIndex = i;
                        break;
                    }
                }
            }
            
            const inputNumDoc = document.getElementById('inputNumDoc');
            if (inputNumDoc) {
                inputNumDoc.value = datosDB.numeroDocumento || datosDB.documento || '';
            }
            
            const inputGenero = document.getElementById('inputGenero');
            if (inputGenero && datosDB.genero) {
                for (let i = 0; i < inputGenero.options.length; i++) {
                    if (inputGenero.options[i].value === datosDB.genero || 
                        inputGenero.options[i].text === datosDB.genero) {
                        inputGenero.selectedIndex = i;
                        break;
                    }
                }
            }
            
            const inputFechaNac = document.getElementById('inputFechaNac');
            if (inputFechaNac && datosDB.fechaNacimiento) {
                inputFechaNac.value = datosDB.fechaNacimiento;
            }
            
            const inputEmail = document.getElementById('inputEmail');
            if (inputEmail) {
                inputEmail.value = datosDB.email || datosUsuario.email;
            }
            
            // Información lateral
            const infoValues = document.querySelectorAll('.info-value');
            if (infoValues.length >= 2) {
                const institucion = datosDB.institucion || datosDB.institucionNombre;
                if (institucion) infoValues[0].textContent = institucion;
                if (datosDB.grado || datosDB.nivel) infoValues[1].textContent = datosDB.grado || datosDB.nivel;
            }
            
            // Campos de estudiante (solo visible para tipo estudiante)
            if (datosDB.tipoUsuario === 'estudiante') {
                const seccion = document.getElementById('seccionEstudiante');
                if (seccion) seccion.style.display = 'block';
                
                // Cargar instituciones disponibles
                await cargarInstituciones();
                
                // Seleccionar la institución actual si existe
                const inputInstitucion = document.getElementById('inputInstitucion');
                if (inputInstitucion && datosDB.institucion) {
                    inputInstitucion.value = datosDB.institucion;
                }
                
                // Cargar grado/nivel
                const inputGrado = document.getElementById('inputGrado');
                if (inputGrado && datosDB.grado) {
                    // Buscar y seleccionar el grado
                    for (let i = 0; i < inputGrado.options.length; i++) {
                        if (inputGrado.options[i].value === datosDB.grado) {
                            inputGrado.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
            
            // Campos de institución (solo visible para tipo institucion)
            if (datosDB.tipoUsuario === 'institucion') {
                const seccion = document.getElementById('seccionInstitucion');
                if (seccion) seccion.style.display = 'block';
                
                const camposInst = {
                    'inputInstNombre': datosDB.institucionNombre,
                    'inputInstNit': datosDB.institucionNit,
                    'inputInstTelefono': datosDB.institucionTelefono,
                    'inputInstDireccion': datosDB.institucionDireccion,
                    'inputInstCiudad': datosDB.institucionCiudad,
                    'inputInstDepartamento': datosDB.institucionDepartamento
                };
                
                for (const [id, valor] of Object.entries(camposInst)) {
                    const input = document.getElementById(id);
                    if (input && valor) input.value = valor;
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// ==========================================
// FUNCIÓN PARA ENCRIPTAR CONTRASEÑA
// ==========================================

const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ==========================================
// MANEJAR FORMULARIO DE EDICIÓN DE PERFIL
// ==========================================

const perfilForm = document.querySelector('.perfil-form');
if (perfilForm) {
    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const confirmado = await showConfirm('Actualizar perfil', '¿Estás seguro? Los datos serán actualizados en la base de datos.');
        if (!confirmado) {
            return;
        }
        
        showLoading();
        
        const sesionUsuario = localStorage.getItem('userSession');
        if (!sesionUsuario) {
            hideLoading();
            showErrorNotification('Error', 'No se encontró la sesión del usuario. Inicia sesión nuevamente.');
            return;
        }
        
        const datosUsuario = JSON.parse(sesionUsuario);
        
        try {
            let userId = documentoIdUsuario;
            let datosActualesDB = null;
            
            if (!userId) {
                const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
                const resultado = await getDocs(q);
                
                if (resultado.empty) {
                    hideLoading();
                    showErrorNotification('Error', 'No se encontró el usuario en la base de datos.');
                    return;
                }
                
                userId = resultado.docs[0].id;
                datosActualesDB = resultado.docs[0].data();
            } else {
                const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
                const resultado = await getDocs(q);
                if (!resultado.empty) {
                    datosActualesDB = resultado.docs[0].data();
                }
            }
            
            const nombres = document.getElementById('inputNombres').value.trim();
            const apellidos = document.getElementById('inputApellidos').value.trim();
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const tipoDocumento = document.getElementById('inputTipoDoc').value;
            const numeroDocumento = document.getElementById('inputNumDoc').value.trim();
            const genero = document.getElementById('inputGenero').value;
            const fechaNacimiento = document.getElementById('inputFechaNac').value;
            const email = document.getElementById('inputEmail').value.trim();
            
            const contrasenaActual = document.getElementById('inputCurrentPassword').value;
            const nuevaContrasena = document.getElementById('inputNewPassword').value;
            const confirmarContrasena = document.getElementById('inputConfirmPassword').value;
            
            if (!nombres || !apellidos) {
                hideLoading();
                showErrorNotification('Error', 'Los nombres y apellidos son obligatorios.');
                return;
            }
            
            if (!email) {
                hideLoading();
                showErrorNotification('Error', 'El correo electrónico es obligatorio.');
                return;
            }
            
            const datosActualizar = {
                nombre: nombreCompleto,
                nombreCompleto: nombreCompleto,
                nombres: nombres,
                apellidos: apellidos,
                tipoDocumento: tipoDocumento,
                numeroDocumento: numeroDocumento,
                documento: numeroDocumento,
                genero: genero,
                fechaNacimiento: fechaNacimiento,
                email: email
            };
            
            // Agregar campos de estudiante si la sección está visible
            const seccionEst = document.getElementById('seccionEstudiante');
            if (seccionEst && seccionEst.style.display !== 'none') {
                const inputInstitucion = document.getElementById('inputInstitucion');
                const inputGrado = document.getElementById('inputGrado');
                
                if (inputInstitucion) {
                    datosActualizar.institucion = inputInstitucion.value;
                }
                if (inputGrado) {
                    datosActualizar.grado = inputGrado.value;
                }
            }
            
            // Agregar campos de institución si la sección está visible
            const seccionInst = document.getElementById('seccionInstitucion');
            if (seccionInst && seccionInst.style.display !== 'none') {
                const obtenerValorInst = (id) => {
                    const el = document.getElementById(id);
                    return el ? el.value.trim() : '';
                };
                datosActualizar.institucionNombre = obtenerValorInst('inputInstNombre');
                datosActualizar.institucionNit = obtenerValorInst('inputInstNit');
                datosActualizar.institucionTelefono = obtenerValorInst('inputInstTelefono');
                datosActualizar.institucionDireccion = obtenerValorInst('inputInstDireccion');
                datosActualizar.institucionCiudad = obtenerValorInst('inputInstCiudad');
                datosActualizar.institucionDepartamento = obtenerValorInst('inputInstDepartamento');
            }
            
            if (contrasenaActual || nuevaContrasena || confirmarContrasena) {
                if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
                    hideLoading();
                    showErrorNotification('Error', 'Por favor completa todos los campos de contraseña.');
                    return;
                }
                
                if (nuevaContrasena !== confirmarContrasena) {
                    hideLoading();
                    showErrorNotification('Error', 'Las contraseñas nuevas no coinciden.');
                    return;
                }
                
                if (nuevaContrasena.length < 6) {
                    hideLoading();
                    showErrorNotification('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
                    return;
                }
                
                if (datosActualesDB) {
                    const hashContrasenaActual = await hashPassword(contrasenaActual);
                    if (hashContrasenaActual !== datosActualesDB.password) {
                        hideLoading();
                        showErrorNotification('Error', 'La contraseña actual es incorrecta.');
                        return;
                    }
                }
                
                const hashNuevaContrasena = await hashPassword(nuevaContrasena);
                datosActualizar.password = hashNuevaContrasena;
            }
            
            const referenciaDoc = doc(db, 'usuarios', userId);
            await updateDoc(referenciaDoc, datosActualizar);
            
            const sesionActualizada = {
                ...datosUsuario,
                userId: userId,
                email: email,
                nombre: nombreCompleto,
                tipoUsuario: datosUsuario.tipoUsuario
            };
            localStorage.setItem('userSession', JSON.stringify(sesionActualizada));
            
            hideLoading();
            
            showSuccessNotification(
                '¡Perfil actualizado!',
                'Tus datos han sido actualizados correctamente en la base de datos.',
                () => {
                    document.getElementById('inputCurrentPassword').value = '';
                    document.getElementById('inputNewPassword').value = '';
                    document.getElementById('inputConfirmPassword').value = '';
                    cargarDatosUsuario();
                }
            );
            
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            hideLoading();
            showErrorNotification(
                'Error al actualizar',
                'Ocurrió un error al intentar actualizar tus datos. Por favor, intenta nuevamente. Detalle: ' + error.message
            );
        }
    });
}

// ==========================================
// TOGGLE MOSTRAR/OCULTAR CONTRASEÑA
// ==========================================

const togglePasswordButtons = document.querySelectorAll('.toggle-password-btn');
togglePasswordButtons.forEach(button => {
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

// ==========================================
// ENLACE DINÁMICO AL DASHBOARD SEGÚN ROL
// ==========================================

function configurarEnlaceDashboard() {
    const sesion = localStorage.getItem('userSession');
    if (!sesion) return;
    
    const datos = JSON.parse(sesion);
    const tipo = datos.tipoUsuario || 'estudiante';
    const linkDashboard = document.getElementById('linkDashboard');
    
    if (linkDashboard) {
        const rutas = {
            'estudiante': 'dashboard-estudiante.html',
            'acudiente': 'dashboard-acudiente.html',
            'institucion': 'dashboard-institucion.html',
            'profesor': 'dashboard-profesor.html'
        };
        linkDashboard.href = rutas[tipo] || 'dashboard-estudiante.html';
    }
}

// ==========================================
// GENERAR MENÚ LATERAL DINÁMICO SEGÚN TIPO DE USUARIO
// ==========================================

function generarMenuLateral() {
    const sesion = localStorage.getItem('userSession');
    if (!sesion) return;
    
    const datos = JSON.parse(sesion);
    const tipo = datos.tipoUsuario || 'estudiante';
    
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    
    // Limpiar el menú actual
    sidebarNav.innerHTML = '';
    
    // Menú común: Dashboard
    const dashboardLink = document.createElement('a');
    dashboardLink.href = '#';
    dashboardLink.className = 'nav-item';
    dashboardLink.id = 'linkDashboard';
    dashboardLink.innerHTML = `
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Dashboard</span>
    `;
    sidebarNav.appendChild(dashboardLink);
    
    // Menú específico según tipo de usuario
    if (tipo === 'estudiante') {
        // Menú para estudiante
        const cursosExpandible = document.createElement('div');
        cursosExpandible.className = 'nav-item expandable';
        cursosExpandible.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Mis Cursos</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        sidebarNav.appendChild(cursosExpandible);
        
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        submenu.innerHTML = `
            <a href="#" class="submenu-item">Cursos inscritos</a>
            <a href="#" class="submenu-item">Explorar cursos</a>
        `;
        sidebarNav.appendChild(submenu);
        
    } else if (tipo === 'acudiente') {
        // Menú para acudiente
        const estudiantesExpandible = document.createElement('div');
        estudiantesExpandible.className = 'nav-item expandable';
        estudiantesExpandible.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Mis Estudiantes</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        sidebarNav.appendChild(estudiantesExpandible);
        
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        submenu.innerHTML = `
            <a href="#" class="submenu-item">Estudiantes a cargo</a>
            <a href="#" class="submenu-item">Progreso académico</a>
        `;
        sidebarNav.appendChild(submenu);
        
        // Material de Apoyo
        const materialLink = document.createElement('a');
        materialLink.href = '#';
        materialLink.className = 'nav-item';
        materialLink.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span>Material de Apoyo</span>
        `;
        sidebarNav.appendChild(materialLink);
        
    } else if (tipo === 'institucion') {
        // Menú para institución
        const cursosExpandible = document.createElement('div');
        cursosExpandible.className = 'nav-item expandable';
        cursosExpandible.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Cursos</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        sidebarNav.appendChild(cursosExpandible);
        
        const submenuCursos = document.createElement('div');
        submenuCursos.className = 'submenu';
        submenuCursos.innerHTML = `
            <a href="#" class="submenu-item">Lista de cursos</a>
        `;
        sidebarNav.appendChild(submenuCursos);
        
        // Gestión de Usuarios (expandible)
        const gestionExpandible = document.createElement('div');
        gestionExpandible.className = 'nav-item expandable';
        gestionExpandible.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Gestión de Usuarios</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        sidebarNav.appendChild(gestionExpandible);
        
        const submenuGestion = document.createElement('div');
        submenuGestion.className = 'submenu';
        submenuGestion.innerHTML = `
            <a href="gestion-usuarios-institucion.html" class="submenu-item">Estudiantes</a>
            <a href="#" class="submenu-item">Brigada</a>
            <a href="#" class="submenu-item">Coordinadores</a>
        `;
        sidebarNav.appendChild(submenuGestion);
        
    } else if (tipo === 'profesor') {
        // Menú para profesor
        const cursosExpandible = document.createElement('div');
        cursosExpandible.className = 'nav-item expandable';
        cursosExpandible.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Mis Cursos</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        sidebarNav.appendChild(cursosExpandible);
        
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        submenu.innerHTML = `
            <a href="#" class="submenu-item">Cursos asignados</a>
            <a href="#" class="submenu-item">Crear curso</a>
        `;
        sidebarNav.appendChild(submenu);
        
        // Estudiantes
        const estudiantesLink = document.createElement('a');
        estudiantesLink.href = '#';
        estudiantesLink.className = 'nav-item';
        estudiantesLink.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Estudiantes</span>
        `;
        sidebarNav.appendChild(estudiantesLink);
        
        // Calificaciones
        const calificacionesLink = document.createElement('a');
        calificacionesLink.href = '#';
        calificacionesLink.className = 'nav-item';
        calificacionesLink.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Calificaciones</span>
        `;
        sidebarNav.appendChild(calificacionesLink);
    }
    
    // Mi Perfil (común para todos)
    const perfilLink = document.createElement('a');
    perfilLink.href = 'perfil.html';
    perfilLink.className = 'nav-item active';
    perfilLink.innerHTML = `
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Mi Perfil</span>
    `;
    sidebarNav.appendChild(perfilLink);
    
    // Certificados (solo para estudiante)
    if (tipo === 'estudiante') {
        const certificadosLink = document.createElement('a');
        certificadosLink.href = '#';
        certificadosLink.className = 'nav-item';
        certificadosLink.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>Certificados</span>
        `;
        sidebarNav.appendChild(certificadosLink);
        
        // Material de Apoyo
        const materialLink = document.createElement('a');
        materialLink.href = '#';
        materialLink.className = 'nav-item';
        materialLink.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span>Material de Apoyo</span>
        `;
        sidebarNav.appendChild(materialLink);
    }
    
    // Reconfigurar eventos después de generar el menú
    configurarEventosMenu();
    configurarEnlaceDashboard();
}

// ==========================================
// CONFIGURAR EVENTOS DEL MENÚ
// ==========================================

function configurarEventosMenu() {
    // Eventos para items expandibles
    document.querySelectorAll('.nav-item.expandable').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            item.nextElementSibling.classList.toggle('show');
        });
    });
    
    // Eventos para cerrar sidebar en móvil
    document.querySelectorAll('.sidebar .nav-item:not(.expandable)').forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            if (enlace.querySelector('span') && enlace.querySelector('span').textContent === 'Certificados') {
                e.preventDefault();
                showErrorNotification('En desarrollo', 'Esta sección estará disponible próximamente');
                return;
            }
            
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
    });
}

// ==========================================
// CARGAR DATOS AL INICIAR
// ==========================================

generarMenuLateral();
cargarDatosUsuario();

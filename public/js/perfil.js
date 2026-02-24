import { db, collection, getDocs, query, where } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading } from './notifications.js';

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
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
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
        
        if (!confirm('¿Estás seguro? Los datos serán actualizados en la base de datos.')) {
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
// CARGAR DATOS AL INICIAR
// ==========================================

configurarEnlaceDashboard();
cargarDatosUsuario();

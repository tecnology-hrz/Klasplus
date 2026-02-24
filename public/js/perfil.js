import { db, collection, getDocs, query, where } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading } from './notifications.js';

// ==========================================
// SIDEBAR Y MENÚ MÓVIL
// ==========================================

const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Función para abrir/cerrar sidebar con overlay
const toggleSidebar = () => {
    sidebar.classList.toggle('active');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

// Botón hamburguesa para abrir sidebar
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

// Cerrar sidebar al hacer clic en el overlay
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

// Cerrar sidebar al hacer clic en un enlace (móvil)
document.querySelectorAll('.sidebar .nav-item:not(.expandable)').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        // Verificar si es el enlace de Certificados
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

// Cerrar el menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target)) {
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
        
        // Remover active de todos los botones y contenidos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Agregar active al botón clickeado y su contenido
        button.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

// ==========================================
// VARIABLE GLOBAL PARA EL ID DEL DOCUMENTO
// ==========================================
let documentoIdUsuario = null;

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
        // Buscar el usuario en Firebase por email
        const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
        const resultado = await getDocs(q);
        
        if (!resultado.empty) {
            const documentoUsuario = resultado.docs[0];
            const datosDB = documentoUsuario.data();
            
            // Guardar el ID del documento para usarlo al actualizar
            documentoIdUsuario = documentoUsuario.id;
            
            // Nombre completo del usuario
            const nombreCompleto = datosDB.nombre || datosDB.nombreCompleto || 'Usuario';
            const primerNombre = nombreCompleto.split(' ')[0];
            
            // Actualizar nombre en el header
            const nombreElemento = document.querySelector('.user-name');
            const rolElemento = document.querySelector('.user-role');
            
            if (nombreElemento) nombreElemento.textContent = nombreCompleto;
            if (rolElemento) {
                const tipo = datosDB.tipoUsuario || 'Estudiante';
                rolElemento.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            }
            
            // Actualizar información en el banner
            const perfilNombre = document.getElementById('perfilNombre');
            const perfilDocumento = document.getElementById('perfilDocumento');
            
            if (perfilNombre) perfilNombre.textContent = nombreCompleto;
            if (perfilDocumento) {
                const numDoc = datosDB.numeroDocumento || datosDB.documento || 'N/A';
                perfilDocumento.textContent = numDoc;
            }
            
            // Actualizar documento tipo en el banner
            const perfilDocLabel = document.querySelector('.perfil-documento');
            if (perfilDocLabel && datosDB.tipoDocumento) {
                const abrevTipoDoc = obtenerAbreviaturaTipoDoc(datosDB.tipoDocumento);
                perfilDocLabel.innerHTML = `Documento: ${abrevTipoDoc} <span id="perfilDocumento">${datosDB.numeroDocumento || datosDB.documento || 'N/A'}</span>`;
            }
            
            // Actualizar mensaje de bienvenida
            const highlight = document.querySelector('.welcome-message .highlight');
            if (highlight) {
                highlight.textContent = primerNombre;
            }
            
            // Actualizar formulario de configuración
            const inputNombres = document.getElementById('inputNombres');
            const inputApellidos = document.getElementById('inputApellidos');
            
            if (inputNombres) {
                if (datosDB.nombres) {
                    inputNombres.value = datosDB.nombres;
                } else {
                    const partes = nombreCompleto.split(' ');
                    if (partes.length >= 2) {
                        inputNombres.value = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
                    } else {
                        inputNombres.value = nombreCompleto;
                    }
                }
            }
            
            if (inputApellidos) {
                if (datosDB.apellidos) {
                    inputApellidos.value = datosDB.apellidos;
                } else {
                    const partes = nombreCompleto.split(' ');
                    if (partes.length >= 2) {
                        inputApellidos.value = partes.slice(Math.ceil(partes.length / 2)).join(' ');
                    } else {
                        inputApellidos.value = '';
                    }
                }
            }
            
            const inputTipoDoc = document.getElementById('inputTipoDoc');
            if (inputTipoDoc && datosDB.tipoDocumento) {
                // Buscar la opción que coincida
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
            
            // Actualizar información lateral (sidebar del perfil)
            const infoValues = document.querySelectorAll('.info-value');
            if (infoValues.length >= 2) {
                if (datosDB.institucion) infoValues[0].textContent = datosDB.institucion;
                if (datosDB.grado || datosDB.nivel) infoValues[1].textContent = datosDB.grado || datosDB.nivel;
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// Función auxiliar para abreviar tipo de documento
function obtenerAbreviaturaTipoDoc(tipoDoc) {
    const abreviaturas = {
        'Cédula de identidad': 'CI',
        'Cédula de ciudadanía': 'CC',
        'Pasaporte': 'PA',
        'Tarjeta de identidad': 'TI'
    };
    return abreviaturas[tipoDoc] || tipoDoc;
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
        
        // Confirmar antes de actualizar
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
            
            // Si no tenemos el ID del documento, buscarlo
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
                // Obtener datos actuales para verificar contraseña
                const q = query(collection(db, 'usuarios'), where('email', '==', datosUsuario.email));
                const resultado = await getDocs(q);
                if (!resultado.empty) {
                    datosActualesDB = resultado.docs[0].data();
                }
            }
            
            // Recopilar datos del formulario
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
            
            // Validar campos obligatorios
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
            
            // Preparar datos para actualizar
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
            
            // Si se intenta cambiar la contraseña
            if (contrasenaActual || nuevaContrasena || confirmarContrasena) {
                // Validar que todos los campos de contraseña estén llenos
                if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
                    hideLoading();
                    showErrorNotification('Error', 'Por favor completa todos los campos de contraseña.');
                    return;
                }
                
                // Validar que las contraseñas nuevas coincidan
                if (nuevaContrasena !== confirmarContrasena) {
                    hideLoading();
                    showErrorNotification('Error', 'Las contraseñas nuevas no coinciden.');
                    return;
                }
                
                // Validar longitud mínima
                if (nuevaContrasena.length < 6) {
                    hideLoading();
                    showErrorNotification('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
                    return;
                }
                
                // Verificar contraseña actual
                if (datosActualesDB) {
                    const hashContrasenaActual = await hashPassword(contrasenaActual);
                    if (hashContrasenaActual !== datosActualesDB.password) {
                        hideLoading();
                        showErrorNotification('Error', 'La contraseña actual es incorrecta.');
                        return;
                    }
                }
                
                // Agregar nueva contraseña encriptada
                const hashNuevaContrasena = await hashPassword(nuevaContrasena);
                datosActualizar.password = hashNuevaContrasena;
            }
            
            // Actualizar en Firebase
            const referenciaDoc = doc(db, 'usuarios', userId);
            await updateDoc(referenciaDoc, datosActualizar);
            
            // Actualizar localStorage con la sesión actualizada
            const sesionActualizada = {
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
                    // Limpiar campos de contraseña
                    document.getElementById('inputCurrentPassword').value = '';
                    document.getElementById('inputNewPassword').value = '';
                    document.getElementById('inputConfirmPassword').value = '';
                    
                    // Recargar datos para reflejar los cambios
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
// CARGAR DATOS AL INICIAR
// ==========================================

cargarDatosUsuario();

import { db, collection, addDoc, query, where, getDocs } from './firebase-config.js';
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading } from './notifications.js';

const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getTipoUsuario = () => {
    const path = window.location.pathname;
    if (path.includes('acudiente')) return 'acudiente';
    if (path.includes('estudiante')) return 'estudiante';
    if (path.includes('institucion')) return 'institucion';
    return 'desconocido';
};

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.querySelector('.registro-form');
    
    if (!registroForm) return;
    
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const obtenerCampo = (nombre) => {
            const elemento = registroForm.querySelector(`[name="${nombre}"]`);
            return elemento ? elemento.value.trim() : '';
        };
        
        const email = obtenerCampo('email');
        const password = obtenerCampo('password');
        const nombres = obtenerCampo('nombres');
        const apellidos = obtenerCampo('apellidos');
        const tipoUsuario = getTipoUsuario();
        
        try {
            const q = query(collection(db, 'usuarios'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                hideLoading();
                showErrorNotification(
                    'Correo ya registrado',
                    'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.'
                );
                return;
            }
            
            if (password.length < 6) {
                hideLoading();
                showErrorNotification(
                    'Contraseña débil',
                    'La contraseña debe tener al menos 6 caracteres para mayor seguridad.'
                );
                return;
            }
            
            const hashedPassword = await hashPassword(password);
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            
            const userData = {
                email: email,
                password: hashedPassword,
                tipoUsuario: tipoUsuario,
                fechaRegistro: new Date().toISOString(),
                nombres: nombres,
                apellidos: apellidos,
                nombre: nombreCompleto,
                nombreCompleto: nombreCompleto,
                telefono: obtenerCampo('telefono'),
                tipoDocumento: obtenerCampo('tipoDocumento'),
                numeroDocumento: obtenerCampo('numeroDocumento'),
                documento: obtenerCampo('numeroDocumento'),
                genero: obtenerCampo('genero'),
                jornada: obtenerCampo('jornada')
            };
            
            if (tipoUsuario === 'institucion') {
                userData.institucionNombre = obtenerCampo('institucionNombre');
                userData.institucionTelefono = obtenerCampo('institucionTelefono');
                userData.institucionNit = obtenerCampo('institucionNit');
                userData.institucionDireccion = obtenerCampo('institucionDireccion');
                userData.institucionCiudad = obtenerCampo('institucionCiudad');
                userData.institucionDepartamento = obtenerCampo('institucionDepartamento');
            }
            
            const docRef = await addDoc(collection(db, 'usuarios'), userData);
            
            // Guardar sesión en sessionStorage
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userId', docRef.id);
            sessionStorage.setItem('tipoUsuario', tipoUsuario);
            
            // Guardar sesión en localStorage para el perfil y campus
            const userSession = {
                userId: docRef.id,
                email: email,
                nombre: nombreCompleto,
                tipoUsuario: tipoUsuario
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            
            hideLoading();
            
            showSuccessNotification(
                '¡Registro exitoso!',
                'Bienvenido a Klasplus. Tu cuenta ha sido creada correctamente.',
                () => {
                    if (tipoUsuario === 'estudiante') {
                        window.location.href = 'dashboard-estudiante.html';
                    } else if (tipoUsuario === 'acudiente') {
                        window.location.href = 'dashboard-acudiente.html';
                    } else if (tipoUsuario === 'institucion') {
                        window.location.href = 'dashboard-institucion.html';
                    } else {
                        window.location.href = 'campus.html';
                    }
                }
            );
            
        } catch (error) {
            console.error('Error en el registro:', error);
            hideLoading();
            showErrorNotification(
                'Error en el registro',
                'Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente.'
            );
        }
    });
});

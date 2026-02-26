import { db, collection, addDoc, query, where, getDocs } from './firebase-config.js';
import { showNotification, showLoading, hideLoading } from './notifications.js';

// Función para hashear la contraseña
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const formRegistroAdmin = document.getElementById('formRegistroAdmin');

if (formRegistroAdmin) {
    formRegistroAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(formRegistroAdmin);
        const datos = Object.fromEntries(formData);
        
        // Validaciones
        if (datos.password !== datos.confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (datos.password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        // Mostrar loading
        showLoading();
        
        try {
            // Verificar si el email ya existe
            const q = query(collection(db, 'usuarios'), where('email', '==', datos.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                hideLoading();
                showNotification('Este correo electrónico ya está registrado', 'error');
                return;
            }
            
            // Hashear la contraseña
            const hashedPassword = await hashPassword(datos.password);
            
            // Preparar datos del administrador
            const nombreCompleto = `${datos.nombres} ${datos.apellidos}`;
            const datosAdmin = {
                email: datos.email,
                password: hashedPassword,
                nombre: nombreCompleto,
                nombres: datos.nombres,
                apellidos: datos.apellidos,
                nombreCompleto: nombreCompleto,
                tipoDocumento: datos.tipoDocumento,
                numeroDocumento: datos.numeroDocumento,
                documento: datos.numeroDocumento,
                telefono: datos.telefono,
                genero: datos.genero,
                tipoUsuario: 'admin',
                estado: 'activo',
                fechaRegistro: new Date().toISOString(),
                permisos: {
                    gestionUsuarios: true,
                    gestionCursos: true,
                    gestionContenido: true,
                    reportes: true,
                    configuracion: true
                }
            };
            
            // Guardar en Firestore
            const docRef = await addDoc(collection(db, 'usuarios'), datosAdmin);
            
            // Guardar sesión en sessionStorage
            sessionStorage.setItem('userEmail', datos.email);
            sessionStorage.setItem('userId', docRef.id);
            sessionStorage.setItem('tipoUsuario', 'admin');
            
            // Guardar sesión en localStorage
            const userSession = {
                userId: docRef.id,
                email: datos.email,
                nombre: nombreCompleto,
                tipoUsuario: 'admin'
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            
            hideLoading();
            showNotification('¡Registro exitoso! Redirigiendo al dashboard...', 'success');
            
            // Redirigir al dashboard de admin
            setTimeout(() => {
                window.location.href = 'dashboard-admin.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error en el registro:', error);
            hideLoading();
            
            let mensajeError = 'Error al registrar el administrador. Por favor, intenta nuevamente.';
            
            if (error.code === 'permission-denied') {
                mensajeError = 'No tienes permisos para realizar esta acción';
            } else if (error.message) {
                mensajeError = error.message;
            }
            
            showNotification(mensajeError, 'error');
        }
    });
}

// Validación en tiempo real de contraseñas
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });
}


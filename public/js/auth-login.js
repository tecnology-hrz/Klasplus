import { db, collection, query, where, getDocs } from './firebase-config.js';
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading } from './notifications.js';

// Función para encriptar contraseña (debe coincidir con la del registro)
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Manejar el inicio de sesión
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    
    // Solo ejecutar si existe el formulario de login
    if (!loginForm) {
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Mostrar loading
        showLoading();
        
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passwordInput = loginForm.querySelector('input[type="password"]');
        
        if (!emailInput || !passwordInput) {
            hideLoading();
            return;
        }
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        try {
            // Encriptar contraseña para comparar
            const hashedPassword = await hashPassword(password);
            
            // Buscar usuario en Firestore
            const q = query(
                collection(db, 'usuarios'), 
                where('email', '==', email),
                where('password', '==', hashedPassword)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                hideLoading();
                showErrorNotification(
                    'Credenciales inválidas',
                    'El correo o la contraseña son incorrectos. Por favor, verifica tus datos.'
                );
                return;
            }
            
            // Usuario encontrado
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            // Guardar datos en sessionStorage
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userId', userId);
            sessionStorage.setItem('tipoUsuario', userData.tipoUsuario);
            
            // Guardar sesión en localStorage para campus.html
            const userSession = {
                userId: userId,
                email: email,
                nombre: userData.nombre || userData.nombreCompleto || 'Usuario',
                tipoUsuario: userData.tipoUsuario
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            
            hideLoading();
            
            // Mostrar notificación de éxito
            showSuccessNotification(
                '¡Bienvenido de nuevo!',
                'Has iniciado sesión correctamente en Klasplus.',
                () => {
                    // Redirigir según el tipo de usuario
                    if (userData.tipoUsuario === 'estudiante' || userData.tipoUsuario === 'acudiente') {
                        window.location.href = 'dashboard-estudiante.html';
                    } else if (userData.tipoUsuario === 'institucion') {
                        window.location.href = 'dashboard-admin.html';
                    } else if (userData.tipoUsuario === 'profesor') {
                        window.location.href = 'dashboard-profesor.html';
                    } else {
                        window.location.href = 'campus.html';
                    }
                }
            );
            
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            hideLoading();
            showErrorNotification(
                'Error al iniciar sesión',
                'Ocurrió un error al intentar iniciar sesión. Por favor, intenta nuevamente.'
            );
        }
    });
});

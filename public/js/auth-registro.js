import { db, collection, addDoc, query, where, getDocs } from './firebase-config.js';
import { showSuccessNotification, showErrorNotification, showLoading, hideLoading } from './notifications.js';

// Función para encriptar contraseña (simple hash)
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Obtener el tipo de usuario desde la URL
const getTipoUsuario = () => {
    const path = window.location.pathname;
    if (path.includes('acudiente')) return 'acudiente';
    if (path.includes('estudiante')) return 'estudiante';
    if (path.includes('institucion')) return 'institucion';
    return 'desconocido';
};

// Manejar el registro
document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.querySelector('.registro-form');
    
    // Solo ejecutar si existe el formulario de registro
    if (!registroForm) {
        return;
    }
    
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Mostrar loading
        showLoading();
        
        // Obtener email y contraseña
        const emailInput = registroForm.querySelector('input[type="email"]');
        const passwordInput = registroForm.querySelector('input[type="password"]');
        
        if (!emailInput || !passwordInput) {
            hideLoading();
            return;
        }
        
        const email = emailInput.value;
        const password = passwordInput.value;
        const tipoUsuario = getTipoUsuario();
        
        try {
            // Verificar si el email ya existe
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
            
            // Validar contraseña
            if (password.length < 6) {
                hideLoading();
                showErrorNotification(
                    'Contraseña débil',
                    'La contraseña debe tener al menos 6 caracteres para mayor seguridad.'
                );
                return;
            }
            
            // Encriptar contraseña
            const hashedPassword = await hashPassword(password);
            
            // Recopilar datos del formulario
            const userData = {
                email: email,
                password: hashedPassword,
                tipoUsuario: tipoUsuario,
                fechaRegistro: new Date().toISOString()
            };
            
            // Obtener todos los campos del formulario
            const inputs = registroForm.querySelectorAll('input:not([type="password"]):not([type="checkbox"]):not([type="email"])');
            const selects = registroForm.querySelectorAll('select');
            
            inputs.forEach(input => {
                if (input.value && input.placeholder) {
                    let fieldName = input.placeholder
                        .replace('Por favor ingresar tu ', '')
                        .replace('Por favor ingresa tu ', '')
                        .replace('Por favor ingresar ', '')
                        .toLowerCase()
                        .replace(/ /g, '_');
                    userData[fieldName] = input.value;
                }
            });
            
            selects.forEach(select => {
                if (select.value) {
                    let fieldName = select.options[0].text
                        .replace('Selecciona tu ', '')
                        .toLowerCase()
                        .replace(/ /g, '_');
                    userData[fieldName] = select.value;
                }
            });
            
            // Guardar en Firestore
            const docRef = await addDoc(collection(db, 'usuarios'), userData);
            
            console.log('Usuario registrado con ID:', docRef.id);
            
            // Guardar sesión
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userId', docRef.id);
            sessionStorage.setItem('tipoUsuario', tipoUsuario);
            
            hideLoading();
            
            // Mostrar notificación de éxito
            showSuccessNotification(
                '¡Registro exitoso!',
                'Bienvenido a Klasplus. Tu cuenta ha sido creada correctamente.',
                () => {
                    // Redirigir según el tipo de usuario
                    if (tipoUsuario === 'estudiante' || tipoUsuario === 'acudiente') {
                        window.location.href = 'dashboard-estudiante.html';
                    } else if (tipoUsuario === 'institucion') {
                        window.location.href = 'dashboard-admin.html';
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

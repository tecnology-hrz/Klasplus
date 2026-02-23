// Elementos del DOM
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const closeMenu = document.querySelector('.close-menu');
const body = document.body;

// Crear overlay
const overlay = document.createElement('div');
overlay.className = 'overlay';
body.appendChild(overlay);

// Abrir menú móvil
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    body.style.overflow = 'hidden';
});

// Cerrar menú móvil
const closeMobileMenu = () => {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    body.style.overflow = '';
};

closeMenu.addEventListener('click', closeMobileMenu);
overlay.addEventListener('click', closeMobileMenu);

// Cerrar menú al hacer clic en un enlace
const mobileLinks = document.querySelectorAll('.mobile-nav-menu a');
mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// Cerrar menú con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// ===== CARRUSEL =====
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.carousel-arrow.prev');
const nextBtn = document.querySelector('.carousel-arrow.next');
let currentSlide = 0;
let autoSlideInterval;

// Función para mostrar slide
function showSlide(index) {
    // Asegurar que el índice esté en rango
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    // Remover clase active de todos
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Agregar clase active al actual
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// Siguiente slide
function nextSlide() {
    showSlide(currentSlide + 1);
}

// Slide anterior
function prevSlide() {
    showSlide(currentSlide - 1);
}

// Event listeners para flechas
nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
});

// Event listeners para puntos
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        showSlide(index);
        resetAutoSlide();
    });
});

// Auto-slide cada 5 segundos
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
}

// Iniciar auto-slide
startAutoSlide();

// Pausar auto-slide cuando el mouse está sobre el carrusel
const carousel = document.querySelector('.carousel');
carousel.addEventListener('mouseenter', () => {
    clearInterval(autoSlideInterval);
});

carousel.addEventListener('mouseleave', () => {
    startAutoSlide();
});

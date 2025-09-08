document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 900,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80
    });

    // Cache DOM Elements
    const header = document.getElementById('main-header');
    const root = document.documentElement;
    const mainNav = document.getElementById('main-nav');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const body = document.body;
    const preHeroBanner = document.getElementById('pre-hero-banner');
    const navLinksScroll = document.querySelectorAll('#main-nav a[href^="#"], .scroll-down[href^="#"], .logo[href^="#"], .footer-logo[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    const yearSpan = document.getElementById('current-year');
    const zoomedContainer = document.querySelector('.zoomed-container');
    const zoomedImageEl = document.querySelector('.zoomed-image');
    const closeZoomBtn = document.querySelector('.close-zoom');


    // Utility Functions
    function getCssVariable(variable) {
        const varName = variable.startsWith('--') ? variable : '--' + variable;
        return getComputedStyle(root).getPropertyValue(varName).trim();
    }

    // --- Header Logic ---
    let lastScrollTop = 0;
    function updateHeaderState() {
        const currentHeightVar = header.classList.contains('scrolled') ? '--header-height-scrolled' : '--header-height-initial';
        const currentHeightValue = getCssVariable(currentHeightVar) || '70px';
        root.style.setProperty('--header-height-current', currentHeightValue);

        if (mainNav) {
            mainNav.style.top = currentHeightValue;
            mainNav.style.maxHeight = `calc(100vh - ${currentHeightValue})`;
        }
        if (preHeroBanner) {
            preHeroBanner.style.marginTop = currentHeightValue;
        }
    }

    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldBeScrolled = scrollTop > 50;
        let stateChanged = false;

        if (shouldBeScrolled !== header.classList.contains('scrolled')) {
            header.classList.toggle('scrolled', shouldBeScrolled);
            stateChanged = true;
        }

        if (stateChanged) {
            updateHeaderState();
        }
        activateNavLink();
    }

    // --- Mobile Navigation ---
    function toggleMobileNav() {
        if (!mainNav || !mobileNavToggle) return;
        const isNavActive = mainNav.classList.toggle('active');
        mobileNavToggle.classList.toggle('active', isNavActive);
        body.classList.toggle('mobile-nav-active', isNavActive);
        mobileNavToggle.setAttribute('aria-expanded', isNavActive);
        const icon = mobileNavToggle.querySelector('i');
        const label = mobileNavToggle.querySelector('.sr-only');
        if (icon) {
            icon.className = isNavActive ? 'fas fa-times' : 'fas fa-bars';
        }
        if (label) {
            label.textContent = isNavActive ? 'Cerrar menú' : 'Abrir menú';
        }
    }

    // --- Smooth Scrolling & Active Link Highlighting ---
    function activateNavLink() {
        let currentHeaderHeight = parseInt(getCssVariable('--header-height-current') || '70', 10);
        let scrollY = window.pageYOffset;
        let currentSectionId = null;

        sections.forEach(current => {
            const sectionTop = current.offsetTop;
            const sectionHeight = current.offsetHeight;
            // Ajustar puntos de activación para que el enlace se active un poco antes de que la sección llegue exactamente al borde superior
            const triggerPoint = sectionTop - currentHeaderHeight - window.innerHeight * 0.2; // Más cerca de la parte superior
            const endPoint = sectionTop + sectionHeight - currentHeaderHeight - window.innerHeight * 0.5; // Más abajo

            if (scrollY >= triggerPoint && scrollY < endPoint) {
                currentSectionId = current.getAttribute('id');
            }
        });

        // Manejo especial para el final de la página (activar último enlace)
        let footer = document.getElementById('main-footer');
        if (footer && (window.innerHeight + scrollY) >= document.body.offsetHeight - (footer.offsetHeight * 0.8) && sections.length > 0) { // Activar antes de llegar al fondo
            currentSectionId = sections[sections.length - 1]?.getAttribute('id') || currentSectionId;
        }

        // Manejo especial para el inicio (activar 'Inicio' si está cerca de la parte superior)
        if (!currentSectionId && scrollY < window.innerHeight * 0.4) { // Activar si está en el primer 40% de la altura de la ventana
            currentSectionId = 'pre-hero-banner';
        }

        navLinksScroll.forEach(link => {
            const linkHref = link.getAttribute('href');
            const isLogo = link.classList.contains('logo') || link.classList.contains('footer-logo');
            const targetId = linkHref ? linkHref.substring(1) : null;

            if (targetId) {
                // Para los logos, solo activar si el target es pre-hero-banner y estamos ahí
                if (isLogo && targetId === 'pre-hero-banner') {
                    link.classList.toggle('active', currentSectionId === 'pre-hero-banner');
                }
                // Para los enlaces normales del nav, activar si coincide el ID
                else if (!isLogo && link.closest('#main-nav')) {
                    link.classList.toggle('active', targetId === currentSectionId);
                }
                // Para otros enlaces (como scroll-down), no aplicar clase 'active' visualmente
                else {
                    link.classList.remove('active'); // Asegurarse que otros no tengan 'active'
                }
            } else {
                link.classList.remove('active'); // Limpiar enlaces sin href válido
            }
        });
    }


    function handleNavLinkClick(e) {
        const targetHref = this.getAttribute('href');

        // Si no es un enlace interno (#...) o es el toggle del menú, no hacer smooth scroll
        if (!targetHref || !targetHref.startsWith('#') || this.isEqualNode(mobileNavToggle)) {
            // Si es un enlace externo y el menú móvil está abierto, ciérralo
            if (mainNav.classList.contains('active') && !this.isEqualNode(mobileNavToggle)) {
                toggleMobileNav();
            }
            return; // Permite el comportamiento por defecto (ir a URL externa o no hacer nada)
        }

        e.preventDefault(); // Prevenir el salto por defecto solo para enlaces internos
        const targetElement = document.querySelector(targetHref);

        if (targetElement) {
            let currentHeaderHeight = parseInt(getCssVariable('--header-height-current') || '70', 10);
            let offsetTop = targetElement.offsetTop;
            // Para el primer banner, ir al inicio (0). Para otros, ajustar por altura del header.
            let scrollToPosition = (targetHref === '#pre-hero-banner') ? 0 : offsetTop - currentHeaderHeight + 1;

            window.scrollTo({ top: scrollToPosition, behavior: 'smooth' });

            // Cerrar menú móvil si está activo después de hacer clic en un enlace interno
            if (mainNav.classList.contains('active')) {
                toggleMobileNav();
            }
        }
    }

    // --- Gallery Slider & Zoom ---
    function initializeGallerySliders() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        // Asegurarse de que los elementos de zoom existan antes de continuar
        if (!zoomedContainer || !zoomedImageEl || !closeZoomBtn) {
            console.warn("Elementos del zoom no encontrados. Funcionalidad de zoom desactivada.");
            // No añadir listeners si faltan elementos clave
            return;
        }


        galleryItems.forEach(item => {
            const sliderContainer = item.querySelector('.slider-container');
            const sliderImages = item.querySelector('.slider-images');
            const prevBtn = item.querySelector('.prev-btn');
            const nextBtn = item.querySelector('.next-btn');
            const indicatorsContainer = item.querySelector('.slider-indicators');
            const zoomBtn = item.querySelector('.zoom-btn');

            if (!sliderContainer || !sliderImages) return;

            const images = Array.from(sliderImages.querySelectorAll('img'));
            let indicators = [];
            const imageCount = images.length;

            // Si no hay imágenes, ocultar controles y salir
            if (imageCount === 0) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                if (indicatorsContainer) indicatorsContainer.style.display = 'none';
                if (zoomBtn) zoomBtn.style.display = 'none';
                return;
            }

            // Crear indicadores solo si hay más de una imagen
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = ''; // Limpiar indicadores previos
                if (imageCount > 1) {
                    indicatorsContainer.style.display = 'flex'; // Asegurar que sea visible
                    indicators = images.map((_, index) => {
                        const span = document.createElement('span');
                        span.addEventListener('click', () => goToSlide(index));
                        indicatorsContainer.appendChild(span);
                        return span;
                    });
                } else {
                    indicatorsContainer.style.display = 'none'; // Ocultar si solo hay 1 imagen
                }
            }

            let currentIndex = 0;

            function goToSlide(index) {
                currentIndex = index;
                if (sliderImages) {
                    sliderImages.style.transform = `translateX(-${currentIndex * 100}%)`;
                }
                // Actualizar indicadores solo si existen
                if (indicators.length > 0) {
                    indicators.forEach((indicator, i) => {
                        indicator.classList.toggle('active', i === currentIndex);
                    });
                }
            }

            // Mostrar/ocultar botones de navegación según el número de imágenes
            function updateSliderNavVisibility() {
                const singleImage = imageCount <= 1;
                if (prevBtn) prevBtn.style.display = singleImage ? 'none' : '';
                if (nextBtn) nextBtn.style.display = singleImage ? 'none' : '';
            }

            // Añadir listeners a los botones solo si existen
            if (nextBtn) { nextBtn.addEventListener('click', () => goToSlide((currentIndex + 1) % imageCount)); }
            if (prevBtn) { prevBtn.addEventListener('click', () => goToSlide((currentIndex - 1 + imageCount) % imageCount)); }

            // Event Listener for Zoom (Solo si el botón existe y hay imágenes)
            if (zoomBtn && imageCount > 0) {
                zoomBtn.style.display = ''; // Asegurar que sea visible si hay imágenes
                zoomBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevenir que el click se propague al item
                    // Asegurarse que zoomedImageEl exista antes de usarlo
                    if (images[currentIndex] && zoomedImageEl && zoomedContainer) {
                        zoomedImageEl.src = images[currentIndex].src;
                        zoomedImageEl.alt = images[currentIndex].alt || 'Imagen ampliada';
                        zoomedContainer.classList.add('active');
                        body.style.overflow = 'hidden'; // Evitar scroll del fondo
                        header.classList.add('hidden-by-zoom');
                    }
                });
            } else if (zoomBtn) {
                zoomBtn.style.display = 'none'; // Ocultar botón de zoom si no hay imágenes
            }


            goToSlide(0); // Ir a la primera imagen inicialmente
            updateSliderNavVisibility(); // Ajustar visibilidad de botones nav
        });

        // --- Zoom Close Logic ---
        function closeZoom() {
            if (zoomedContainer) {
                zoomedContainer.classList.remove('active');
                body.style.overflow = '';
                header.classList.remove('hidden-by-zoom');// Restaurar scroll del body
            }
        }

        // Añadir listeners para cerrar el zoom solo si los elementos existen
        if (closeZoomBtn) {
            closeZoomBtn.addEventListener('click', closeZoom);
        }
        if (zoomedContainer) {
            // Cerrar al hacer clic fuera de la imagen
            zoomedContainer.addEventListener('click', (e) => {
                if (e.target === zoomedContainer) { // Asegurarse que el clic fue en el fondo y no en la imagen
                    closeZoom();
                }
            });
        }

        // Añadir listener para tecla Escape (solo una vez)
        if (zoomedContainer && !document.keyListenerAdded) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && zoomedContainer.classList.contains('active')) {
                    closeZoom();
                }
            });
            document.keyListenerAdded = true; // Marcar que el listener ya fue añadido
        }

    }


    // --- Footer Year ---
    function setFooterYear() { if (yearSpan) yearSpan.textContent = new Date().getFullYear(); }

    // --- Initial Setup Calls ---
    updateHeaderState(); // Establecer altura inicial del header
    handleScroll();      // Revisar estado inicial del scroll para header y nav activo
    initializeGallerySliders(); // Inicializar galerías y zoom
    setFooterYear();     // Poner el año actual en el footer

    // --- Global Event Listeners ---
    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', toggleMobileNav);
    }
    navLinksScroll.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    window.addEventListener('scroll', handleScroll, { passive: true }); // Optimización para scroll

    // Recalcular en resize (con debounce)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateHeaderState();
            activateNavLink(); // Reajustar enlace activo en resize
        }, 250); // Esperar 250ms después del último evento resize
    });



    // Dropdown móvil optimizado
    document.addEventListener('DOMContentLoaded', function () {
        const dropdownTrigger = document.querySelector('.dropdown-trigger');
        const dropdown = document.querySelector('.dropdown');

        if (dropdownTrigger && dropdown) {
            // Manejar click en móvil
            dropdownTrigger.addEventListener('click', function (e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('mobile-active');

                    // Cerrar otros dropdowns
                    document.querySelectorAll('.dropdown:not(.mobile-active)').forEach(dd => {
                        dd.classList.remove('mobile-active');
                    });
                }
            });

            // Cerrar al hacer click fuera
            document.addEventListener('click', function (e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('mobile-active');
                }
            });

            // Limpiar estado al redimensionar
            window.addEventListener('resize', function () {
                if (window.innerWidth > 768) {
                    dropdown.classList.remove('mobile-active');
                }
            });
        }
    });
    // Funcionalidad de slider y zoom (agregar al script.js de Ciudad del Río)
    document.addEventListener('DOMContentLoaded', function () {
        // Inicializar sliders
        initializeSliders();
        // Inicializar zoom
        initializeZoom();
    });

    function initializeSliders() {
        const sliders = document.querySelectorAll('.slider-container');

        sliders.forEach(slider => {
            const images = slider.querySelector('.slider-images');
            const prevBtn = slider.querySelector('.prev-btn');
            const nextBtn = slider.querySelector('.next-btn');
            const indicators = slider.querySelector('.slider-indicators');

            if (!images || images.children.length <= 1) return;

            let currentIndex = 0;
            const totalImages = images.children.length;

            // Crear indicadores
            for (let i = 0; i < totalImages; i++) {
                const indicator = document.createElement('span');
                if (i === 0) indicator.classList.add('active');
                indicators.appendChild(indicator);
            }

            function updateSlider() {
                images.style.transform = `translateX(-${currentIndex * 100}%)`;

                indicators.querySelectorAll('span').forEach((span, index) => {
                    span.classList.toggle('active', index === currentIndex);
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : totalImages - 1;
                    updateSlider();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentIndex = currentIndex < totalImages - 1 ? currentIndex + 1 : 0;
                    updateSlider();
                });
            }

            indicators.addEventListener('click', (e) => {
                if (e.target.tagName === 'SPAN') {
                    currentIndex = Array.from(indicators.children).indexOf(e.target);
                    updateSlider();
                }
            });
        });
    }

    function initializeZoom() {
        const zoomBtns = document.querySelectorAll('.zoom-btn');
        const zoomedContainer = document.querySelector('.zoomed-container');
        const zoomedImage = document.querySelector('.zoomed-image');
        const closeZoom = document.querySelector('.close-zoom');

        zoomBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sliderContainer = btn.closest('.slider-container');
                const activeImage = sliderContainer.querySelector('.slider-images img');

                zoomedImage.src = activeImage.src;
                zoomedImage.alt = activeImage.alt;
                zoomedContainer.classList.add('active');
            });
        });

        if (closeZoom) {
            closeZoom.addEventListener('click', () => {
                zoomedContainer.classList.remove('active');
            });
        }

        if (zoomedContainer) {
            zoomedContainer.addEventListener('click', (e) => {
                if (e.target === zoomedContainer) {
                    zoomedContainer.classList.remove('active');
                }
            });
        }
    }
    // === VERSIÓN CORREGIDA Y SIMPLIFICADA DEL CARRUSEL ==
    function initializeDevelopmentCarousel() {
        console.log('Inicializando carrusel...'); // Para debug

        const track = document.querySelector('.carousel-track');
        const slides = document.querySelectorAll('.carousel-slide');
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const dots = document.querySelectorAll('.dot');

        // Debug: verificar que se encuentren los elementos
        console.log('Track:', track);
        console.log('Slides:', slides.length);
        console.log('Prev button:', prevBtn);
        console.log('Next button:', nextBtn);
        console.log('Dots:', dots.length);

        if (!track || !slides.length || !prevBtn || !nextBtn) {
            console.error('Elementos del carrusel no encontrados');
            return;
        }

        let currentIndex = 0;
        const totalSlides = slides.length;

        // Función para actualizar el carrusel
        function updateCarousel() {
            console.log('Actualizando carrusel, slide actual:', currentIndex);

            const translateX = -currentIndex * 100;
            track.style.transform = `translateX(${translateX}%)`;

            // Actualizar dots
            dots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // Actualizar slides
            slides.forEach((slide, index) => {
                if (index === currentIndex) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
        }

        // Función para ir al siguiente slide
        function nextSlide() {
            console.log('Siguiente slide');
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        }

        // Función para ir al slide anterior
        function prevSlide() {
            console.log('Slide anterior');
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }

        // Función para ir a un slide específico
        function goToSlide(index) {
            console.log('Ir al slide:', index);
            currentIndex = index;
            updateCarousel();
        }

        // Event listeners
        prevBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Click en botón anterior');
            prevSlide();
        });

        nextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Click en botón siguiente');
            nextSlide();
        });

        // Event listeners para los dots
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Click en dot:', index);
                goToSlide(index);
            });
        });

        // Auto-play cada 5 segundos (opcional)
        setInterval(function () {
            nextSlide();
        }, 5000);

        // Inicializar
        updateCarousel();
        console.log('Carrusel inicializado correctamente');
    }

    // === INICIALIZACIÓN ===
    // Opción 1: Si ya tienes DOMContentLoaded, agrega solo esta línea:
    // initializeDevelopmentCarousel();

    // Opción 2: Si no tienes DOMContentLoaded, usa este bloque completo:
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOM cargado, inicializando carrusel...');

        // Esperar un poco para asegurar que AOS y otros scripts hayan terminado
        setTimeout(function () {
            initializeDevelopmentCarousel();
        }, 500);
    });

    // Opción 3: Como respaldo, también inicializar cuando la ventana cargue completamente
    window.addEventListener('load', function () {
        console.log('Ventana cargada completamente, verificando carrusel...');

        // Solo inicializar si no se ha hecho ya
        if (!document.querySelector('.carousel-track[data-initialized]')) {
            initializeDevelopmentCarousel();

            // Marcar como inicializado
            const track = document.querySelector('.carousel-track');
            if (track) {
                track.setAttribute('data-initialized', 'true');
            }
        }
    });

    // Agregar al DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        initializeDevelopmentCarousel();
        // ... resto de funciones
    });
});

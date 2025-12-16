// Controlador principal
import { SearchEngine } from './search-engine.js';
import { UIRenderer } from './ui-renderer.js';

class App {
  constructor() {
    this.engine = null;
    this.renderer = null;
    this.searchInput = document.getElementById('searchInput');
    this.filterToggle = document.getElementById('filterToggle');
    this.closeSidebar = document.getElementById('closeSidebar');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.sidebar = document.getElementById('sidebar');
    this.isLoading = false;
    this.carousels = new Map(); // Guardar intervalos de carruseles
    
    this.init();
  }

  async init() {
    try {
      const response = await fetch('/test/data/productos.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const productos = await response.json();
      this.engine = new SearchEngine(productos);
      this.renderer = new UIRenderer(this.engine);
      
      this.setupEventListeners();
      this.renderer.renderFilters();
      this.renderer.renderProductos();
      this.initCarousels(); // ✅ Iniciar carruseles automáticos
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      document.getElementById('productList').innerHTML = 
        '<p style="text-align: center; padding: 2rem; color: #666;">Error al cargar el catálogo. Por favor, recarga la página.</p>';
    }
  }

  setupEventListeners() {
    // Búsqueda en tiempo real
    let searchTimeout;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.engine.search(e.target.value);
        this.renderer.renderProductos();
        this.initCarousels(); // ✅ Re-iniciar carruseles después de renderizar
      }, 300);
    });

    // Toggle sidebar móvil
    this.filterToggle.addEventListener('click', () => {
      this.sidebar.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    this.closeSidebar.addEventListener('click', () => {
      this.sidebar.classList.remove('active');
      document.body.style.overflow = 'auto';
    });

    // Cerrar sidebar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          this.sidebar.classList.contains('active') && 
          !this.sidebar.contains(e.target) && 
          !this.filterToggle.contains(e.target)) {
        this.sidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });

    // Filtros
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-tipo]')) {
        const tipo = e.target.dataset.tipo;
        const valor = e.target.dataset.valor;
        this.engine.toggleFiltro(tipo, valor);
        this.renderer.renderProductos();
        this.renderer.renderFilters();
        this.initCarousels(); // ✅ Re-iniciar carruseles
      }
    });

    // Limpiar filtros
    this.clearFiltersBtn.addEventListener('click', () => {
      this.engine.clearFilters();
      this.renderer.renderProductos();
      this.renderer.renderFilters();
      this.searchInput.value = '';
      this.initCarousels(); // ✅ Re-iniciar carruseles
    });

    // Scroll infinito
    window.addEventListener('scroll', () => {
      if (this.isLoading) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 400;
      
      if (scrollPosition >= threshold && this.engine.hasMore()) {
        this.isLoading = true;
        this.engine.loadMore();
        this.renderer.renderProductos();
        this.initCarousels(); // ✅ Re-iniciar carruseles
        this.isLoading = false;
      }
    });

    // Modal
    this.setupModal();
  }

  // ✅ SISTEMA DE CARRUSEL AUTOMÁTICO (COPIA EXACTA DE TU VERSIÓN)
  initCarousels() {
    // Limpiar carruseles anteriores
    this.carousels.forEach(interval => clearInterval(interval));
    this.carousels.clear();

    // Inicializar cada carrusel
    document.querySelectorAll('.carousel-container').forEach((container, index) => {
      const carousel = container.querySelector('.carousel');
      const images = carousel.querySelectorAll('img');
      const indicators = container.querySelectorAll('.carousel-indicator');
      const prevBtn = container.querySelector('.carousel-prev');
      const nextBtn = container.querySelector('.carousel-next');
      
      let currentIndex = 0;
      const totalImages = images.length;
      
      function updateCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        indicators.forEach((indicator, idx) => {
          indicator.classList.toggle('active', idx === currentIndex);
        });
      }
      
      prevBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalImages) % totalImages;
        updateCarousel();
      });
      
      nextBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalImages;
        updateCarousel();
      });
      
      indicators.forEach((indicator, idx) => {
        indicator.addEventListener('click', () => {
          currentIndex = idx;
          updateCarousel();
        });
      });
      
      // ✅ AUTO-CAMBIO CADA 3 SEGUNDOS
      let autoSlide = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalImages;
        updateCarousel();
      }, 3000);
      
      // ✅ PAUSA AL PASAR MOUSE
      container.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
      });
      
      // ✅ REANUDA AL SALIR MOUSE (5 SEGUNDOS)
      container.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => {
          currentIndex = (currentIndex + 1) % totalImages;
          updateCarousel();
        }, 5000);
      });
      
      // Guardar referencia para limpiar después
      this.carousels.set(container, autoSlide);
    });
  }

  setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal .prev');
    const nextBtn = document.querySelector('.modal .next');
    const modalImg = document.getElementById('modal-img');
    const counter = document.getElementById('image-counter');

    let currentImages = [];
    let currentImageIndex = 0;

    // Abrir modal al hacer clic en cualquier imagen del carrusel
    document.addEventListener('click', (e) => {
      if (e.target.matches('.carousel img')) {
        const container = e.target.closest('.carousel-container');
        const carousel = container.querySelector('.carousel');
        const imagenes = Array.from(carousel.querySelectorAll('img')).map(img => img.src);
        currentImages = imagenes;
        const carouselImages = Array.from(carousel.querySelectorAll('img'));
        currentImageIndex = carouselImages.indexOf(e.target);

        modalImg.src = e.target.src;
        this.updateImageCounter(counter, currentImageIndex, currentImages.length);
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
      }
    });

    const cambiarImagen = (direction) => {
      if (currentImages.length <= 1) return;
      currentImageIndex += direction;
      if (currentImageIndex >= currentImages.length) {
        currentImageIndex = 0;
      } else if (currentImageIndex < 0) {
        currentImageIndex = currentImages.length - 1;
      }
      modalImg.src = currentImages[currentImageIndex];
      this.updateImageCounter(counter, currentImageIndex, currentImages.length);
    };

    closeBtn.addEventListener('click', () => this.closeModal(modal));
    prevBtn.addEventListener('click', () => cambiarImagen(-1));
    nextBtn.addEventListener('click', () => cambiarImagen(1));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal(modal);
    });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeModal(modal);
      if (e.key === 'ArrowLeft') cambiarImagen(-1);
      if (e.key === 'ArrowRight') cambiarImagen(1);
    });
  }

  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  updateImageCounter(counter, index, total) {
    counter.textContent = `${index + 1} / ${total}`;
  }
}

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

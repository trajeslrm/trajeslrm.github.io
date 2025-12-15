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
    
    this.init();
  }

  async init() {
    try {
      // Cargar productos
      const response = await fetch('./data/productos.json');
      const productos = await response.json();
      
      this.engine = new SearchEngine(productos);
      this.renderer = new UIRenderer(this.engine);
      
      this.setupEventListeners();
      this.renderer.renderFilters();
      this.renderer.renderProductos();
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      document.getElementById('productList').innerHTML = 
        '<p>Error al cargar el catálogo. Por favor, recarga la página.</p>';
    }
  }

  setupEventListeners() {
    // Búsqueda en tiempo real con debounce
    let searchTimeout;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.engine.search(e.target.value);
        this.renderer.renderProductos();
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

    // Cerrar sidebar al hacer clic fuera (móvil)
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
      }
    });

    // Limpiar filtros
    this.clearFiltersBtn.addEventListener('click', () => {
      this.engine.clearFilters();
      this.renderer.renderProductos();
      this.renderer.renderFilters();
      this.searchInput.value = '';
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
        this.isLoading = false;
      }
    });

    // Modal (mantener funcionalidad existente)
    this.setupModal();
  }

  setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal .prev');
    const nextBtn = document.querySelector('.modal .next');
    const modalImg = document.getElementById('modal-img');
    const counter = document.getElementById('image-counter');

    closeBtn.addEventListener('click', () => this.closeModal(modal));
    prevBtn.addEventListener('click', () => this.navigateModal(-1, modalImg, counter));
    nextBtn.addEventListener('click', () => this.navigateModal(1, modalImg, counter));
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal(modal);
    });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeModal(modal);
      if (e.key === 'ArrowLeft') this.navigateModal(-1, modalImg, counter);
      if (e.key === 'ArrowRight') this.navigateModal(1, modalImg, counter);
    });
  }

  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  navigateModal(direction, modalImg, counter) {
    if (!window.currentModalImages) return;
    
    window.currentModalIndex += direction;
    if (window.currentModalIndex >= window.currentModalImages.length) {
      window.currentModalIndex = 0;
    } else if (window.currentModalIndex < 0) {
      window.currentModalIndex = window.currentModalImages.length - 1;
    }
    
    modalImg.src = window.currentModalImages[window.currentModalIndex];
    counter.textContent = `${window.currentModalIndex + 1} / ${window.currentModalImages.length}`;
  }
}

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

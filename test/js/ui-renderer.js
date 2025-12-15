// Renderizado de UI dinámico
export class UIRenderer {
  constructor(engine) {
    this.engine = engine;
    this.productList = document.getElementById('productList');
    this.resultsCount = document.getElementById('resultsCount');
    this.infiniteSpinner = document.getElementById('infiniteSpinner');
  }

  renderProductos() {
    const productos = this.engine.getCurrentBatch();
    const hasMore = this.engine.hasMore();
    
    this.resultsCount.textContent = `Mostrando ${productos.length} de ${this.engine.filtered.length} productos`;
    
    this.productList.innerHTML = productos.map(p => this.createProductCard(p)).join('');
    
    this.infiniteSpinner.style.display = hasMore ? 'flex' : 'none';
    
    this.attachModalListeners();
  }

  createProductCard(producto) {
    const imagen = producto.imagenes[0];
    const tallas = producto.tallas.join(', ');
    const colores = producto.colores.join(', ');
    
    return `
      <article class="product-card" data-id="${producto.id}">
        <img src="${imagen}" alt="${producto.nombre}" class="product-image" data-images='${JSON.stringify(producto.imagenes)}'>
        
        <div class="product-info">
          <h3 class="product-name">${producto.nombre}</h3>
          <div class="product-attributes">
            <span><strong>Tallas:</strong> ${tallas}</span> | 
            <span><strong>Color:</strong> ${colores}</span> | 
            <span><strong>Tipo:</strong> ${producto.tipo}</span> | 
            <span><strong>Categoría:</strong> ${producto.categoria}</span>
          </div>
          ${producto.descripcionHtml ? `<div class="product-description">${producto.descripcionHtml}</div>` : ''}
        </div>
        
        <div class="product-actions">
          <div class="product-price">$15 / 3 días</div>
          <a href="${producto.whatsappUrl}" target="_blank" class="whatsapp-btn">
            <i class="fab fa-whatsapp"></i> Reservar
          </a>
        </div>
      </article>
    `;
  }

  renderFilters() {
    const counts = this.engine.getFilterCounts();
    
    this.renderFilterGroup('tallaFilters', 'tallas', counts.tallas);
    this.renderFilterGroup('colorFilters', 'colores', counts.colores);
    this.renderFilterGroup('tipoFilters', 'tipos', counts.tipos);
    this.renderFilterGroup('categoriaFilters', 'categorias', counts.categorias);
  }

  renderFilterGroup(containerId, tipo, counts) {
    const container = document.getElementById(containerId);
    const filtrosActivos = this.engine.filtros[tipo.replace(/s$/, '')];
    
    const opciones = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([valor, count]) => {
        const checked = filtrosActivos.has(valor) ? 'checked' : '';
        return `
          <div class="filter-option">
            <input type="checkbox" id="${tipo}_${valor}" ${checked} 
                   data-tipo="${tipo.replace(/s$/, '')}" data-valor="${valor}">
            <label for="${tipo}_${valor}">${valor}</label>
            <small>(${count})</small>
          </div>
        `;
      });
    
    container.innerHTML = opciones.join('');
  }

  attachModalListeners() {
    document.querySelectorAll('.product-image').forEach(img => {
      img.addEventListener('click', (e) => {
        const images = JSON.parse(e.target.dataset.images);
        this.openModal(images, e.target.src);
      });
    });
  }

  openModal(images, currentSrc) {
    // Reutiliza el modal existente
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const counter = document.getElementById('image-counter');
    
    modalImg.src = currentSrc;
    counter.textContent = `1 / ${images.length}`;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
    
    // Adjuntar navegación del modal si tienes múltiples imágenes
    window.currentModalImages = images;
    window.currentModalIndex = 0;
  }
}

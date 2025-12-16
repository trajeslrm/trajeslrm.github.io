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
  }

  createProductCard(producto) {
    const tallas = producto.tallas.join(', ');
    const colores = producto.colores.join(', ');
    
    // ✅ ESTRUCTURA DE CARRUSEL IDÉNTICA A TU VERSIÓN
    return `
      <article class="product-card" data-id="${producto.id}">
        <div class="carousel-container">
          <div class="carousel">
            ${producto.imagenes.map(img => `<img src="${img}" alt="${producto.nombre}" loading="lazy">`).join('')}
          </div>
          <button class="carousel-nav carousel-prev">❮</button>
          <button class="carousel-nav carousel-next">❯</button>
          <div class="carousel-indicators">
            ${producto.imagenes.map((_, i) => `<div class="carousel-indicator ${i === 0 ? 'active' : ''}"></div>`).join('')}
          </div>
        </div>
        
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
}

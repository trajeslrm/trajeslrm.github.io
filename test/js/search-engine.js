// Motor de búsqueda y filtrado
export class SearchEngine {
  constructor(productos) {
    this.productos = productos;
    this.filtered = [...productos];
    this.searchIndex = this.buildSearchIndex();
    this.filtros = {
      tallas: new Set(),
      colores: new Set(),
      tipos: new Set(),
      categorias: new Set()
    };
    this.batchSize = 12;
    this.currentBatch = 1;
  }

  buildSearchIndex() {
    const index = new Map();
    this.productos.forEach(producto => {
      const texto = [
        producto.nombre,
        producto.tipo,
        producto.categoria,
        producto.colores.join(' '),
        producto.tallas.join(' ')
      ].join(' ').toLowerCase();
      
      const palabras = texto.split(/\s+/);
      palabras.forEach(palabra => {
        if (!index.has(palabra)) index.set(palabra, []);
        index.get(palabra).push(producto.id);
      });
    });
    return index;
  }

  search(query) {
    if (!query.trim()) {
      this.filtered = [...this.productos];
    } else {
      const terminos = query.toLowerCase().split(/\s+/);
      const resultSets = terminos.map(termino => {
        if (this.searchIndex.has(termino)) {
          return new Set(this.searchIndex.get(termino));
        }
        return new Set();
      });

      if (resultSets.length > 0) {
        const intersection = resultSets.reduce((a, b) => {
          const set = new Set();
          for (let id of a) if (b.has(id)) set.add(id);
          return set;
        });
        
        this.filtered = this.productos.filter(p => intersection.has(p.id));
      } else {
        this.filtered = [];
      }
    }
    this.applyFilters();
  }

  toggleFiltro(tipo, valor) {
    const set = this.filtros[tipo];
    if (set.has(valor)) {
      set.delete(valor);
    } else {
      set.add(valor);
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filtered = this.filtered.filter(producto => {
      if (this.filtros.tallas.size > 0) {
        const tieneTalla = producto.tallas.some(t => this.filtros.tallas.has(t));
        if (!tieneTalla) return false;
      }
      
      if (this.filtros.colores.size > 0) {
        const tieneColor = producto.colores.some(c => this.filtros.colores.has(c));
        if (!tieneColor) return false;
      }
      
      if (this.filtros.tipos.size > 0 && !this.filtros.tipos.has(producto.tipo)) {
        return false;
      }
      
      if (this.filtros.categorias.size > 0 && !this.filtros.categorias.has(producto.categoria)) {
        return false;
      }
      
      return true;
    });
    
    this.filtered.sort((a, b) => b.fechaAgregada - a.fechaAgregada);
    this.currentBatch = 1;
  }

  getCurrentBatch() {
    const end = this.currentBatch * this.batchSize;
    return this.filtered.slice(0, end);
  }

  loadMore() {
    if (this.hasMore()) {
      this.currentBatch++;
    }
  }

  hasMore() {
    return this.getCurrentBatch().length < this.filtered.length;
  }

  getFilterCounts() {
    return {
      tallas: this.getUniqueCounts('tallas'),
      colores: this.getUniqueCounts('colores'),
      tipos: this.getUniqueCounts('tipo'),
      categorias: this.getUniqueCounts('categoria')
    };
  }

  getUniqueCounts(campo) {
    const counts = new Map();
    this.productos.forEach(p => {
      const valores = Array.isArray(p[campo]) ? p[campo] : [p[campo]];
      valores.forEach(valor => {
        counts.set(valor, (counts.get(valor) || 0) + 1);
      });
    });
    return counts;
  }

  clearFilters() {
    this.filtros.tallas.clear();
    this.filtros.colores.clear();
    this.filtros.tipos.clear();
    this.filtros.categorias.clear();
    this.filtered = [...this.productos];
    this.filtered.sort((a, b) => b.fechaAgregada - a.fechaAgregada);
    this.currentBatch = 1;
  }
}

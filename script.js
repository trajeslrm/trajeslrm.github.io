// script.js
document.addEventListener("DOMContentLoaded", function () {
  const catalogo = document.getElementById("catalogo");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = document.querySelector(".close");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  let currentProductIndex = 0;
  let currentImageIndex = 0;
  let productos = [];

  // URL corregida para Google Sheets
  const SHEET_ID = "1x4Ovcl84SGK4bx7OTxbv5QRq9aJJ6VHaLcsk8wl0jJg";
  const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

  // Cargar productos desde Google Sheets
  fetch(URL)
    .then(response => response.text())
    .then(data => {
      const rows = data.split("\n").slice(1); // Saltar encabezado
      productos = rows
        .map(row => {
          const cells = row.split(",").map(cell => {
            // Limpiar las celdas y quitar comillas
            let clean = cell.replace(/^"|"$/g, "").trim();
            // Si empieza con '="' y termina con '"', limpiar
            if (clean.startsWith('="') && clean.endsWith('"')) {
              clean = clean.slice(2, -1);
            }
            return clean;
          });

          // Solo procesar filas que tengan datos válidos
          if (cells.length >= 10 && cells[0] && cells[1] && cells[9] === "Sí") {
            return {
              id: cells[0],
              nombre: cells[1],
              descripcion: cells[2],
              precio: cells[3],
              tallas: cells[4],
              categoria: cells[5],
              img1: cells[6],
              img2: cells[7],
              img3: cells[8],
              whatsapp_link: cells[9]
            };
          }
          return null;
        })
        .filter(producto => producto !== null);

      mostrarCatalogo();
    })
    .catch(error => {
      console.error("Error cargando el catálogo:", error);
      catalogo.innerHTML = "<p>Error cargando el catálogo. Por favor intenta más tarde.</p>";
    });

  function mostrarCatalogo() {
    if (productos.length === 0) {
      catalogo.innerHTML = "<p>No hay productos disponibles en este momento.</p>";
      return;
    }

    catalogo.innerHTML = productos
      .map(
        (producto, index) => `
        <div class="producto">
          <div class="carousel">
            ${[producto.img1, producto.img2, producto.img3]
              .filter(img => img && img.trim() !== "")
              .map(
                (img, imgIndex) => `
                <img 
                  src="${img}" 
                  alt="${producto.nombre}" 
                  onclick="abrirModal(${index}, ${imgIndex})"
                  onerror="this.style.display='none'"
                />
              `
              )
              .join("")}
          </div>
          <div class="info">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <p><strong>${producto.precio}</strong></p>
            <p><strong>Tallas:</strong> ${producto.tallas}</p>
            <p><strong>Categoría:</strong> ${producto.categoria}</p>
            <a href="${producto.whatsapp_link}" class="whatsapp-btn" target="_blank">
              💬 Alquilar por WhatsApp
            </a>
          </div>
        </div>
      `
      )
      .join("");
  }

  // Funciones del modal (globales para que funcionen con onclick)
  window.abrirModal = function (productIndex, imgIndex) {
    currentProductIndex = productIndex;
    currentImageIndex = imgIndex;
    const producto = productos[productIndex];
    const imagenes = [producto.img1, producto.img2, producto.img3].filter(img => img && img.trim() !== "");
    
    if (imagenes.length > 0) {
      modalImg.src = imagenes[imgIndex];
      modal.style.display = "block";
    }
  };

  function cambiarImagen(direction) {
    const producto = productos[currentProductIndex];
    const imagenes = [producto.img1, producto.img2, producto.img3].filter(img => img && img.trim() !== "");
    
    currentImageIndex += direction;
    
    if (currentImageIndex >= imagenes.length) {
      currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
      currentImageIndex = imagenes.length - 1;
    }
    
    modalImg.src = imagenes[currentImageIndex];
  }

  // Event listeners
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  prevBtn.addEventListener("click", () => cambiarImagen(-1));
  nextBtn.addEventListener("click", () => cambiarImagen(1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "block") {
      if (e.key === "ArrowLeft") cambiarImagen(-1);
      if (e.key === "ArrowRight") cambiarImagen(1);
      if (e.key === "Escape") modal.style.display = "none";
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = document.querySelector(".close");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  let currentImages = [];
  let currentImageIndex = 0;

  // Abrir modal al hacer clic en cualquier imagen
  document.querySelectorAll('.carousel img').forEach(img => {
    img.addEventListener('click', function() {
      const producto = this.closest('.producto');
      const imagenes = Array.from(producto.querySelectorAll('.carousel img'));
      currentImages = imagenes.map(img => img.src);
      currentImageIndex = imagenes.indexOf(this);
      
      modalImg.src = this.src;
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    });
  });

  // Navegación entre imágenes
  function cambiarImagen(direction) {
    if (currentImages.length <= 1) return;
    
    currentImageIndex += direction;
    
    if (currentImageIndex >= currentImages.length) {
      currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
      currentImageIndex = currentImages.length - 1;
    }
    
    modalImg.src = currentImages[currentImageIndex];
  }

  // Cerrar modal
  function cerrarModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  // Event listeners
  closeBtn.addEventListener("click", cerrarModal);
  prevBtn.addEventListener("click", () => cambiarImagen(-1));
  nextBtn.addEventListener("click", () => cambiarImagen(1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "block") {
      if (e.key === "ArrowLeft") cambiarImagen(-1);
      if (e.key === "ArrowRight") cambiarImagen(1);
      if (e.key === "Escape") cerrarModal();
    }
  });
});
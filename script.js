document.addEventListener("DOMContentLoaded", function () {
  // Inicializar carruseles de productos
  document.querySelectorAll('.carousel-container').forEach(container => {
    const carousel = container.querySelector('.carousel');
    const images = carousel.querySelectorAll('img');
    const indicators = container.querySelectorAll('.carousel-indicator');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');
    
    let currentIndex = 0;
    const totalImages = images.length;
    
    function updateCarousel() {
      carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
      });
    }
    
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalImages) % totalImages;
      updateCarousel();
    });
    
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalImages;
      updateCarousel();
    });
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
      });
    });
    
    let autoSlide = setInterval(() => {
      currentIndex = (currentIndex + 1) % totalImages;
      updateCarousel();
    }, 5000);
    
    container.addEventListener('mouseenter', () => {
      clearInterval(autoSlide);
    });
    
    container.addEventListener('mouseleave', () => {
      autoSlide = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalImages;
        updateCarousel();
      }, 5000);
    });
  });

  // Modal
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = document.querySelector(".modal-close");
  const prevBtn = document.querySelector(".modal .prev");
  const nextBtn = document.querySelector(".modal .next");
  const imageCounter = document.getElementById("image-counter");

  let currentImages = [];
  let currentImageIndex = 0;

  // Abrir modal al hacer clic en cualquier imagen
  document.querySelectorAll('.carousel img').forEach(img => {
    img.addEventListener('click', function() {
      const producto = this.closest('.producto');
      const carousel = producto.querySelector('.carousel');
      const imagenes = Array.from(carousel.querySelectorAll('img')).map(img => img.src);
      currentImages = imagenes;
      const carouselImages = Array.from(carousel.querySelectorAll('img'));
      currentImageIndex = carouselImages.indexOf(this);

      modalImg.src = this.src;
      updateImageCounter();
      modal.style.display = "flex";
      void modal.offsetWidth;
      modal.classList.add('active');
      document.body.style.overflow = "hidden";
    });
  });

  function cambiarImagen(direction) {
    if (currentImages.length <= 1) return;
    currentImageIndex += direction;
    if (currentImageIndex >= currentImages.length) {
      currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
      currentImageIndex = currentImages.length - 1;
    }
    modalImg.src = currentImages[currentImageIndex];
    updateImageCounter();
  }

  function updateImageCounter() {
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
  }

  function cerrarModal() {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
    document.body.style.overflow = "auto";
  }

  closeBtn.addEventListener("click", cerrarModal);
  prevBtn.addEventListener("click", () => cambiarImagen(-1));
  nextBtn.addEventListener("click", () => cambiarImagen(1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains('active')) {
      if (e.key === "ArrowLeft") cambiarImagen(-1);
      if (e.key === "ArrowRight") cambiarImagen(1);
      if (e.key === "Escape") cerrarModal();
    }
  });

  // Efecto de aparición gradual para productos
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${entry.target.dataset.delay || 0}ms`;
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.producto').forEach((producto, index) => {
    producto.dataset.delay = index * 100;
    observer.observe(producto);
  });
});

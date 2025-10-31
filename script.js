// Leer CSV desde Google Sheets
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return parseCSV(text);
  } catch (e) {
    console.error("Error al cargar el catálogo:", e);
    document.getElementById("catalogo").innerHTML = "<p>No se pudo cargar el catálogo.</p>";
    return [];
  }
}

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, j) => {
        row[header] = values[j].replace(/^"(.*)"$/, '$1');
      });
      rows.push(row);
    }
  }
  return rows;
}

// Renderizar productos
function renderCatalogo(productos) {
  const container = document.getElementById("catalogo");
  container.innerHTML = '';
  productos.forEach(p => {
    if (p.disponible !== 'Sí') return;
    const imgs = [p.img1, p.img2, p.img3].filter(img => img && img.trim() !== '');
    if (imgs.length === 0) return;

    let currentIndex = 0;
    const carouselId = `carousel-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;

    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <div class="carousel" id="${carouselId}">
        <img src="${imgs[0]}" alt="${p.nombre}">
      </div>
      <div class="info">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <p><strong>${p.precio}</strong></p>
        <p>Tallas: ${p.tallas}</p>
        <a href="${p.whatsapp_link}" class="whatsapp-btn" target="_blank">Reservar por WhatsApp</a>
      </div>
    `;
    container.appendChild(card);

    // Carrusel automático
    if (imgs.length > 1) {
      setInterval(() => {
        currentIndex = (currentIndex + 1) % imgs.length;
        document.querySelector(`#${carouselId} img`).src = imgs[currentIndex];
      }, 3000);
    }

    // Abrir modal al hacer clic
    document.querySelector(`#${carouselId} img`).addEventListener('click', () => openModal(imgs, 0));
  });
}

// Modal
let currentImages = [];
let currentIdx = 0;

function openModal(images, idx) {
  currentImages = images;
  currentIdx = idx;
  document.getElementById('modal-img').src = images[idx];
  document.getElementById('modal').style.display = 'block';
}

document.querySelector('.close').onclick = () => {
  document.getElementById('modal').style.display = 'none';
};

document.getElementById('prev-btn').onclick = () => {
  currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
  document.getElementById('modal-img').src = currentImages[currentIdx];
};

document.getElementById('next-btn').onclick = () => {
  currentIdx = (currentIdx + 1) % currentImages.length;
  document.getElementById('modal-img').src = currentImages[currentIdx];
};

window.onclick = (e) => {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
};

// Iniciar
document.addEventListener('DOMContentLoaded', () => {
  const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv`;
  fetchCSV(url).then(renderCatalogo);
});
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principales
    const productsContainer = document.getElementById('products-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const generateLinkBtn = document.getElementById('generate-link-btn');
    const printBtn = document.getElementById('print-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const exchangeRateInput = document.getElementById('exchange-rate');
    const linkSection = document.getElementById('link-section');
    const shareLinkInput = document.getElementById('share-link');
    const lineTotalsDiv = document.getElementById('line-totals'); // Ya no se usará
    
    // Datos iniciales
    let products = [];
    let exchangeRate = 7.25;
    
    // Fecha actual
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Cargar datos desde URL si existen
    loadFromURL();
    
    // Event Listeners
    addProductBtn.addEventListener('click', addNewProduct);
    generateLinkBtn.addEventListener('click', generateShareLink);
    printBtn.addEventListener('click', () => window.print());
    resetBtn.addEventListener('click', resetAll);
    copyLinkBtn.addEventListener('click', copyLinkToClipboard);
    exchangeRateInput.addEventListener('input', updateExchangeRate);
    
    // Event listeners para campos de tarifas
    document.getElementById('agent-fee-cny').addEventListener('input', updateAllTotals);
    document.getElementById('other-costs-cny').addEventListener('input', updateAllTotals);
    
    // Funciones principales
    
    function addNewProduct() {
        const productId = Date.now(); // ID único
        
        // Remover mensaje de vacío si existe
        const emptyMessage = productsContainer.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        const productRow = document.createElement('div');
        productRow.className = 'product-row-grid';
        productRow.id = `product-${productId}`;
        productRow.innerHTML = `
            <!-- Enlace (40%) -->
            <div>
                <input type="url" class="product-link product-link-input" 
                       placeholder="https://detail.1688.com/..."
                       title="Pega aquí el enlace completo del producto en 1688">
            </div>
            
            <!-- Nombre (25%) -->
            <div>
                <input type="text" class="product-name compact-input" 
                       placeholder="Nombre del producto"
                       title="Nombre completo del producto"
                       required>
            </div>
            
            <!-- Variante (15%) -->
            <div>
                <input type="text" class="product-variant compact-input" 
                       placeholder="Color/Talla/Modelo"
                       title="Variante o especificación específica">
            </div>
            
            <!-- Cantidad (8%) -->
            <div>
                <input type="number" class="product-quantity compact-input-narrow" 
                       value="1" min="1" step="1"
                       title="Cantidad a comprar">
            </div>
            
            <!-- Precio (7%) -->
            <div>
                <input type="number" class="product-price compact-input-price" 
                       value="0" min="0" step="0.01"
                       placeholder="0.00"
                       title="Precio unitario en CNY (yuanes)">
            </div>
            
            <!-- Eliminar (5%) -->
            <div>
                <button type="button" class="btn-remove-compact" 
                        onclick="removeProduct(${productId})"
                        title="Eliminar este producto">
                    ✕
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productRow);
        
        // Agregar event listeners a los inputs nuevos
        const quantityInput = productRow.querySelector('.product-quantity');
        const priceInput = productRow.querySelector('.product-price');
        
        quantityInput.addEventListener('input', () => updateProductTotals(productId));
        priceInput.addEventListener('input', () => updateProductTotals(productId));
        
        // También escuchar cambios en nombre, enlace y variante
        productRow.querySelector('.product-link').addEventListener('input', () => updateProductData(productId));
        productRow.querySelector('.product-name').addEventListener('input', () => updateProductData(productId));
        productRow.querySelector('.product-variant').addEventListener('input', () => updateProductData(productId));
        
        // Guardar en array de productos
        products.push({
            id: productId,
            link: '',
            name: '',
            variant: '',
            quantity: 1,
            price: 0,
            totalCNY: 0,
            totalUSD: 0
        });
        
        updateAllTotals();
        
        // Enfocar el campo de enlace automáticamente (para pegar rápido)
        setTimeout(() => {
            productRow.querySelector('.product-link').focus();
        }, 100);
    }
    
    function updateProductData(productId) {
        const productRow = document.getElementById(`product-${productId}`);
        if (!productRow) return;
        
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products[productIndex].link = productRow.querySelector('.product-link').value;
            products[productIndex].name = productRow.querySelector('.product-name').value;
            products[productIndex].variant = productRow.querySelector('.product-variant').value;
        }
    }
    
    function updateProductTotals(productId) {
        const productRow = document.getElementById(`product-${productId}`);
        if (!productRow) return;
        
        const quantity = parseFloat(productRow.querySelector('.product-quantity').value) || 0;
        const price = parseFloat(productRow.querySelector('.product-price').value) || 0;
        
        const totalCNY = quantity * price;
        const totalUSD = totalCNY / exchangeRate;
        
        // Actualizar en array
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products[productIndex].quantity = quantity;
            products[productIndex].price = price;
            products[productIndex].totalCNY = totalCNY;
            products[productIndex].totalUSD = totalUSD;
        }
        
        updateAllTotals();
    }
    
    function updateAllTotals() {
        // Calcular subtotal productos
        let subtotalCNY = 0;
        
        products.forEach((product) => {
            subtotalCNY += product.totalCNY;
        });
        
        const subtotalUSD = subtotalCNY / exchangeRate;
        
        // Actualizar subtotales
        document.getElementById('subtotal-cny').textContent = subtotalCNY.toFixed(2);
        document.getElementById('subtotal-usd').textContent = subtotalUSD.toFixed(2);
        
        // Calcular comisión y otros gastos
        const agentFeeCNY = parseFloat(document.getElementById('agent-fee-cny').value) || 0;
        const otherCostsCNY = parseFloat(document.getElementById('other-costs-cny').value) || 0;
        
        const agentFeeUSD = agentFeeCNY / exchangeRate;
        const otherCostsUSD = otherCostsCNY / exchangeRate;
        
        document.getElementById('agent-fee-usd').textContent = agentFeeUSD.toFixed(2);
        document.getElementById('other-costs-usd').textContent = otherCostsUSD.toFixed(2);
        
        // Calcular totales finales
        const grandTotalCNY = subtotalCNY + agentFeeCNY + otherCostsCNY;
        const grandTotalUSD = grandTotalCNY / exchangeRate;
        
        document.getElementById('grand-total-cny').textContent = grandTotalCNY.toFixed(2);
        document.getElementById('grand-total-usd').textContent = grandTotalUSD.toFixed(2);
    }
    
    function updateExchangeRate() {
        exchangeRate = parseFloat(exchangeRateInput.value) || 7.25;
        updateAllTotals();
    }
    
    function generateShareLink() {
        // Recolectar todos los datos
        const data = {
            products: products.map(p => ({
                link: p.link,
                name: p.name,
                variant: p.variant,
                quantity: p.quantity,
                price: p.price
            })),
            exchangeRate: exchangeRate,
            agentFee: parseFloat(document.getElementById('agent-fee-cny').value) || 0,
            otherCosts: parseFloat(document.getElementById('other-costs-cny').value) || 0,
            timestamp: new Date().toISOString(),
            version: '1.2'
        };
        
        // Codificar datos en Base64
        const dataString = JSON.stringify(data);
        const encodedData = btoa(encodeURIComponent(dataString));
        
        // Generar URL
        const baseURL = window.location.origin + window.location.pathname;
        const shareURL = `${baseURL}#${encodedData}`;
        
        // Mostrar enlace
        shareLinkInput.value = shareURL;
        linkSection.style.display = 'block';
        
        // Hacer scroll al enlace
        linkSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function copyLinkToClipboard() {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(shareLinkInput.value)
            .then(() => {
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = '✅ COPIADO!';
                copyLinkBtn.style.background = '#27ae60';
                
                setTimeout(() => {
                    copyLinkBtn.textContent = originalText;
                    copyLinkBtn.style.background = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Error al copiar: ', err);
                alert('Error al copiar el enlace. Cópialo manualmente.');
            });
    }
    
    function loadFromURL() {
        const hash = window.location.hash.substring(1);
        if (!hash) return;
        
        try {
            // Decodificar datos
            const decodedString = decodeURIComponent(atob(hash));
            const data = JSON.parse(decodedString);
            
            // Cargar tasa de cambio
            exchangeRateInput.value = data.exchangeRate || 7.25;
            exchangeRate = data.exchangeRate || 7.25;
            
            // Cargar productos
            if (data.products && data.products.length > 0) {
                productsContainer.innerHTML = '';
                products = [];
                
                data.products.forEach((productData, index) => {
                    const productId = Date.now() + index;
                    
                    const productRow = document.createElement('div');
                    productRow.className = 'product-row-grid';
                    productRow.id = `product-${productId}`;
                    productRow.innerHTML = `
                        <div>
                            <input type="url" class="product-link product-link-input" 
                                   value="${productData.link || ''}" 
                                   placeholder="https://detail.1688.com/...">
                        </div>
                        <div>
                            <input type="text" class="product-name compact-input" 
                                   value="${productData.name || ''}" 
                                   placeholder="Nombre del producto" required>
                        </div>
                        <div>
                            <input type="text" class="product-variant compact-input" 
                                   value="${productData.variant || ''}" 
                                   placeholder="Color/Talla/Modelo">
                        </div>
                        <div>
                            <input type="number" class="product-quantity compact-input-narrow" 
                                   value="${productData.quantity || 1}" min="1" step="1">
                        </div>
                        <div>
                            <input type="number" class="product-price compact-input-price" 
                                   value="${productData.price || 0}" min="0" step="0.01"
                                   placeholder="0.00">
                        </div>
                        <div>
                            <button type="button" class="btn-remove-compact" 
                                    onclick="removeProduct(${productId})">
                                ✕
                            </button>
                        </div>
                    `;
                    
                    productsContainer.appendChild(productRow);
                    
                    // Guardar en array
                    const totalCNY = (productData.quantity || 0) * (productData.price || 0);
                    const totalUSD = totalCNY / exchangeRate;
                    
                    products.push({
                        id: productId,
                        link: productData.link || '',
                        name: productData.name || '',
                        variant: productData.variant || '',
                        quantity: productData.quantity || 1,
                        price: productData.price || 0,
                        totalCNY: totalCNY,
                        totalUSD: totalUSD
                    });
                    
                    // Event listeners
                    const quantityInput = productRow.querySelector('.product-quantity');
                    const priceInput = productRow.querySelector('.product-price');
                    
                    quantityInput.addEventListener('input', () => updateProductTotals(productId));
                    priceInput.addEventListener('input', () => updateProductTotals(productId));
                    
                    productRow.querySelector('.product-link').addEventListener('input', () => updateProductData(productId));
                    productRow.querySelector('.product-name').addEventListener('input', () => updateProductData(productId));
                    productRow.querySelector('.product-variant').addEventListener('input', () => updateProductData(productId));
                });
                
                // Cargar tarifas del agente
                document.getElementById('agent-fee-cny').value = data.agentFee || 0;
                document.getElementById('other-costs-cny').value = data.otherCosts || 0;
                
                // Actualizar todos los cálculos
                updateAllTotals();
                
                // Mostrar mensaje
                if (products.length > 0) {
                    console.log(`Cotización cargada: ${products.length} productos`);
                }
            }
        } catch (error) {
            console.error('Error al cargar datos de URL:', error);
            alert('❌ No se pudo cargar la cotización del enlace. Comienza una nueva.');
        }
    }
    
    function resetAll() {
        if (confirm('¿Estás seguro de limpiar toda la cotización? Se perderán todos los datos.')) {
            productsContainer.innerHTML = '<div class="product-row-grid empty-message" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #7f8c8d; font-style: italic;">No hay productos agregados. Haz clic en "AGREGAR PRODUCTO" para comenzar.</div>';
            products = [];
            
            // Resetear otros campos
            exchangeRateInput.value = 7.25;
            exchangeRate = 7.25;
            document.getElementById('agent-fee-cny').value = 0;
            document.getElementById('other-costs-cny').value = 0;
            
            // Ocultar sección de enlace
            linkSection.style.display = 'none';
            
            // Actualizar totales
            updateAllTotals();
            
            // Limpiar URL hash
            window.location.hash = '';
        }
    }
    
    // Hacer removeProduct accesible globalmente
    window.removeProduct = function(productId) {
        if (confirm('¿Eliminar este producto?')) {
            const productRow = document.getElementById(`product-${productId}`);
            if (productRow) {
                productRow.remove();
            }
            
            // Eliminar del array
            products = products.filter(p => p.id !== productId);
            
            // Si no hay productos, mostrar mensaje
            if (products.length === 0) {
                productsContainer.innerHTML = '<div class="product-row-grid empty-message" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #7f8c8d; font-style: italic;">No hay productos agregados. Haz clic en "AGREGAR PRODUCTO" para comenzar.</div>';
            }
            
            updateAllTotals();
        }
    };
    
    // Auto-guardar en localStorage cada 5 segundos
    setInterval(() => {
        if (products.length > 0) {
            const data = {
                products: products,
                exchangeRate: exchangeRate,
                agentFee: parseFloat(document.getElementById('agent-fee-cny').value) || 0,
                otherCosts: parseFloat(document.getElementById('other-costs-cny').value) || 0
            };
            localStorage.setItem('cotizacion_auto_guardada', JSON.stringify(data));
        }
    }, 5000);
});
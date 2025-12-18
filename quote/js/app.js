document.addEventListener('DOMContentLoaded', function() {
    // Elementos principales
    const productsContainer = document.getElementById('products-container');
    const agentFeesContainer = document.getElementById('agent-fees-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const addFeeBtn = document.getElementById('add-fee-btn');
    const removeFeeBtn = document.getElementById('remove-fee-btn');
    const generateLinkBtn = document.getElementById('generate-link-btn');
    const printBtn = document.getElementById('print-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const exchangeRateInput = document.getElementById('exchange-rate');
    const linkSection = document.getElementById('link-section');
    const shareLinkInput = document.getElementById('share-link');
    
    // Datos
    let products = [];
    let agentFees = [];
    let exchangeRate = 7.25;
    
    // Fecha actual
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Inicializar
    initialize();
    
    // Event Listeners
    addProductBtn.addEventListener('click', addNewProduct);
    addFeeBtn.addEventListener('click', addNewFeeLine);
    removeFeeBtn.addEventListener('click', removeLastFeeLine);
    generateLinkBtn.addEventListener('click', generateShareLink);
    printBtn.addEventListener('click', () => window.print());
    resetBtn.addEventListener('click', resetAll);
    copyLinkBtn.addEventListener('click', copyLinkToClipboard);
    exchangeRateInput.addEventListener('input', updateExchangeRate);
    
    function initialize() {
        // Limpiar tarifas iniciales del HTML
        agentFeesContainer.innerHTML = '';
        agentFees = [];
        
        // Cargar datos desde URL si existen
        loadFromURL();
        
        // Si no hay datos en URL, crear primera línea de tarifa DINÁMICA
        if (agentFees.length === 0) {
            addNewFeeLine(true); // true = inicialización
        }
    }
    
    function addNewProduct() {
        const productId = Date.now();
        
        // Remover mensaje de vacío
        const emptyMessage = productsContainer.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        const productRow = document.createElement('div');
        productRow.className = 'product-row-grid';
        productRow.id = `product-${productId}`;
        productRow.innerHTML = `
            <!-- Enlace (30%) -->
            <div>
                <textarea class="product-link link-cell-expand clear-on-focus" 
                       placeholder="https://detail.1688.com/offer/..."
                       title="Paste full 1688 product link"
                       rows="1"></textarea>
            </div>
            
            <!-- Nombre (20%) -->
            <div>
                <textarea class="product-name auto-expand-cell clear-on-focus" 
                       placeholder="Complete product name"
                       title="Product name (copy from 1688)"
                       rows="1"
                       required></textarea>
            </div>
            
            <!-- Variante (10%) -->
            <div>
                <input type="text" class="product-variant auto-expand-cell clear-on-focus" 
                       placeholder="Color/Size/Model"
                       title="Specific variant">
            </div>
            
            <!-- Cantidad (6%) - VACÍO -->
            <div>
                <input type="number" class="product-quantity empty-number-cell clear-on-focus" 
                       placeholder="Qty"
                       title="Quantity to purchase"
                       min="1" step="1">
            </div>
            
            <!-- Precio (7%) - VACÍO y editable por agente -->
            <div>
                <input type="number" class="product-price empty-price-cell clear-on-focus" 
                       placeholder="Unit price"
                       title="Unit price in CNY (Agent may adjust)"
                       min="0" step="0.01">
            </div>
            
            <!-- Total por producto en CNY (8%) - CALCULADO -->
            <div>
                <div class="product-total-cny" id="product-total-cny-${productId}">
                    ¥0.00
                </div>
            </div>
            
            <!-- Total por producto en USD (8%) - CALCULADO -->
            <div>
                <div class="product-total-usd" id="product-total-usd-${productId}">
                    $0.00
                </div>
            </div>
            
            <!-- Eliminar (7%) -->
            <div>
                <button type="button" class="btn-remove-compact" 
                        onclick="removeProduct(${productId})"
                        title="Delete this product">
                    ✕
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productRow);
        
        // Event listeners para el nuevo producto
        setupProductEventListeners(productId);
        
        // Guardar en array
        products.push({
            id: productId,
            link: '',
            name: '',
            variant: '',
            quantity: 0,
            price: 0,
            totalCNY: 0,
            totalUSD: 0
        });
        
        updateAllTotals();
        
        // Auto-ajustar altura de textareas
        autoResizeTextareas(productRow);
        
        // Enfocar en campo de enlace
        setTimeout(() => {
            productRow.querySelector('.product-link').focus();
        }, 100);
    }
    
    function setupProductEventListeners(productId) {
        const productRow = document.getElementById(`product-${productId}`);
        if (!productRow) return;
        
        // Campos que actualizan cálculos
        const quantityInput = productRow.querySelector('.product-quantity');
        const priceInput = productRow.querySelector('.product-price');
        
        quantityInput.addEventListener('input', () => updateProductTotal(productId));
        priceInput.addEventListener('input', () => updateProductTotal(productId));
        
        // Campos de texto
        const linkInput = productRow.querySelector('.product-link');
        const nameInput = productRow.querySelector('.product-name');
        const variantInput = productRow.querySelector('.product-variant');
        
        linkInput.addEventListener('input', () => updateProductData(productId));
        nameInput.addEventListener('input', () => updateProductData(productId));
        variantInput.addEventListener('input', () => updateProductData(productId));
        
        // Clear on focus para campos vacíos
        const clearInputs = productRow.querySelectorAll('.clear-on-focus');
        clearInputs.forEach(input => {
            input.addEventListener('focus', function() {
                if (this.value === '0' || this.value === '0.00') {
                    this.value = '';
                }
            });
            
            input.addEventListener('blur', function() {
                if (this.value === '' && this.classList.contains('product-quantity')) {
                    this.value = '';
                }
                if (this.value === '' && this.classList.contains('product-price')) {
                    this.value = '';
                }
            });
        });
        
        // Auto-resize para textareas
        const textareas = productRow.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', autoResizeTextarea);
        });
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
    
    function updateProductTotal(productId) {
        const productRow = document.getElementById(`product-${productId}`);
        if (!productRow) return;
        
        const quantity = parseFloat(productRow.querySelector('.product-quantity').value) || 0;
        const price = parseFloat(productRow.querySelector('.product-price').value) || 0;
        
        const totalCNY = quantity * price;
        const totalUSD = totalCNY / exchangeRate;
        
        // Actualizar display del total del producto
        const totalCNYElement = document.getElementById(`product-total-cny-${productId}`);
        const totalUSDElement = document.getElementById(`product-total-usd-${productId}`);
        
        if (totalCNYElement) {
            totalCNYElement.textContent = `¥${totalCNY.toFixed(2)}`;
        }
        if (totalUSDElement) {
            totalUSDElement.textContent = `$${totalUSD.toFixed(2)}`;
        }
        
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
    
    function addNewFeeLine(isInitial = false) {
        const feeId = Date.now() + (isInitial ? 0 : Math.random() * 1000);
        
        const feeRow = document.createElement('div');
        feeRow.className = 'agent-fee-row';
        feeRow.id = `fee-${feeId}`;
        feeRow.innerHTML = `
            <div>
                <input type="text" class="auto-expand-cell agent-editable fee-description clear-on-focus" 
                       placeholder="Fee description (commission, shipping, etc.)" 
                       style="width: 100%;">
            </div>
            <div>
                <input type="number" class="empty-price-cell agent-editable fee-amount clear-on-focus" 
                       placeholder="0.00"
                       style="width: 100%; text-align: right;"
                       min="0" step="0.01">
            </div>
            <div style="font-size: 11px; text-align: right; padding-right: 5px;">
                <span class="fee-usd" id="fee-usd-${feeId}">$0.00</span>
            </div>
        `;
        
        // SIEMPRE agregar al DOM
        agentFeesContainer.appendChild(feeRow);
        
        // Configurar event listeners inmediatamente
        const descriptionInput = feeRow.querySelector('.fee-description');
        const amountInput = feeRow.querySelector('.fee-amount');
        
        descriptionInput.addEventListener('input', () => updateFeeData(feeId));
        amountInput.addEventListener('input', () => updateFeeTotal(feeId));
        
        // Clear on focus
        amountInput.addEventListener('focus', function() {
            if (this.value === '0' || this.value === '0.00') {
                this.value = '';
            }
        });
        
        // Guardar en array
        agentFees.push({
            id: feeId,
            description: '',
            amountCNY: 0,
            amountUSD: 0
        });
        
        updateAllTotals();
    }
    
    function removeLastFeeLine() {
        if (agentFees.length > 1) { // No eliminar la primera
            const lastFee = agentFees.pop();
            const feeElement = document.getElementById(`fee-${lastFee.id}`);
            if (feeElement) {
                feeElement.remove();
            }
            updateAllTotals();
        } else {
            alert('At least one fee line must remain.');
        }
    }
    
    function updateFeeData(feeId) {
        const feeRow = document.getElementById(`fee-${feeId}`);
        if (!feeRow) return;
        
        const feeIndex = agentFees.findIndex(f => f.id === feeId);
        if (feeIndex !== -1) {
            agentFees[feeIndex].description = feeRow.querySelector('.fee-description').value;
        }
    }
    
    function updateFeeTotal(feeId) {
        const feeRow = document.getElementById(`fee-${feeId}`);
        if (!feeRow) return;
        
        const amountCNY = parseFloat(feeRow.querySelector('.fee-amount').value) || 0;
        const amountUSD = amountCNY / exchangeRate;
        
        // Actualizar display USD
        const usdElement = document.getElementById(`fee-usd-${feeId}`);
        if (usdElement) {
            usdElement.textContent = `$${amountUSD.toFixed(2)}`;
        }
        
        // Actualizar en array
        const feeIndex = agentFees.findIndex(f => f.id === feeId);
        if (feeIndex !== -1) {
            agentFees[feeIndex].amountCNY = amountCNY;
            agentFees[feeIndex].amountUSD = amountUSD;
        }
        
        updateAllTotals();
    }
    
    function updateAllTotals() {
        // Calcular subtotal productos
        let subtotalCNY = 0;
        let subtotalUSD = 0;
        
        products.forEach(product => {
            subtotalCNY += product.totalCNY;
            subtotalUSD += product.totalUSD;
        });
        
        // Calcular total tarifas agente
        let agentFeesTotalCNY = 0;
        let agentFeesTotalUSD = 0;
        
        agentFees.forEach(fee => {
            agentFeesTotalCNY += fee.amountCNY;
            agentFeesTotalUSD += fee.amountUSD;
        });
        
        // Calcular totales finales
        const grandTotalCNY = subtotalCNY + agentFeesTotalCNY;
        const grandTotalUSD = grandTotalCNY / exchangeRate;
        
        // Actualizar displays
        document.getElementById('subtotal-cny').textContent = subtotalCNY.toFixed(2);
        document.getElementById('subtotal-usd').textContent = (subtotalCNY / exchangeRate).toFixed(2);
        document.getElementById('agent-fees-total-cny').textContent = agentFeesTotalCNY.toFixed(2);
        document.getElementById('agent-fees-total-usd').textContent = agentFeesTotalUSD.toFixed(2);
        document.getElementById('grand-total-cny').textContent = grandTotalCNY.toFixed(2);
        document.getElementById('grand-total-usd').textContent = grandTotalUSD.toFixed(2);
    }
    
    function updateExchangeRate() {
        exchangeRate = parseFloat(exchangeRateInput.value) || 7.25;
        
        // Recalcular todos los totales en USD
        updateAllTotals();
        
        // Actualizar totales USD de productos
        products.forEach(product => {
            const totalCNYElement = document.getElementById(`product-total-cny-${product.id}`);
            const totalUSDElement = document.getElementById(`product-total-usd-${product.id}`);
            
            if (totalCNYElement && totalUSDElement) {
                const totalUSD = product.totalCNY / exchangeRate;
                product.totalUSD = totalUSD;
                totalUSDElement.textContent = `$${totalUSD.toFixed(2)}`;
            }
        });
        
        // Actualizar tarifas en USD
        agentFees.forEach(fee => {
            const usdElement = document.getElementById(`fee-usd-${fee.id}`);
            if (usdElement) {
                const amountUSD = fee.amountCNY / exchangeRate;
                usdElement.textContent = `$${amountUSD.toFixed(2)}`;
                fee.amountUSD = amountUSD;
            }
        });
    }
    
    function generateShareLink() {
        const data = {
            products: products.map(p => ({
                link: p.link,
                name: p.name,
                variant: p.variant,
                quantity: p.quantity,
                price: p.price
            })),
            agentFees: agentFees.map(f => ({
                description: f.description,
                amountCNY: f.amountCNY
            })),
            exchangeRate: exchangeRate,
            timestamp: new Date().toISOString(),
            version: '1.4'
        };
        
        const dataString = JSON.stringify(data);
        // CORRECCIÓN: Solo Base64, sin encodeURIComponent doble
        const encodedData = btoa(unescape(encodeURIComponent(dataString)));
        
        const baseURL = window.location.origin + window.location.pathname;
        const shareURL = `${baseURL}#${encodedData}`;
        
        shareLinkInput.value = shareURL;
        linkSection.style.display = 'block';
        linkSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function copyLinkToClipboard() {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(shareLinkInput.value)
            .then(() => {
                copyLinkBtn.textContent = '✅ COPIED!';
                copyLinkBtn.style.background = '#27ae60';
                
                setTimeout(() => {
                    copyLinkBtn.textContent = '📋 COPY LINK';
                    copyLinkBtn.style.background = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Error copying:', err);
                alert('Error copying link. Please copy manually.');
            });
    }
    
    function loadFromURL() {
        const hash = window.location.hash.substring(1);
        if (!hash) return;
        
        try {
            // CORRECCIÓN: decode apropiado para Base64 puro
            const decodedString = decodeURIComponent(escape(atob(hash)));
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
                            <textarea class="product-link link-cell-expand clear-on-focus" 
                                   rows="1">${productData.link || ''}</textarea>
                        </div>
                        <div>
                            <textarea class="product-name auto-expand-cell clear-on-focus" 
                                   rows="1" required>${productData.name || ''}</textarea>
                        </div>
                        <div>
                            <input type="text" class="product-variant auto-expand-cell clear-on-focus" 
                                   value="${productData.variant || ''}" 
                                   placeholder="Color/Size/Model">
                        </div>
                        <div>
                            <input type="number" class="product-quantity empty-number-cell clear-on-focus" 
                                   value="${productData.quantity || ''}" 
                                   placeholder="Qty" min="1" step="1">
                        </div>
                        <div>
                            <input type="number" class="product-price empty-price-cell clear-on-focus" 
                                   value="${productData.price || ''}" 
                                   placeholder="Unit price" min="0" step="0.01">
                        </div>
                        <div>
                            <div class="product-total-cny" id="product-total-cny-${productId}">
                                ¥0.00
                            </div>
                        </div>
                        <div>
                            <div class="product-total-usd" id="product-total-usd-${productId}">
                                $0.00
                            </div>
                        </div>
                        <div>
                            <button type="button" class="btn-remove-compact" 
                                    onclick="removeProduct(${productId})">
                                ✕
                            </button>
                        </div>
                    `;
                    
                    productsContainer.appendChild(productRow);
                    
                    // Calcular totales iniciales
                    const quantity = parseFloat(productData.quantity) || 0;
                    const price = parseFloat(productData.price) || 0;
                    const totalCNY = quantity * price;
                    const totalUSD = totalCNY / exchangeRate;
                    
                    products.push({
                        id: productId,
                        link: productData.link || '',
                        name: productData.name || '',
                        variant: productData.variant || '',
                        quantity: quantity,
                        price: price,
                        totalCNY: totalCNY,
                        totalUSD: totalUSD
                    });
                    
                    // Configurar event listeners
                    setupProductEventListeners(productId);
                    autoResizeTextareas(productRow);
                    
                    // Actualizar displays iniciales
                    const totalCNYElement = document.getElementById(`product-total-cny-${productId}`);
                    const totalUSDElement = document.getElementById(`product-total-usd-${productId}`);
                    
                    if (totalCNYElement) {
                        totalCNYElement.textContent = `¥${totalCNY.toFixed(2)}`;
                    }
                    if (totalUSDElement) {
                        totalUSDElement.textContent = `$${totalUSD.toFixed(2)}`;
                    }
                });
            }
            
            // Cargar tarifas del agente
            if (data.agentFees && data.agentFees.length > 0) {
                agentFeesContainer.innerHTML = '';
                agentFees = [];
                
                data.agentFees.forEach((feeData, index) => {
                    const feeId = Date.now() + index + 10000;
                    
                    const feeRow = document.createElement('div');
                    feeRow.className = 'agent-fee-row';
                    feeRow.id = `fee-${feeId}`;
                    feeRow.innerHTML = `
                        <div>
                            <input type="text" class="auto-expand-cell agent-editable fee-description clear-on-focus" 
                                   value="${feeData.description || ''}" 
                                   placeholder="Fee description" 
                                   style="width: 100%;">
                        </div>
                        <div>
                            <input type="number" class="empty-price-cell agent-editable fee-amount clear-on-focus" 
                                   value="${feeData.amountCNY || ''}" 
                                   placeholder="0.00"
                                   style="width: 100%; text-align: right;"
                                   min="0" step="0.01">
                        </div>
                        <div style="font-size: 11px; text-align: right; padding-right: 5px;">
                            <span class="fee-usd" id="fee-usd-${feeId}">$0.00</span>
                        </div>
                    `;
                    
                    agentFeesContainer.appendChild(feeRow);
                    
                    const amountCNY = parseFloat(feeData.amountCNY) || 0;
                    const amountUSD = amountCNY / exchangeRate;
                    
                    agentFees.push({
                        id: feeId,
                        description: feeData.description || '',
                        amountCNY: amountCNY,
                        amountUSD: amountUSD
                    });
                    
                    // Configurar event listeners
                    const descriptionInput = feeRow.querySelector('.fee-description');
                    const amountInput = feeRow.querySelector('.fee-amount');
                    
                    descriptionInput.addEventListener('input', () => updateFeeData(feeId));
                    amountInput.addEventListener('input', () => updateFeeTotal(feeId));
                    
                    // Actualizar display USD
                    const usdElement = document.getElementById(`fee-usd-${feeId}`);
                    if (usdElement) {
                        usdElement.textContent = `$${amountUSD.toFixed(2)}`;
                    }
                });
            }
            
            // Actualizar todos los cálculos
            updateAllTotals();
            
        } catch (error) {
            console.error('Error loading URL data:', error);
            alert('❌ Could not load quotation from link. Starting new quotation.');
        }
    }
    
    function resetAll() {
        if (confirm('Clear entire quotation? All data will be lost.')) {
            productsContainer.innerHTML = '<div class="product-row-grid empty-message" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #7f8c8d; font-style: italic;">No products added. Click "ADD PRODUCT" to start.</div>';
            products = [];
            
            // Resetear tarifas (mantener una línea)
            agentFeesContainer.innerHTML = '';
            agentFees = [];
            addNewFeeLine(true);
            
            // Resetear otros campos
            exchangeRateInput.value = 7.25;
            exchangeRate = 7.25;
            
            linkSection.style.display = 'none';
            updateAllTotals();
            window.location.hash = '';
        }
    }
    
    // Funciones auxiliares
    function autoResizeTextareas(element) {
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach(autoResizeTextarea);
    }
    
    function autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }
    
    // Hacer funciones accesibles globalmente
    window.removeProduct = function(productId) {
        if (confirm('Delete this product?')) {
            const productRow = document.getElementById(`product-${productId}`);
            if (productRow) productRow.remove();
            
            products = products.filter(p => p.id !== productId);
            
            if (products.length === 0) {
                productsContainer.innerHTML = '<div class="product-row-grid empty-message" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #7f8c8d; font-style: italic;">No products added. Click "ADD PRODUCT" to start.</div>';
            }
            
            updateAllTotals();
        }
    };
    
    // Auto-guardar
    setInterval(() => {
        if (products.length > 0 || agentFees.length > 0) {
            const data = {
                products: products,
                agentFees: agentFees,
                exchangeRate: exchangeRate
            };
            localStorage.setItem('quotation_auto_save', JSON.stringify(data));
        }
    }, 3000);
});
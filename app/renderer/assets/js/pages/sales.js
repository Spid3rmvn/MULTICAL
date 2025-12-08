/**
 * Sales Page Controller
 * Handles both stock-based sales (stickers) and product sales
 */

const SalesPage = {
  metresPerRoll: 50, // 1 roll = 50 metres
  stockDropdown: null,
  saleTypeDropdown: null,
  paymentDropdown: null,
  productDropdown: null,
  productPaymentDropdown: null,

  init() {
    this.initCustomDropdowns();
    this.bindEvents();
    this.render();
    
    // Subscribe to store changes
    Store.subscribe('sales', () => this.render());
    Store.subscribe('products', () => this.updateProductDropdownItems());
    Store.subscribe('stock', () => this.updateStockDropdownItems());
  },

  initCustomDropdowns() {
    // Stock Color Dropdown
    const stockContainer = document.getElementById('stock-color-dropdown');
    if (stockContainer) {
      const availableStock = Store.getAvailableStockColors();
      
      this.stockDropdown = new CustomDropdown(stockContainer, {
        placeholder: availableStock.length > 0 ? 'Choose sticker' : 'No stock - add stock first',
        showColorSwatch: true,
        items: availableStock.map(s => {
          const typeConfig = STICKER_TYPES[s.sticker_type] || STICKER_TYPES.colored;
          return {
            value: s.id.toString(),
            label: `${s.color} (${typeConfig.name}) - ${s.remaining.toLocaleString()}m`,
            color: s.sticker_type === 'colored' ? s.color : null,
            stickerType: s.sticker_type,
            remaining: s.remaining,
            badge: `${Math.floor(s.remaining / this.metresPerRoll)} rolls`
          };
        }),
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('sale-stock-id-input');
          if (hiddenInput) hiddenInput.value = selected.value;
          this.updateStockInfo(selected);
          this.calculateStockSaleTotal();
        }
      });
    }

    // Sale Type Dropdown
    const saleTypeContainer = document.getElementById('sale-type-dropdown');
    if (saleTypeContainer) {
      this.saleTypeDropdown = new CustomDropdown(saleTypeContainer, {
        placeholder: 'Metres',
        items: [
          { value: 'metres', label: 'Metres', badge: 'per metre' },
          { value: 'rolls', label: 'Whole Rolls', badge: '50m each' }
        ],
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('sale-unit-input');
          if (hiddenInput) hiddenInput.value = selected.value;
          this.updateUnitLabel(selected.value);
          this.calculateStockSaleTotal();
        }
      });
      // Auto-select first item
      this.saleTypeDropdown.selectItem(saleTypeContainer.querySelector('.dropdown-item'));
    }

    // Payment Method Dropdown (Stock Sale)
    const paymentContainer = document.getElementById('payment-method-dropdown');
    if (paymentContainer) {
      this.paymentDropdown = new CustomDropdown(paymentContainer, {
        placeholder: 'Cash',
        items: [
          { value: 'cash', label: 'Cash' },
          { value: 'mpesa', label: 'M-Pesa' },
          { value: 'card', label: 'Card' },
          { value: 'credit', label: 'Credit (Add to Debt)' }
        ],
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('payment-method-input');
          if (hiddenInput) hiddenInput.value = selected.value;
        }
      });
      // Auto-select first item
      this.paymentDropdown.selectItem(paymentContainer.querySelector('.dropdown-item'));
    }

    // ==================== Product Sale Dropdowns ====================
    
    // Product Dropdown
    const productContainer = document.getElementById('product-dropdown');
    if (productContainer) {
      const availableProducts = Store.products.filter(p => p.stock > 0);
      
      this.productDropdown = new CustomDropdown(productContainer, {
        placeholder: availableProducts.length > 0 ? 'Choose product' : 'No products - add products first',
        items: availableProducts.map(p => {
          const typeConfig = PRODUCT_TYPES[p.product_type];
          return {
            value: p.id.toString(),
            label: p.name,
            price: p.selling_price,
            stock: p.stock,
            minQty: p.min_sale_qty || 1,
            productType: p.product_type,
            badge: `${p.stock} in stock`
          };
        }),
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('sale-product-id-input');
          if (hiddenInput) hiddenInput.value = selected.value;
          this.updateProductInfo(selected);
          this.calculateTotal();
        }
      });
    }

    // Payment Method Dropdown (Product Sale)
    const productPaymentContainer = document.getElementById('product-payment-dropdown');
    if (productPaymentContainer) {
      this.productPaymentDropdown = new CustomDropdown(productPaymentContainer, {
        placeholder: 'Cash',
        items: [
          { value: 'cash', label: 'Cash' },
          { value: 'mpesa', label: 'M-Pesa' },
          { value: 'card', label: 'Card' },
          { value: 'credit', label: 'Credit (Add to Debt)' }
        ],
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('product-payment-input');
          if (hiddenInput) hiddenInput.value = selected.value;
        }
      });
      // Auto-select first item
      this.productPaymentDropdown.selectItem(productPaymentContainer.querySelector('.dropdown-item'));
    }
  },

  bindEvents() {
    // Modal Handling
    const modal = document.getElementById('modal-record-sale');
    const btnRecord = document.getElementById('btn-record-sale');
    const btnClose = document.getElementById('btn-close-sale-modal');
    const btnCancel1 = document.getElementById('btn-cancel-sale-1');
    const btnCancel2 = document.getElementById('btn-cancel-sale-2');

    const openModal = () => {
        if (modal) modal.classList.add('open');
    };

    const closeModal = () => {
        if (modal) {
            modal.classList.remove('open');
            // Reset forms
            document.getElementById('stock-sale-form')?.reset();
            document.getElementById('sale-form')?.reset();
            this.resetStockSaleDisplay();
            this.resetProductSaleDisplay();
            // Reset stock sale dropdowns
            this.stockDropdown?.reset();
            this.saleTypeDropdown?.reset();
            this.paymentDropdown?.reset();
            // Reset product sale dropdowns
            this.productDropdown?.reset();
            this.productPaymentDropdown?.reset();
            // Re-select defaults for stock sale
            const saleTypeContainer = document.getElementById('sale-type-dropdown');
            const paymentContainer = document.getElementById('payment-method-dropdown');
            if (saleTypeContainer) this.saleTypeDropdown?.selectItem(saleTypeContainer.querySelector('.dropdown-item'));
            if (paymentContainer) this.paymentDropdown?.selectItem(paymentContainer.querySelector('.dropdown-item'));
            // Re-select defaults for product sale
            const productPaymentContainer = document.getElementById('product-payment-dropdown');
            if (productPaymentContainer) this.productPaymentDropdown?.selectItem(productPaymentContainer.querySelector('.dropdown-item'));
        }
    };

    if (btnRecord) btnRecord.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel1) btnCancel1.addEventListener('click', closeModal);
    if (btnCancel2) btnCancel2.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Tab switching
    const tabStock = document.getElementById('tab-stock-sale');
    const tabProduct = document.getElementById('tab-product-sale');
    const stockSection = document.getElementById('stock-sale-section');
    const productSection = document.getElementById('product-sale-section');

    if (tabStock) {
      tabStock.addEventListener('click', (e) => {
        e.preventDefault(); // prevent subbmision if inside form (it's not, but safety)
        tabStock.className = 'px-4 py-2 bg-white text-black font-medium rounded-md text-sm shadow-sm transition-all';
        tabProduct.className = 'px-4 py-2 text-gray-500 font-medium rounded-md text-sm hover:bg-gray-200 transition-all';
        stockSection?.classList.remove('hidden');
        productSection?.classList.add('hidden');
      });
    }

    if (tabProduct) {
      tabProduct.addEventListener('click', (e) => {
        e.preventDefault();
        tabProduct.className = 'px-4 py-2 bg-white text-black font-medium rounded-md text-sm shadow-sm transition-all';
        tabStock.className = 'px-4 py-2 text-gray-500 font-medium rounded-md text-sm hover:bg-gray-200 transition-all';
        productSection?.classList.remove('hidden');
        stockSection?.classList.add('hidden');
      });
    }

    // Stock sale form events
    const stockForm = document.getElementById('stock-sale-form');
    const stockQuantity = document.getElementById('sale-stock-quantity');
    const pricePerMetre = document.getElementById('sale-price-per-metre');

    if (stockQuantity) stockQuantity.addEventListener('input', () => this.calculateStockSaleTotal());
    if (pricePerMetre) pricePerMetre.addEventListener('input', () => this.calculateStockSaleTotal());

    if (stockForm) {
      stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(stockForm);
        this.handleStockSaleSubmit(formData);
        closeModal();
      });
    }

    // Product sale form events
    const form = document.getElementById('sale-form');
    const productSelect = document.getElementById('sale-product');
    const quantityInput = document.getElementById('sale-quantity');
    const discountInput = document.getElementById('sale-discount');

    if (productSelect) productSelect.addEventListener('change', () => this.calculateTotal());
    if (quantityInput) quantityInput.addEventListener('input', () => this.calculateTotal());
    if (discountInput) discountInput.addEventListener('input', () => this.calculateTotal());

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(new FormData(form));
        closeModal();
      });
    }
  },

  // ==================== Stock Sale Functions ====================

  updateStockDropdownItems() {
    if (!this.stockDropdown) return;

    const availableStock = Store.getAvailableStockColors();
    
    this.stockDropdown.setItems(availableStock.map(s => {
      const typeConfig = STICKER_TYPES[s.sticker_type] || STICKER_TYPES.colored;
      return {
        value: s.id.toString(),
        label: `${s.color} (${typeConfig.name}) - ${s.remaining.toLocaleString()}m`,
        color: s.sticker_type === 'colored' ? s.color : null,
        stickerType: s.sticker_type,
        remaining: s.remaining,
        badge: `${Math.floor(s.remaining / this.metresPerRoll)} rolls`
      };
    }));
  },

  updateStockInfo(selected) {
    const infoEl = document.getElementById('stock-remaining-info');
    if (!infoEl || !selected) return;

    const remaining = parseFloat(selected.remaining) || 0;
    
    if (remaining > 0) {
      const rollsLeft = Math.floor(remaining / this.metresPerRoll);
      infoEl.textContent = `${remaining.toLocaleString()}m available (${rollsLeft} full rolls)`;
    } else {
      infoEl.textContent = '';
    }
  },

  updateUnitLabel(selectedValue) {
    const label = document.getElementById('quantity-label');
    const deductLabel = document.getElementById('metres-deducted-label');
    
    if (!label) return;

    // Use passed value or get from hidden input
    const value = selectedValue || document.getElementById('sale-unit-input')?.value || 'metres';

    if (value === 'rolls') {
      label.textContent = 'Rolls Sold';
      if (deductLabel) deductLabel.textContent = 'Metres to Deduct';
    } else {
      label.textContent = 'Metres Sold';
      if (deductLabel) deductLabel.textContent = 'Metres to Deduct';
    }
  },

  calculateStockSaleTotal() {
    const unitInput = document.getElementById('sale-unit-input');
    const quantityInput = document.getElementById('sale-stock-quantity');
    const priceInput = document.getElementById('sale-price-per-metre');
    const metresToDeductEl = document.getElementById('metres-to-deduct');
    const totalEl = document.getElementById('stock-sale-total');

    if (!quantityInput || !priceInput) return;

    const quantity = parseFloat(quantityInput.value) || 0;
    const pricePerMetre = parseFloat(priceInput.value) || 0;
    const isRolls = unitInput?.value === 'rolls';

    // Calculate metres to deduct
    const metresToDeduct = isRolls ? quantity * this.metresPerRoll : quantity;
    
    // Calculate total price
    const total = metresToDeduct * pricePerMetre;

    if (metresToDeductEl) {
      metresToDeductEl.textContent = `${metresToDeduct.toLocaleString()}m`;
    }

    if (totalEl) {
      totalEl.textContent = `KSh ${total.toFixed(2)}`;
    }
  },

  resetStockSaleDisplay() {
    const metresToDeductEl = document.getElementById('metres-to-deduct');
    const totalEl = document.getElementById('stock-sale-total');
    const infoEl = document.getElementById('stock-remaining-info');

    if (metresToDeductEl) metresToDeductEl.textContent = '0m';
    if (totalEl) totalEl.textContent = 'KSh 0.00';
    if (infoEl) infoEl.textContent = '';
  },

  resetProductSaleDisplay() {
    const totalEl = document.getElementById('sale-total');
    const infoEl = document.getElementById('product-sale-info');
    const hintEl = document.getElementById('quantity-hint');

    if (totalEl) totalEl.textContent = 'KSh 0.00';
    if (infoEl) infoEl.textContent = '';
    if (hintEl) hintEl.textContent = '';
  },

  handleStockSaleSubmit(formData) {
    const stockId = parseInt(formData.get('stock_id'));
    const saleUnit = formData.get('sale_unit');
    const quantity = parseFloat(formData.get('stock_quantity'));
    const pricePerMetre = parseFloat(formData.get('price_per_metre'));
    const paymentMethod = formData.get('payment_method');
    const customerName = formData.get('customer_name') || 'Walk-in';

    if (!stockId) {
      Toast.error('No Sticker Selected', 'Please select a sticker color');
      return;
    }

    if (!quantity || quantity <= 0) {
      Toast.error('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    // Calculate metres to deduct
    const metresToDeduct = saleUnit === 'rolls' ? quantity * this.metresPerRoll : quantity;

    // Try to deduct from stock
    const result = Store.deductStockMetres(stockId, metresToDeduct);
    
    if (!result.success) {
      Toast.error('Stock Error', result.error);
      return;
    }

    // Get stock info for sale record
    const stockItem = Store.getStock(stockId);
    const total = metresToDeduct * pricePerMetre;
    const typeConfig = STICKER_TYPES[stockItem.sticker_type] || STICKER_TYPES.colored;

    // Create sale record
    const sale = Store.addSale({
      type: 'stock',
      stock_id: stockId,
      product_name: `${stockItem.color} ${typeConfig.name} Sticker`,
      sticker_type: stockItem.sticker_type,
      quantity: `${metresToDeduct}m`,
      amount: total,
      payment_method: paymentMethod,
      customer_name: customerName
    });

    // Add to debts if credit
    if (paymentMethod === 'credit') {
      Store.addDebt({
        customer_name: customerName,
        phone: '',
        amount: total,
        due_date: null,
        description: `Sale: ${stockItem.color} Sticker - ${metresToDeduct}m`
      });
    }

    // Reset dropdowns
    this.updateStockDropdownItems();

    // Show success toast
    Toast.success('Sale Completed', `${metresToDeduct}m of ${stockItem.color} sticker sold for KSh ${total.toLocaleString()}`);
  },

  // ==================== Product Sale Functions ====================

  handleSubmit(formData) {
    const productId = parseInt(formData.get('product_id'));
    const quantity = parseInt(formData.get('quantity'));
    const product = Store.getProduct(productId);

    if (!product) {
      Toast.error('No Product Selected', 'Please select a product');
      return;
    }

    // Check minimum sale quantity
    const minQty = product.min_sale_qty || 1;
    if (quantity < minQty) {
      const typeConfig = PRODUCT_TYPES[product.product_type];
      Toast.error('Minimum Quantity', `${typeConfig?.name || 'This product'} must be sold in ${typeConfig?.saleUnit || 'minimum ' + minQty + ' units'}`);
      return;
    }

    // Validate quantity is multiple of min sale qty
    if (quantity % minQty !== 0) {
      const typeConfig = PRODUCT_TYPES[product.product_type];
      Toast.error('Invalid Quantity', `${typeConfig?.name || 'This product'} must be sold in multiples of ${minQty}`);
      return;
    }

    if (quantity > product.stock) {
      Toast.error('Insufficient Stock', `Only ${product.stock} units available`);
      return;
    }

    const discount = parseFloat(formData.get('discount')) || 0;
    const subtotal = product.selling_price * quantity;
    const total = subtotal - (subtotal * discount / 100);
    const paymentMethod = formData.get('payment_method');
    const customerName = formData.get('customer_name') || 'Walk-in';

    // Create sale
    const sale = Store.addSale({
      type: 'product',
      product_id: productId,
      product_name: product.name,
      product_type: product.product_type,
      quantity: quantity,
      amount: total,
      payment_method: paymentMethod,
      customer_name: customerName
    });

    // Update stock
    Store.updateProduct(productId, { stock: product.stock - quantity });

    // Add to debts if credit
    if (paymentMethod === 'credit') {
      Store.addDebt({
        customer_name: customerName,
        phone: '',
        amount: total,
        due_date: null,
        description: `Sale: ${product.name} x${quantity}`
      });
    }

    // Update product dropdown
    this.updateProductDropdownItems();

    // Show success toast
    Toast.success('Sale Completed', `${quantity}x ${product.name} sold for KSh ${total.toLocaleString()}`);
  },

  calculateTotal() {
    const quantityInput = document.getElementById('sale-quantity');
    const discountInput = document.getElementById('sale-discount');
    const totalEl = document.getElementById('sale-total');
    const productIdInput = document.getElementById('sale-product-id-input');

    const productId = productIdInput?.value ? parseInt(productIdInput.value) : null;
    const product = productId ? Store.getProduct(productId) : null;
    const price = product?.selling_price || 0;
    const quantity = parseInt(quantityInput?.value) || 1;
    const discount = parseFloat(discountInput?.value) || 0;

    const subtotal = price * quantity;
    const total = subtotal - (subtotal * discount / 100);

    if (totalEl) {
      totalEl.textContent = `KSh ${total.toFixed(2)}`;
    }
  },

  updateProductInfo(selected) {
    const infoEl = document.getElementById('product-sale-info');
    const hintEl = document.getElementById('quantity-hint');
    
    if (infoEl && selected) {
      infoEl.textContent = `KSh ${parseFloat(selected.price).toLocaleString()} per unit • ${selected.stock} in stock`;
    }
    
    if (hintEl && selected) {
      const minQty = selected.minQty || 1;
      const typeConfig = PRODUCT_TYPES[selected.productType];
      if (typeConfig && minQty > 1) {
        hintEl.textContent = `Minimum: ${minQty} (sold in ${typeConfig.saleUnit})`;
      } else {
        hintEl.textContent = '';
      }
    }
  },

  updateProductDropdownItems() {
    if (!this.productDropdown) return;

    const availableProducts = Store.products.filter(p => p.stock > 0);
    
    this.productDropdown.setItems(availableProducts.map(p => {
      const typeConfig = PRODUCT_TYPES[p.product_type];
      return {
        value: p.id.toString(),
        label: p.name,
        price: p.selling_price,
        stock: p.stock,
        minQty: p.min_sale_qty || 1,
        productType: p.product_type,
        badge: `${p.stock} in stock`
      };
    }));
  },

  // ==================== Render Sales Table ====================

  render() {
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;

    const todaySales = Store.getTodaySales();

    if (todaySales.length === 0) {
      tbody.innerHTML = `
        <tr class="text-center">
            <td colspan="6" class="px-5 py-8 text-gray-500">
                <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <p>No sales recorded today.</p>
                </div>
            </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = todaySales.map(sale => {
      const time = new Date(sale.timestamp).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
      return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-5 py-4 text-sm text-gray-600">${time}</td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-2">
            <span class="status-badge ${sale.type === 'stock' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}">${sale.type === 'stock' ? 'Stock' : 'Product'}</span>
            <span class="text-sm font-medium text-gray-900">${sale.product_name}</span>
          </div>
        </td>
        <td class="px-5 py-4 text-sm text-gray-600">${sale.quantity}</td>
        <td class="px-5 py-4 text-sm font-medium text-gray-900">KSh ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td class="px-5 py-4">
          <span class="status-badge ${sale.payment_method === 'credit' ? 'status-badge--error' : 'status-badge--success'} capitalize">${sale.payment_method}</span>
        </td>
        <td class="px-5 py-4 text-sm text-gray-600">${sale.customer_name}</td>
      </tr>
    `}).join('');
  }
};

window.SalesPage = SalesPage;

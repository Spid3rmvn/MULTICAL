/**
 * Products Page Controller
 * Manages Life Savers and Chevrons inventory
 */

const ProductsPage = {
  selectedProductType: 'life_saver',
  selectedColor: 'white_red',
  selectedSize: '1x1',
  currentPage: 1,
  itemsPerPage: 10,

  init() {
    this.bindEvents();
    this.render();
    this.updateSummary();
    
    // Subscribe to store changes
    Store.subscribe('products', () => {
      this.render();
      this.updateSummary();
    });
  },

  bindEvents() {
    // Modal Elements
    const modal = document.getElementById('modal-add-product');
    const btnAdd = document.getElementById('btn-add-product');
    const btnClose = document.getElementById('btn-close-product-modal');
    const btnCancel = document.getElementById('btn-cancel-product');
    const addForm = document.getElementById('add-product-form');

    // Open Modal
    if (btnAdd && modal) {
      btnAdd.addEventListener('click', () => {
        modal.classList.add('open');
        this.resetModal();
      });
    }

    // Close Modal Helper
    const closeModal = () => {
        if (modal) {
            modal.classList.remove('open');
            addForm?.reset();
        }
    };

    // Close Button Actions
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Close on Click Outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Product Type Selector
    const typeButtons = document.querySelectorAll('.product-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectProductType(btn.dataset.type);
      });
    });

    // Color Selector
    const colorButtons = document.querySelectorAll('.product-color-btn');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectColor(btn.dataset.color);
      });
    });

    // Size Selector
    const sizeButtons = document.querySelectorAll('.product-size-btn');
    sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectSize(btn.dataset.size);
      });
    });

    // Handle Form Submit
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit(new FormData(addForm));
        closeModal();
      });
    }
  },

  resetModal() {
    this.selectedProductType = 'life_saver';
    this.selectedColor = 'white_red';
    this.selectedSize = '1x1';

    // Explicitly reset hidden inputs
    const typeInput = document.getElementById('product-type-input');
    const colorInput = document.getElementById('product-color-input');
    const sizeInput = document.getElementById('product-size-input');

    if (typeInput) typeInput.value = 'life_saver';
    if (colorInput) colorInput.value = 'white_red';
    if (sizeInput) sizeInput.value = '1x1';

    this.updateTypeUI();
    this.updateColorUI();
    this.updateSizeUI();
    this.toggleColorSizeSections();
  },

  selectProductType(type) {
    this.selectedProductType = type;
    const hiddenInput = document.getElementById('product-type-input');
    if (hiddenInput) hiddenInput.value = type;
    this.updateTypeUI();
    this.toggleColorSizeSections();
  },

  toggleColorSizeSections() {
    const colorSection = document.getElementById('color-section');
    const sizeSection = document.getElementById('size-section');
    const chevronColors = document.querySelectorAll('.chevron-color');
    const stripeColors = document.querySelectorAll('.stripe-color');
    
    if (this.selectedProductType === 'chevron') {
      // Show color and size for Chevrons
      if (colorSection) colorSection.classList.remove('hidden');
      if (sizeSection) sizeSection.classList.remove('hidden');
      // Show chevron colors, hide stripe colors
      chevronColors.forEach(btn => btn.classList.remove('hidden'));
      stripeColors.forEach(btn => btn.classList.add('hidden'));
      // Set default to chevron color
      this.selectedColor = 'white_red';
      document.getElementById('product-color-input').value = 'white_red';
      this.updateColorUI();
    } else if (this.selectedProductType === 'stripes') {
      // Show color for Stripes, hide size
      if (colorSection) colorSection.classList.remove('hidden');
      if (sizeSection) sizeSection.classList.add('hidden');
      // Show stripe colors, hide chevron colors
      chevronColors.forEach(btn => btn.classList.add('hidden'));
      stripeColors.forEach(btn => btn.classList.remove('hidden'));
      // Set default to stripe color
      this.selectedColor = 'white';
      document.getElementById('product-color-input').value = 'white';
      this.updateColorUI();
    } else {
      // Hide color and size for Life Savers
      if (colorSection) colorSection.classList.add('hidden');
      if (sizeSection) sizeSection.classList.add('hidden');
    }
  },

  updateTypeUI() {
    const typeButtons = document.querySelectorAll('.product-type-btn');
    
    typeButtons.forEach(btn => {
      const btnType = btn.dataset.type;
      
      if (btnType === this.selectedProductType) {
        if (btnType === 'life_saver') {
          btn.className = 'product-type-btn flex-1 px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50 text-green-800 font-medium text-sm transition-all hover:bg-green-100';
        } else if (btnType === 'chevron') {
          btn.className = 'product-type-btn flex-1 px-4 py-3 rounded-lg border-2 border-orange-500 bg-orange-50 text-orange-800 font-medium text-sm transition-all hover:bg-orange-100';
        } else if (btnType === 'stripes') {
          btn.className = 'product-type-btn flex-1 px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-800 font-medium text-sm transition-all hover:bg-blue-100';
        }
      } else {
        btn.className = 'product-type-btn flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-300';
      }
    });
  },

  selectColor(color) {
    this.selectedColor = color;
    const hiddenInput = document.getElementById('product-color-input');
    if (hiddenInput) hiddenInput.value = color;
    this.updateColorUI();
  },

  updateColorUI() {
    const colorButtons = document.querySelectorAll('.product-color-btn');
    
    colorButtons.forEach(btn => {
      const btnColor = btn.dataset.color;
      const isHidden = btn.classList.contains('hidden');
      
      // Skip hidden buttons
      if (isHidden) return;
      
      if (btnColor === this.selectedColor) {
        btn.className = 'product-color-btn flex-1 px-4 py-3 rounded-lg border-2 border-gray-900 bg-gray-50 font-medium text-sm transition-all hover:bg-gray-100 flex items-center justify-center gap-2';
        // Preserve the specific color type class
        if (btn.dataset.for === 'chevron') {
          btn.classList.add('chevron-color');
        } else if (btn.dataset.for === 'stripes') {
          btn.classList.add('stripe-color');
        }
      } else {
        btn.className = 'product-color-btn flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2';
        // Preserve the specific color type class
        if (btn.dataset.for === 'chevron') {
          btn.classList.add('chevron-color');
        } else if (btn.dataset.for === 'stripes') {
          btn.classList.add('stripe-color');
        }
      }
    });
  },

  selectSize(size) {
    this.selectedSize = size;
    const hiddenInput = document.getElementById('product-size-input');
    if (hiddenInput) hiddenInput.value = size;
    this.updateSizeUI();
  },

  updateSizeUI() {
    const sizeButtons = document.querySelectorAll('.product-size-btn');
    
    sizeButtons.forEach(btn => {
      const btnSize = btn.dataset.size;
      
      if (btnSize === this.selectedSize) {
        btn.className = 'product-size-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-900 bg-gray-50 font-medium text-sm transition-all hover:bg-gray-100';
      } else {
        btn.className = 'product-size-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-300';
      }
    });
  },

  async handleSubmit(formData) {
    const productType = formData.get('product_type');
    const productColor = (productType === 'chevron' || productType === 'stripes') ? formData.get('product_color') : null;
    const productSize = productType === 'chevron' ? formData.get('product_size') : null;
    
    const typeConfig = PRODUCT_TYPES[productType];
    const colorConfig = productColor ? PRODUCT_COLORS[productColor] : null;
    
    // Generate product name
    let productName;
    if (productType === 'life_saver') {
      productName = 'Life Saver';
    } else if (productType === 'stripes') {
      productName = `${colorConfig.name} ${typeConfig.name}`;
    } else {
      productName = `${colorConfig.name} ${typeConfig.name} (${productSize})`;
    }

    // Check if this product variant already exists
    const existing = Store.products.find(p => {
      if (productType === 'life_saver') {
        return p.product_type === 'life_saver';
      }
      if (productType === 'stripes') {
        return p.product_type === 'stripes' && p.color === productColor;
      }
      return p.product_type === productType && 
             p.color === productColor && 
             p.size === productSize;
    });

    if (existing) {
      // Update stock of existing product
      const additionalStock = parseInt(formData.get('stock'));
      await Store.updateProduct(existing.id, { 
        stock: existing.stock + additionalStock
      });
      Toast.success('Stock Updated', `Added ${additionalStock} units to ${productName}`);
      return;
    }

    const product = {
      name: productName,
      product_type: productType,
      color: productColor,
      size: productSize,
      selling_price: 0,
      stock: parseInt(formData.get('stock'))
    };
    
    await Store.addProduct(product);
    Toast.success('Product Added', `${productName} with ${product.stock} units`);
  },

  updateSummary() {
    const products = Store.products;
    
    const totalProducts = products.length;
    const lifeSavers = products.filter(p => p.product_type === 'life_saver').reduce((sum, p) => sum + p.stock, 0);
    const chevrons = products.filter(p => p.product_type === 'chevron').reduce((sum, p) => sum + p.stock, 0);
    const stripes = products.filter(p => p.product_type === 'stripes').reduce((sum, p) => sum + p.stock, 0);
    const stockValue = products.reduce((sum, p) => sum + (p.stock * (p.selling_price || 0)), 0);

    const totalEl = document.getElementById('summary-total-products');
    const lifeSaversEl = document.getElementById('summary-life-savers');
    const chevronsEl = document.getElementById('summary-chevrons');
    const stripesEl = document.getElementById('summary-stripes');
    const valueEl = document.getElementById('summary-stock-value');

    if (totalEl) totalEl.textContent = totalProducts;
    if (lifeSaversEl) lifeSaversEl.textContent = lifeSavers;
    if (chevronsEl) chevronsEl.textContent = chevrons;
    if (stripesEl) stripesEl.textContent = stripes;
    if (valueEl) valueEl.textContent = `KSh ${stockValue.toLocaleString()}`;
  },

  render() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const products = Store.products;

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center text-gray-500">
             <div class="flex flex-col items-center justify-center">
                <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <p>No products added yet</p>
                <button onclick="document.getElementById('btn-add-product').click()" class="text-black font-semibold hover:underline text-sm mt-2">Add your first product</button>
            </div>
          </td>
        </tr>
      `;
      this.updatePaginationControls(0);
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(products.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedProducts.map(product => {
      const typeConfig = PRODUCT_TYPES[product.product_type] || PRODUCT_TYPES.life_saver;
      const colorConfig = product.color ? PRODUCT_COLORS[product.color] : null;
      
      return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.badgeClass}">
            ${typeConfig.name}
          </span>
        </td>
        <td class="px-6 py-4">
          ${colorConfig ? `
          <div class="flex items-center gap-2">
            <div class="flex -space-x-1">
              ${colorConfig.colors.map(color => `<div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: ${color};"></div>`).join('')}
            </div>
            <span class="text-sm text-gray-700">${colorConfig.name}</span>
          </div>
          ` : '<span class="text-sm text-gray-400">-</span>'}
        </td>
        <td class="px-6 py-4 text-sm text-gray-600 font-medium">${product.size || '-'}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <span class="status-badge ${product.stock > 10 ? 'status-badge--success' : product.stock > 0 ? 'status-badge--warning' : 'status-badge--error'}">
               ${product.stock} Units
            </span>
            <button onclick="ProductsPage.addStock(${product.id})" class="px-2 py-1 text-xs font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors">+ Add</button>
          </div>
        </td>
        <td class="px-6 py-4">
          <button onclick="ProductsPage.delete(${product.id})" class="text-gray-400 hover:text-red-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </td>
      </tr>
    `}).join('');

    // Update pagination controls
    this.updatePaginationControls(products.length);
  },

  updatePaginationControls(totalItems) {
    const paginationEl = document.getElementById('products-pagination');
    if (!paginationEl) return;

    if (totalItems === 0) {
      paginationEl.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

    paginationEl.innerHTML = `
      <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          Showing <span class="font-medium">${startItem}</span> to <span class="font-medium">${endItem}</span> of <span class="font-medium">${totalItems}</span> products
        </div>
        <div class="flex gap-2">
          <button onclick="ProductsPage.previousPage()" 
            class="px-3 py-1 text-sm font-medium rounded-md ${this.currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}"
            ${this.currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          <span class="px-3 py-1 text-sm font-medium text-gray-700">
            Page ${this.currentPage} of ${totalPages}
          </span>
          <button onclick="ProductsPage.nextPage()" 
            class="px-3 py-1 text-sm font-medium rounded-md ${this.currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}"
            ${this.currentPage === totalPages ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `;
  },

  nextPage() {
    const totalPages = Math.ceil(Store.products.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.render();
    }
  },

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.render();
    }
  },

  addStock(id) {
    const product = Store.getProduct(id);
    if (!product) return;

    const typeConfig = PRODUCT_TYPES[product.product_type] || PRODUCT_TYPES.life_saver;

    // Create modal HTML
    const modalHTML = `
      <div id="modal-add-product-stock" class="modal-overlay open">
        <div class="modal-container" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Add Product Stock</h3>
            <button class="modal-close-btn" onclick="ProductsPage.closeAddStockModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <p class="text-sm text-gray-500">Product</p>
              <p class="font-semibold text-gray-900">${product.name}</p>
              <p class="text-sm text-gray-600 mt-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConfig.badgeClass}">
                  ${typeConfig.name}
                </span>
                <span class="ml-2">Current stock: ${product.stock} units</span>
              </p>
            </div>
            
            <form id="add-product-stock-form" class="space-y-4">
              <input type="hidden" id="add-stock-product-id" value="${id}">
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                <input type="number" id="add-stock-quantity-input" min="1" step="1" class="w-full" placeholder="Enter units to add" required autofocus>
                <p class="text-xs text-gray-500 mt-1">Add units to existing stock</p>
              </div>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-gray-700">
                  <span class="font-medium">New Total Stock:</span> 
                  <span id="new-total-stock">${product.stock}</span> units
                </p>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary px-4 py-2 rounded-lg" onclick="ProductsPage.closeAddStockModal()">Cancel</button>
            <button type="button" class="btn-primary px-4 py-2 rounded-lg" onclick="ProductsPage.submitAddStock()">Add Stock</button>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    const existingModal = document.getElementById('modal-add-product-stock');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listener for real-time calculation
    const qtyInput = document.getElementById('add-stock-quantity-input');
    if (qtyInput) {
      qtyInput.addEventListener('input', () => {
        const additionalQty = parseInt(qtyInput.value) || 0;
        const newTotalStock = product.stock + additionalQty;
        
        document.getElementById('new-total-stock').textContent = newTotalStock;
      });
    }
  },

  closeAddStockModal() {
    const modal = document.getElementById('modal-add-product-stock');
    if (modal) modal.remove();
  },

  submitAddStock() {
    const productId = parseInt(document.getElementById('add-stock-product-id').value);
    const qty = parseInt(document.getElementById('add-stock-quantity-input').value);

    if (!qty || qty <= 0) {
      Toast.error('Invalid Input', 'Please enter a valid quantity');
      return;
    }

    const product = Store.getProduct(productId);
    if (product) {
      Store.updateProduct(productId, { stock: product.stock + qty });
      Toast.success('Stock Added', `Added ${qty} unit${qty > 1 ? 's' : ''} to ${product.name}`);
    }

    this.closeAddStockModal();
  },

  delete(id) {
    const product = Store.getProduct(id);
    if (!product) return;

    const typeConfig = PRODUCT_TYPES[product.product_type] || {};
    
    ConfirmModal.show({
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      itemName: product.name,
      itemDetails: `${typeConfig.name || 'Product'} • ${product.stock} units in stock`,
      onConfirm: () => {
        Store.deleteProduct(id);
        Toast.success('Product Deleted', `${product.name} has been removed`);
      }
    });
  }
};

window.ProductsPage = ProductsPage;

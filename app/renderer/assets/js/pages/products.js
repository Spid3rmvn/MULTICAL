/**
 * Products Page Controller
 * Manages Life Savers and Chevrons inventory
 */

const ProductsPage = {
  selectedProductType: 'life_saver',
  selectedColor: 'white_red',
  selectedSize: '1x1',

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
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(new FormData(addForm));
        closeModal();
      });
    }
  },

  resetModal() {
    this.selectedProductType = 'life_saver';
    this.selectedColor = 'white_red';
    this.selectedSize = '1x1';
    this.updateTypeUI();
    this.updateColorUI();
    this.updateSizeUI();
    this.updateSaleInfoText();
  },

  selectProductType(type) {
    this.selectedProductType = type;
    const hiddenInput = document.getElementById('product-type-input');
    if (hiddenInput) hiddenInput.value = type;
    this.updateTypeUI();
    this.updateSaleInfoText();
    this.toggleColorSizeSections();
  },

  toggleColorSizeSections() {
    const colorSection = document.getElementById('color-section');
    const sizeSection = document.getElementById('size-section');
    
    if (this.selectedProductType === 'chevron') {
      // Show color and size for Chevrons
      if (colorSection) colorSection.classList.remove('hidden');
      if (sizeSection) sizeSection.classList.remove('hidden');
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
        } else {
          btn.className = 'product-type-btn flex-1 px-4 py-3 rounded-lg border-2 border-orange-500 bg-orange-50 text-orange-800 font-medium text-sm transition-all hover:bg-orange-100';
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
      
      if (btnColor === this.selectedColor) {
        btn.className = 'product-color-btn flex-1 px-4 py-3 rounded-lg border-2 border-gray-900 bg-gray-50 font-medium text-sm transition-all hover:bg-gray-100 flex items-center justify-center gap-2';
      } else {
        btn.className = 'product-color-btn flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2';
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

  updateSaleInfoText() {
    const infoText = document.getElementById('sale-info-text');
    if (!infoText) return;

    const typeConfig = PRODUCT_TYPES[this.selectedProductType];
    if (typeConfig) {
      infoText.textContent = `${typeConfig.name}s are sold in ${typeConfig.saleUnit}`;
    }
  },

  handleSubmit(formData) {
    const productType = formData.get('product_type');
    const productColor = productType === 'chevron' ? formData.get('product_color') : null;
    const productSize = productType === 'chevron' ? formData.get('product_size') : null;
    
    const typeConfig = PRODUCT_TYPES[productType];
    const colorConfig = productColor ? PRODUCT_COLORS[productColor] : null;
    
    // Generate product name
    let productName;
    if (productType === 'life_saver') {
      productName = 'Life Saver';
    } else {
      productName = `${colorConfig.name} ${typeConfig.name} (${productSize})`;
    }

    // Check if this product variant already exists
    const existing = Store.products.find(p => {
      if (productType === 'life_saver') {
        return p.product_type === 'life_saver';
      }
      return p.product_type === productType && 
             p.color === productColor && 
             p.size === productSize;
    });

    if (existing) {
      // Update stock of existing product
      const additionalStock = parseInt(formData.get('stock'));
      Store.updateProduct(existing.id, { 
        stock: existing.stock + additionalStock,
        selling_price: parseFloat(formData.get('selling_price'))
      });
      Toast.success('Stock Updated', `Added ${additionalStock} units to ${productName}`);
      return;
    }

    const product = {
      name: productName,
      product_type: productType,
      color: productColor,
      size: productSize,
      selling_price: parseFloat(formData.get('selling_price')),
      stock: parseInt(formData.get('stock')),
      min_sale_qty: typeConfig.minSaleQty,
      sale_unit: typeConfig.saleUnit
    };
    
    Store.addProduct(product);
    Toast.success('Product Added', `${productName} with ${product.stock} units`);
  },

  updateSummary() {
    const products = Store.products;
    
    const totalProducts = products.length;
    const lifeSavers = products.filter(p => p.product_type === 'life_saver').reduce((sum, p) => sum + p.stock, 0);
    const chevrons = products.filter(p => p.product_type === 'chevron').reduce((sum, p) => sum + p.stock, 0);
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.selling_price), 0);

    const totalEl = document.getElementById('summary-total-products');
    const lifeSaversEl = document.getElementById('summary-life-savers');
    const chevronsEl = document.getElementById('summary-chevrons');
    const valueEl = document.getElementById('summary-stock-value');

    if (totalEl) totalEl.textContent = totalProducts;
    if (lifeSaversEl) lifeSaversEl.textContent = lifeSavers;
    if (chevronsEl) chevronsEl.textContent = chevrons;
    if (valueEl) valueEl.textContent = `KSh ${stockValue.toLocaleString()}`;
  },

  render() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const products = Store.products;

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-gray-500">
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
      return;
    }

    tbody.innerHTML = products.map(product => {
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
              <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: ${colorConfig.colors[0]};"></div>
              <div class="w-4 h-4 rounded-full border border-gray-200" style="background-color: ${colorConfig.colors[1]};"></div>
            </div>
            <span class="text-sm text-gray-700">${colorConfig.name}</span>
          </div>
          ` : '<span class="text-sm text-gray-400">-</span>'}
        </td>
        <td class="px-6 py-4 text-sm text-gray-600 font-medium">${product.size || '-'}</td>
        <td class="px-6 py-4 text-sm font-medium text-gray-900">KSh ${product.selling_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <span class="status-badge ${product.stock > 10 ? 'status-badge--success' : product.stock > 0 ? 'status-badge--warning' : 'status-badge--error'}">
               ${product.stock} Units
            </span>
            <button onclick="ProductsPage.addStock(${product.id})" class="text-xs text-gray-500 hover:text-black font-medium">+ Add</button>
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
  },

  addStock(id) {
    const product = Store.getProduct(id);
    if (!product) return;

    const qty = prompt(`Add stock for ${product.name}:\nEnter quantity to add:`);
    if (qty && parseInt(qty) > 0) {
      const addedQty = parseInt(qty);
      Store.updateProduct(id, { stock: product.stock + addedQty });
      Toast.success('Stock Added', `Added ${addedQty} units to ${product.name}`);
    }
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

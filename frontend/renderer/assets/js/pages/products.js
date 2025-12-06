/**
 * Products Page Controller
 */

const ProductsPage = {
  init() {
    this.bindEvents();
    this.render();
    
    // Subscribe to store changes
    Store.subscribe('products', () => this.render());
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

    // Handle Form Submit
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(new FormData(addForm));
        closeModal();
      });
    }
  },

  handleSubmit(formData) {
    const product = {
      name: formData.get('name'),
      category: formData.get('category'),
      buying_price: parseFloat(formData.get('buying_price')),
      selling_price: parseFloat(formData.get('selling_price')),
      stock: parseInt(formData.get('stock')),
      sku: formData.get('sku')
    };
    Store.addProduct(product);
  },

  render() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const products = Store.products;

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-gray-500">
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

    tbody.innerHTML = products.map(product => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
               </svg>
            </div>
            <div>
                 <p class="text-sm font-medium text-gray-900">${product.name}</p>
                 <p class="text-xs text-gray-500">${product.sku || 'No SKU'}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600 capitalize">${product.category || '-'}</td>
        <td class="px-6 py-4 text-sm text-gray-600">KSh ${product.buying_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td class="px-6 py-4 text-sm font-medium text-gray-900">KSh ${product.selling_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td class="px-6 py-4">
          <span class="status-badge ${product.stock > 10 ? 'status-badge--success' : product.stock > 0 ? 'status-badge--pending' : 'status-badge--error'}">
             ${product.stock} Units
          </span>
        </td>
        <td class="px-6 py-4">
          <button onclick="ProductsPage.delete(${product.id})" class="text-gray-400 hover:text-red-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  delete(id) {
    if (confirm('Are you sure you want to delete this product?')) {
      Store.deleteProduct(id);
    }
  }
};

window.ProductsPage = ProductsPage;

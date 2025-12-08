/**
 * Confirmation Modal Component
 * A reusable confirmation dialog for delete and other destructive actions
 */

const ConfirmModal = {
  // Store the callback to execute on confirm
  onConfirmCallback: null,
  itemName: '',
  itemType: '',

  init() {
    this.createModal();
    this.bindEvents();
  },

  createModal() {
    // Check if modal already exists
    if (document.getElementById('modal-confirm-delete')) return;

    const modalHTML = `
      <div id="modal-confirm-delete" class="modal-overlay">
        <div class="modal-container" style="max-width: 400px;">
          <div class="modal-body text-center py-8">
            <!-- Warning Icon -->
            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            
            <!-- Title -->
            <h3 id="confirm-modal-title" class="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
            
            <!-- Message -->
            <p id="confirm-modal-message" class="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            
            <!-- Item Preview (optional) -->
            <div id="confirm-modal-preview" class="hidden bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left">
              <p id="confirm-modal-item-name" class="text-sm font-medium text-gray-900"></p>
              <p id="confirm-modal-item-details" class="text-xs text-gray-500 mt-0.5"></p>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-3 justify-center">
              <button id="btn-confirm-cancel" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button id="btn-confirm-delete" class="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg text-sm hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  bindEvents() {
    const modal = document.getElementById('modal-confirm-delete');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const btnDelete = document.getElementById('btn-confirm-delete');

    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.close());
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (this.onConfirmCallback) {
          this.onConfirmCallback();
        }
        this.close();
      });
    }

    // Close on click outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('open')) {
        this.close();
      }
    });
  },

  /**
   * Show the confirmation modal
   * @param {Object} options - Modal options
   * @param {string} options.title - Modal title
   * @param {string} options.message - Modal message
   * @param {string} options.itemName - Name of item being deleted (optional)
   * @param {string} options.itemDetails - Additional details about the item (optional)
   * @param {string} options.confirmText - Text for confirm button (default: "Delete")
   * @param {string} options.confirmClass - Class for confirm button (default: red)
   * @param {Function} options.onConfirm - Callback function when confirmed
   */
  show(options) {
    const modal = document.getElementById('modal-confirm-delete');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const previewEl = document.getElementById('confirm-modal-preview');
    const itemNameEl = document.getElementById('confirm-modal-item-name');
    const itemDetailsEl = document.getElementById('confirm-modal-item-details');
    const confirmBtn = document.getElementById('btn-confirm-delete');

    if (!modal) {
      this.createModal();
      this.bindEvents();
    }

    // Set content
    if (titleEl) titleEl.textContent = options.title || 'Delete Item?';
    if (messageEl) messageEl.textContent = options.message || 'Are you sure you want to delete this item? This action cannot be undone.';
    
    // Show item preview if provided
    if (options.itemName && previewEl && itemNameEl) {
      previewEl.classList.remove('hidden');
      itemNameEl.textContent = options.itemName;
      if (itemDetailsEl) {
        itemDetailsEl.textContent = options.itemDetails || '';
      }
    } else if (previewEl) {
      previewEl.classList.add('hidden');
    }

    // Set confirm button text and style
    if (confirmBtn) {
      confirmBtn.textContent = options.confirmText || 'Delete';
      if (options.confirmClass) {
        confirmBtn.className = `px-5 py-2.5 font-medium rounded-lg text-sm transition-colors ${options.confirmClass}`;
      } else {
        confirmBtn.className = 'px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg text-sm hover:bg-red-700 transition-colors';
      }
    }

    // Store callback
    this.onConfirmCallback = options.onConfirm;

    // Open modal
    document.getElementById('modal-confirm-delete')?.classList.add('open');
  },

  close() {
    const modal = document.getElementById('modal-confirm-delete');
    if (modal) {
      modal.classList.remove('open');
    }
    this.onConfirmCallback = null;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ConfirmModal.init());
} else {
  ConfirmModal.init();
}

// Make globally available
window.ConfirmModal = ConfirmModal;

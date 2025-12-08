/**
 * Stock Page Controller
 * Manages sticker inventory with auto-calculated metres
 */

const StockPage = {
  metresPerRoll: 50, // 1 roll = 50 metres
  selectedStickerType: 'colored', // Default sticker type

  init() {
    this.sizeRowIdCounter = 0;
    this.selectedStickerType = 'colored';
    this.bindEvents();
    this.render();
    this.updateSummary();
    
    // Subscribe to store changes
    Store.subscribe('stock', () => {
      this.render();
      this.updateSummary();
    });
  },

  bindEvents() {
    // Modal Elements
    const modal = document.getElementById('modal-add-stock');
    const btnAdd = document.getElementById('btn-add-stock');
    const btnClose = document.getElementById('btn-close-stock-modal');
    const btnCancel = document.getElementById('btn-cancel-stock');
    const addForm = document.getElementById('add-stock-form');
    const btnAddSizeRow = document.getElementById('btn-add-size-row');

    // Open Modal
    if (btnAdd && modal) {
      btnAdd.addEventListener('click', () => {
        modal.classList.add('open');
        // Reset and add initial row
        this.resetModal();
      });
    }

    // Close Modal Helper
    const closeModal = () => {
        if (modal) {
            modal.classList.remove('open');
            this.resetModal();
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

    // Add Size Row Button
    if (btnAddSizeRow) {
      btnAddSizeRow.addEventListener('click', () => {
        this.addSizeRow();
      });
    }

    // Sticker Type Selector Buttons
    const typeButtons = document.querySelectorAll('.sticker-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectStickerType(btn.dataset.type);
      });
    });

    // Handle Form Submit
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
        closeModal();
      });
    }
  },

  resetModal() {
    const container = document.getElementById('size-rows-container');
    if (container) {
      container.innerHTML = '';
      this.sizeRowIdCounter = 0;
      this.addSizeRow(); // Add initial row
    }
    const colorInput = document.getElementById('stock-color-input');
    if (colorInput) {
      colorInput.value = '';
    }
    // Reset sticker type to default
    this.selectedStickerType = 'colored';
    this.updateStickerTypeUI();
    this.updateTotalSummary();
  },

  selectStickerType(type) {
    this.selectedStickerType = type;
    const hiddenInput = document.getElementById('sticker-type-input');
    if (hiddenInput) hiddenInput.value = type;
    this.updateStickerTypeUI();
  },

  updateStickerTypeUI() {
    const typeButtons = document.querySelectorAll('.sticker-type-btn');
    const colorLabel = document.getElementById('color-label');
    const colorInput = document.getElementById('stock-color-input');
    const colorHint = document.getElementById('color-hint');
    
    const typeConfig = STICKER_TYPES[this.selectedStickerType];
    
    // Update button states
    typeButtons.forEach(btn => {
      const btnType = btn.dataset.type;
      const config = STICKER_TYPES[btnType];
      
      if (btnType === this.selectedStickerType) {
        // Active state based on type
        if (btnType === 'colored') {
          btn.className = 'sticker-type-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-purple-500 bg-purple-50 text-purple-800 font-medium text-sm transition-all hover:bg-purple-100';
        } else if (btnType === 'clear') {
          btn.className = 'sticker-type-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-800 font-medium text-sm transition-all hover:bg-blue-100';
        } else if (btnType === 'reflective') {
          btn.className = 'sticker-type-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-800 font-medium text-sm transition-all hover:bg-amber-100';
        }
      } else {
        // Inactive state
        btn.className = 'sticker-type-btn flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-300';
      }
    });

    // Update color label and hint based on type
    if (this.selectedStickerType === 'colored') {
      if (colorLabel) colorLabel.textContent = 'Sticker Color';
      if (colorInput) colorInput.placeholder = 'e.g. Red, Blue, Gold';
      if (colorHint) colorHint.textContent = 'Enter a color name for your sticker';
    } else if (this.selectedStickerType === 'clear') {
      if (colorLabel) colorLabel.textContent = 'Sticker Name/Variant';
      if (colorInput) colorInput.placeholder = 'e.g. Matte Clear, Glossy Clear';
      if (colorHint) colorHint.textContent = 'Enter a name or variant for your clear sticker';
    } else if (this.selectedStickerType === 'reflective') {
      if (colorLabel) colorLabel.textContent = 'Sticker Name/Finish';
      if (colorInput) colorInput.placeholder = 'e.g. Chrome Silver, Gold Mirror';
      if (colorHint) colorHint.textContent = 'Enter a name or finish type for your reflective sticker';
    }
  },

  addSizeRow() {
    const container = document.getElementById('size-rows-container');
    if (!container) return;

    const rowId = this.sizeRowIdCounter++;
    const isFirstRow = container.children.length === 0;

    const row = document.createElement('div');
    row.className = 'flex gap-3 items-start';
    row.dataset.rowId = rowId;
    row.innerHTML = `
      <div class="flex-1">
        <input type="number" 
               class="w-full size-input" 
               data-row-id="${rowId}"
               step="0.1" 
               min="0.1" 
               placeholder="Size (e.g. 1, 1.2)" 
               required>
      </div>
      <div class="flex-1">
        <input type="number" 
               class="w-full rolls-input" 
               data-row-id="${rowId}"
               min="1" 
               placeholder="Rolls" 
               required>
      </div>
      <div class="flex-1">
        <div class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
          <span class="metres-display" data-row-id="${rowId}">0</span>m
        </div>
      </div>
      ${!isFirstRow ? `
        <button type="button" 
                class="remove-row-btn p-2 text-gray-400 hover:text-red-600 transition-colors" 
                data-row-id="${rowId}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      ` : '<div class="w-9"></div>'}
    `;

    container.appendChild(row);

    // Bind events for this row
    const sizeInput = row.querySelector('.size-input');
    const rollsInput = row.querySelector('.rolls-input');
    const removeBtn = row.querySelector('.remove-row-btn');

    if (sizeInput) {
      sizeInput.addEventListener('input', () => this.updateRowMetres(rowId));
    }
    if (rollsInput) {
      rollsInput.addEventListener('input', () => this.updateRowMetres(rowId));
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.removeSizeRow(rowId));
    }
  },

  removeSizeRow(rowId) {
    const row = document.querySelector(`[data-row-id="${rowId}"]`);
    if (row) {
      row.remove();
      this.updateTotalSummary();
    }
  },

  updateRowMetres(rowId) {
    const sizeInput = document.querySelector(`.size-input[data-row-id="${rowId}"]`);
    const rollsInput = document.querySelector(`.rolls-input[data-row-id="${rowId}"]`);
    const metresDisplay = document.querySelector(`.metres-display[data-row-id="${rowId}"]`);

    if (sizeInput && rollsInput && metresDisplay) {
      const size = parseFloat(sizeInput.value) || 0;
      const rolls = parseInt(rollsInput.value) || 0;
      const metresPerRoll = this.metresPerRoll * size;
      const totalMetres = rolls * metresPerRoll;
      
      metresDisplay.textContent = totalMetres.toLocaleString();
    }

    this.updateTotalSummary();
  },

  updateTotalSummary() {
    const sizeInputs = document.querySelectorAll('.size-input');
    const rollsInputs = document.querySelectorAll('.rolls-input');
    
    let totalRolls = 0;
    let totalMetres = 0;

    rollsInputs.forEach((input, index) => {
      const rolls = parseInt(input.value) || 0;
      const size = parseFloat(sizeInputs[index]?.value) || 0;
      const metresPerRoll = this.metresPerRoll * size;
      
      totalRolls += rolls;
      totalMetres += rolls * metresPerRoll;
    });

    const totalRollsEl = document.getElementById('total-rolls');
    const totalMetresEl = document.getElementById('total-metres');

    if (totalRollsEl) totalRollsEl.textContent = totalRolls.toLocaleString();
    if (totalMetresEl) totalMetresEl.textContent = totalMetres.toLocaleString();
  },

  handleSubmit() {
    const colorInput = document.getElementById('stock-color-input');
    const color = colorInput?.value.trim();

    if (!color) {
      Toast.error('Missing Color', 'Please enter a color');
      return;
    }

    // Get all size rows
    const sizeInputs = document.querySelectorAll('.size-input');
    const rollsInputs = document.querySelectorAll('.rolls-input');

    if (sizeInputs.length === 0) {
      Toast.error('No Size Variant', 'Please add at least one size variant');
      return;
    }

    // Get selected sticker type
    const stickerType = this.selectedStickerType || 'colored';

    let addedCount = 0;
    let updatedCount = 0;

    // Process each size row
    sizeInputs.forEach((sizeInput, index) => {
      const size = sizeInput.value.trim();
      const rolls = parseInt(rollsInputs[index]?.value);

      if (!size || !rolls || rolls < 1) {
        return; // Skip invalid rows
      }

      // Check if this color, size, and sticker type combination already exists
      const existing = Store.getStockByColorSizeAndType(color, size, stickerType);
      if (existing) {
        // Add to existing stock
        Store.addRollsToStock(existing.id, rolls);
        updatedCount++;
      } else {
        // Create new stock entry
        Store.addStock({
          color: color,
          size: size,
          sticker_type: stickerType,
          rolls: rolls
        });
        addedCount++;
      }
    });

    // Show success message
    const messages = [];
    if (addedCount > 0) messages.push(`Added ${addedCount} new size variant${addedCount > 1 ? 's' : ''}`);
    if (updatedCount > 0) messages.push(`Updated ${updatedCount} existing variant${updatedCount > 1 ? 's' : ''}`);
    
    if (messages.length > 0) {
      Toast.success('Stock Added', `${messages.join(' and ')} for ${color}`);
    }
  },

  updateSummary() {
    const summary = Store.getStockSummary();
    
    const colorsEl = document.getElementById('summary-colors');
    const rollsEl = document.getElementById('summary-rolls');
    const metresEl = document.getElementById('summary-metres');
    const remainingEl = document.getElementById('summary-remaining');

    if (colorsEl) colorsEl.textContent = summary.totalItems;
    if (rollsEl) rollsEl.textContent = summary.totalRolls;
    if (metresEl) metresEl.textContent = `${summary.totalMetres.toLocaleString()}m`;
    if (remainingEl) remainingEl.textContent = `${summary.metresRemaining.toLocaleString()}m`;
  },

  getStockStatus(remaining, total) {
    const percentage = (remaining / total) * 100;
    if (percentage === 0) {
      return { label: 'Out of Stock', class: 'status-badge--error' };
    } else if (percentage <= 20) {
      return { label: 'Low Stock', class: 'status-badge--warning' };
    } else {
      return { label: 'In Stock', class: 'status-badge--success' };
    }
  },

  render() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    const stock = Store.stock;

    if (stock.length === 0) {
      tbody.innerHTML = `
        <tr class="text-center">
            <td colspan="10" class="px-5 py-8 text-gray-500">
                <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <p>No stock added yet</p>
                    <button onclick="document.getElementById('btn-add-stock').click()" class="text-black font-semibold hover:underline text-sm mt-2">Add your first stock</button>
                </div>
            </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = stock.map(item => {
      const remaining = Store.getRemainingMetres(item.id);
      const rollsLeft = Store.getRemainingRolls(item.id);
      const status = this.getStockStatus(remaining, item.total_metres);
      const stickerTypeConfig = STICKER_TYPES[item.sticker_type] || STICKER_TYPES.colored;

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stickerTypeConfig.badgeClass}">
              ${stickerTypeConfig.name}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              ${item.sticker_type === 'colored' ? `<div class="w-8 h-8 rounded-lg border border-gray-200 shadow-sm" style="background-color: ${this.getColorHex(item.color)};"></div>` : 
                item.sticker_type === 'clear' ? `<div class="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-white to-gray-100"></div>` :
                `<div class="w-8 h-8 rounded-lg border border-gray-200 shadow-sm bg-gradient-to-br from-gray-200 via-white to-gray-300"></div>`
              }
              <span class="text-sm font-medium text-gray-900">${item.color}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-gray-600">${item.size || '1'}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${item.rolls}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${item.total_metres.toLocaleString()}m</td>
          <td class="px-6 py-4 text-sm text-gray-600">${item.metres_used.toLocaleString()}m</td>
          <td class="px-6 py-4 text-sm font-medium text-gray-900">${remaining.toLocaleString()}m</td>
          <td class="px-6 py-4 text-sm text-gray-900">${rollsLeft}</td>
          <td class="px-6 py-4">
            <span class="status-badge ${status.class}">${status.label}</span>
          </td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button onclick="StockPage.addMoreRolls(${item.id})" class="text-black hover:text-gray-700 text-sm font-medium">Add Rolls</button>
              <button onclick="StockPage.delete(${item.id})" class="text-gray-400 hover:text-red-600 transition-colors">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Try to get a CSS color from common color names
  getColorHex(colorName) {
    const colors = {
      // Basic colors
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      orange: '#f97316',
      purple: '#a855f7',
      pink: '#ec4899',
      black: '#1f2937',
      white: '#ffffff',
      gold: '#fbbf24',
      silver: '#9ca3af',
      brown: '#92400e',
      grey: '#6b7280',
      gray: '#6b7280',
      
      // Dark variations
      'dark blue': '#1e3a8a',
      'darkblue': '#1e3a8a',
      'dark green': '#166534',
      'darkgreen': '#166534',
      'dark red': '#991b1b',
      'darkred': '#991b1b',
      'dark purple': '#581c87',
      'darkpurple': '#581c87',
      'dark gray': '#374151',
      'darkgray': '#374151',
      'dark grey': '#374151',
      'darkgrey': '#374151',
      
      // Light variations
      'light blue': '#93c5fd',
      'lightblue': '#93c5fd',
      'light green': '#86efac',
      'lightgreen': '#86efac',
      'light pink': '#fbcfe8',
      'lightpink': '#fbcfe8',
      'light gray': '#d1d5db',
      'lightgray': '#d1d5db',
      'light grey': '#d1d5db',
      'lightgrey': '#d1d5db',
      
      // Other common variations
      navy: '#1e3a8a',
      cyan: '#06b6d4',
      teal: '#14b8a6',
      lime: '#84cc16',
      maroon: '#7f1d1d',
      olive: '#a3a33a',
      beige: '#f5f5dc',
      cream: '#fffdd0',
      coral: '#ff7f50',
      magenta: '#ff00ff',
      violet: '#8b5cf6',
      indigo: '#6366f1',
      turquoise: '#40e0d0',
      lavender: '#e9d5ff',
      peach: '#ffdab9',
      mint: '#a7f3d0',
      rose: '#fb7185',
      burgundy: '#800020'
    };
    
    const lowerColor = colorName.toLowerCase().trim();
    return colors[lowerColor] || '#9ca3af'; // Default to gray if not found
  },

  addMoreRolls(id) {
    const rolls = prompt('Enter number of rolls to add:');
    if (rolls && parseInt(rolls) > 0) {
      Store.addRollsToStock(id, parseInt(rolls));
    }
  },

  delete(id) {
    const stockItem = Store.stock.find(s => s.id === id);
    if (!stockItem) return;

    const typeConfig = STICKER_TYPES[stockItem.sticker_type] || STICKER_TYPES.colored;
    const remaining = Store.getRemainingMetres(id);
    
    ConfirmModal.show({
      title: 'Delete Stock Entry?',
      message: 'Are you sure you want to delete this stock entry? This action cannot be undone.',
      itemName: `${stockItem.color} - Size ${stockItem.size || '1'}`,
      itemDetails: `${typeConfig.name} Sticker • ${remaining.toLocaleString()}m remaining`,
      onConfirm: () => {
        Store.deleteStock(id);
        Toast.success('Stock Deleted', `${stockItem.color} sticker stock has been removed`);
      }
    });
  }
};

window.StockPage = StockPage;

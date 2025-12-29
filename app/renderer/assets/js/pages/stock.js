/**
 * Stock Page Controller
 * Manages sticker inventory with auto-calculated metres
 */

const StockPage = {
  metresPerRoll: 50, // 1 roll = 50 metres
  selectedStickerType: 'colored', // Default sticker type
  currentPage: 1,
  itemsPerPage: 10,

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
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const modalElement = document.getElementById('modal-add-stock');
        if (modalElement) {
          modalElement.classList.add('open');
          // Reset and add initial row
          this.resetModal();
        }
      });
    }

    // Close Modal Helper
    const closeModal = () => {
        const modalElement = document.getElementById('modal-add-stock');
        if (modalElement) {
            modalElement.classList.remove('open');
            this.resetModal();
        }
    };

    // Close Button Actions
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Close on Click Outside
    const modalElement = document.getElementById('modal-add-stock');
    if (modalElement) {
      modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
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
    }
    const colorInput = document.getElementById('stock-color-input');
    if (colorInput) {
      colorInput.value = '';
    }
    // Reset sticker type to default
    this.selectedStickerType = 'colored';
    this.updateStickerTypeUI();
    // Add initial row AFTER updating UI so it uses correct type
    if (container) {
      this.addSizeRow();
    }
    this.updateTotalSummary();
  },

  selectStickerType(type) {
    this.selectedStickerType = type;
    const hiddenInput = document.getElementById('sticker-type-input');
    if (hiddenInput) hiddenInput.value = type;
    
    // Update UI elements (buttons, labels) without rebuilding rows
    this.updateStickerTypeUIOnly();
    
    // Only rebuild rows if there's actual data entered (not empty initial row)
    const container = document.getElementById('size-rows-container');
    if (container && container.children.length > 0) {
      const hasData = Array.from(container.querySelectorAll('.size-input, .rolls-input, .metres-per-roll-input'))
        .some(input => input.value && input.value.trim() !== '');
      
      if (hasData) {
        // User has entered data, rebuild to preserve it
        this.rebuildSizeRows();
      } else {
        // Empty initial row, just clear and add fresh one with new type
        container.innerHTML = '';
        this.sizeRowIdCounter = 0;
        this.addSizeRow();
        this.updateTotalSummary();
      }
    }
  },

  updateStickerTypeUI() {
    this.updateStickerTypeUIOnly();
    
    // Only rebuild size rows if there are existing rows (user switched types mid-entry)
    const container = document.getElementById('size-rows-container');
    if (container && container.children.length > 0) {
      this.rebuildSizeRows();
    }
  },

  updateStickerTypeUIOnly() {
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
      if (colorInput) colorInput.placeholder = 'e.g. Red Dark, Black Matt, Blue Medium';
      if (colorHint) colorHint.textContent = 'Enter color with variant (dark, light, gloss, matt, medium, etc.)';
    } else if (this.selectedStickerType === 'reflective') {
      if (colorLabel) colorLabel.textContent = 'Reflective Color';
      if (colorInput) colorInput.placeholder = 'e.g. Red, White, Yellow, Chevron Yellow Red';
      if (colorHint) colorHint.textContent = 'Enter color (red, white, yellow, chevron yellow red, chevron white red, etc.)';
    }
  },

  rebuildSizeRows() {
    const container = document.getElementById('size-rows-container');
    if (!container) return;

    // Save current values
    const rows = Array.from(container.querySelectorAll('[data-row-id]'));
    const rowData = rows.map(row => {
      return {
        size: row.querySelector('.size-input')?.value || '',
        rolls: row.querySelector('.rolls-input')?.value || '',
        metresPerRoll: row.querySelector('.metres-per-roll-input')?.value || ''
      };
    });

    // Clear and rebuild rows
    container.innerHTML = '';
    this.sizeRowIdCounter = 0;
    
    if (rowData.length === 0) {
      // Add initial empty row if none existed
      this.addSizeRow();
    } else {
      // Rebuild rows with saved data
      rowData.forEach((data, index) => {
        this.addSizeRow();
        const row = container.children[index];
        if (row) {
          const sizeInput = row.querySelector('.size-input');
          const rollsInput = row.querySelector('.rolls-input');
          const metresPerRollInput = row.querySelector('.metres-per-roll-input');
          
          if (sizeInput && data.size) sizeInput.value = data.size;
          if (rollsInput && data.rolls) rollsInput.value = data.rolls;
          if (metresPerRollInput && data.metresPerRoll) metresPerRollInput.value = data.metresPerRoll;
          
          // Trigger calculation
          if (rollsInput && rollsInput.value) {
            this.updateRowMetres(parseInt(row.dataset.rowId));
          }
        }
      });
    }
    
    this.updateTotalSummary();
  },

  addSizeRow() {
    const container = document.getElementById('size-rows-container');
    if (!container) return;

    const rowId = this.sizeRowIdCounter++;
    const isFirstRow = container.children.length === 0;
    const isReflective = this.selectedStickerType === 'reflective';

    const row = document.createElement('div');
    row.className = 'grid grid-cols-2 gap-4';
    row.dataset.rowId = rowId;
    row.innerHTML = `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Width (inches) ${isFirstRow ? '*' : ''}</label>
        <input type="number" 
               class="w-full size-input" 
               data-row-id="${rowId}"
               step="1" 
               min="1" 
               placeholder="Width in inches" 
               ${isFirstRow ? 'required' : ''}>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Rolls ${isFirstRow ? '*' : ''}</label>
        <input type="number" 
               class="w-full rolls-input" 
               data-row-id="${rowId}"
               min="1" 
               placeholder="Number of rolls" 
               ${isFirstRow ? 'required' : ''}>
      </div>
      ${isReflective ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Metres per Roll ${isFirstRow ? '*' : ''}</label>
          <input type="number" 
                 class="w-full metres-per-roll-input" 
                 data-row-id="${rowId}"
                 step="0.1" 
                 min="1" 
                 value="50"
                 placeholder="Metres per roll" 
                 ${isFirstRow ? 'required' : ''}>
          <p class="text-xs text-gray-500 mt-1">Length of each roll</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Total Metres</label>
          <div class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            <span class="metres-display font-semibold" data-row-id="${rowId}">0</span>m
          </div>
        </div>
      ` : `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Total Metres</label>
          <div class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            <span class="metres-display font-semibold" data-row-id="${rowId}">0</span>m
          </div>
          <p class="text-xs text-gray-500 mt-1">Calculated: rolls × 50m</p>
        </div>
      `}
      ${!isFirstRow ? `
        <div class="col-span-2 flex justify-end">
          <button type="button" 
                  class="remove-row-btn text-sm text-red-600 hover:text-red-800 font-medium" 
                  data-row-id="${rowId}">
            Remove this size
          </button>
        </div>
      ` : ''}
    `;

    container.appendChild(row);

    // Bind events for this row
    const sizeInput = row.querySelector('.size-input');
    const rollsInput = row.querySelector('.rolls-input');
    const metresPerRollInput = row.querySelector('.metres-per-roll-input');
    const removeBtn = row.querySelector('.remove-row-btn');

    if (rollsInput) {
      rollsInput.addEventListener('input', () => this.updateRowMetres(rowId));
    }
    if (metresPerRollInput) {
      metresPerRollInput.addEventListener('input', () => this.updateRowMetres(rowId));
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
    const rollsInput = document.querySelector(`.rolls-input[data-row-id="${rowId}"]`);
    const metresPerRollInput = document.querySelector(`.metres-per-roll-input[data-row-id="${rowId}"]`);
    const metresDisplay = document.querySelector(`.metres-display[data-row-id="${rowId}"]`);

    if (rollsInput && metresDisplay) {
      const rolls = parseInt(rollsInput.value) || 0;
      let totalMetres = 0;
      
      if (this.selectedStickerType === 'reflective' && metresPerRollInput) {
        // For reflective: use custom metres per roll
        const metresPerRoll = parseFloat(metresPerRollInput.value) || 0;
        totalMetres = rolls * metresPerRoll;
      } else {
        // For colored/clear: use fixed 50m per roll
        totalMetres = rolls * this.metresPerRoll;
      }
      
      metresDisplay.textContent = totalMetres.toLocaleString();
    }

    this.updateTotalSummary();
  },

  updateTotalSummary() {
    const rollsInputs = document.querySelectorAll('.rolls-input');
    const metresPerRollInputs = document.querySelectorAll('.metres-per-roll-input');
    
    let totalRolls = 0;
    let totalMetres = 0;
    const isReflective = this.selectedStickerType === 'reflective';

    rollsInputs.forEach((input, index) => {
      const rolls = parseInt(input.value) || 0;
      totalRolls += rolls;
      
      if (isReflective) {
        // For reflective stickers, use custom metres per roll input
        const metresPerRollInput = metresPerRollInputs[index];
        const metresPerRoll = parseFloat(metresPerRollInput?.value) || 0;
        totalMetres += rolls * metresPerRoll;
      } else {
        // For other types, calculate: rolls × 50
        totalMetres += rolls * this.metresPerRoll;
      }
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
    const metresPerRollInputs = document.querySelectorAll('.metres-per-roll-input');

    if (sizeInputs.length === 0) {
      Toast.error('No Size Variant', 'Please add at least one size variant');
      return;
    }

    // Get selected sticker type
    const stickerType = this.selectedStickerType || 'colored';
    const isReflective = stickerType === 'reflective';

    let addedCount = 0;
    let updatedCount = 0;

    // Process each size row
    sizeInputs.forEach((sizeInput, index) => {
      const size = sizeInput.value.trim();
      const rolls = parseInt(rollsInputs[index]?.value);
      const customMetresPerRoll = isReflective ? parseFloat(metresPerRollInputs[index]?.value) : null;

      if (!size || !rolls || rolls < 1) {
        return; // Skip invalid rows
      }

      if (isReflective && (!customMetresPerRoll || customMetresPerRoll <= 0)) {
        Toast.error('Missing Metres per Roll', 'Please enter metres per roll for reflective stickers');
        return;
      }

      // Check if this color, size, and sticker type combination already exists
      const existing = Store.getStockByColorSizeAndType(color, size, stickerType);
      if (existing) {
        // Add to existing stock
        if (isReflective) {
          Store.addRollsToStockWithCustomMetres(existing.id, rolls, customMetresPerRoll);
        } else {
          Store.addRollsToStock(existing.id, rolls);
        }
        updatedCount++;
      } else {
        // Create new stock entry
        const stockData = {
          color: color,
          size: size,
          sticker_type: stickerType,
          rolls: rolls
        };
        
        // For reflective, add custom metres per roll
        if (isReflective) {
          stockData.custom_metres_per_roll = customMetresPerRoll;
        }
        
        Store.addStock(stockData);
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
      this.updatePaginationControls(0);
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(stock.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedStock = stock.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedStock.map(item => {
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
          <td class="px-6 py-4 text-sm text-gray-600">${item.size || '1'}in</td>
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
              <button onclick="StockPage.addMoreRolls(${item.id})" class="px-3 py-1 text-xs font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors">Add Rolls</button>
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

    // Update pagination controls
    this.updatePaginationControls(stock.length);
  },

  updatePaginationControls(totalItems) {
    const paginationEl = document.getElementById('stock-pagination');
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
          Showing <span class="font-medium">${startItem}</span> to <span class="font-medium">${endItem}</span> of <span class="font-medium">${totalItems}</span> stock items
        </div>
        <div class="flex gap-2">
          <button onclick="StockPage.previousPage()" 
            class="px-3 py-1 text-sm font-medium rounded-md ${this.currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}"
            ${this.currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          <span class="px-3 py-1 text-sm font-medium text-gray-700">
            Page ${this.currentPage} of ${totalPages}
          </span>
          <button onclick="StockPage.nextPage()" 
            class="px-3 py-1 text-sm font-medium rounded-md ${this.currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}"
            ${this.currentPage === totalPages ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `;
  },

  nextPage() {
    const totalPages = Math.ceil(Store.stock.length / this.itemsPerPage);
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
    const stockItem = Store.getStock(id);
    if (!stockItem) return;

    const typeConfig = STICKER_TYPES[stockItem.sticker_type] || STICKER_TYPES.colored;
    const remaining = Store.getRemainingMetres(id);
    const rollsLeft = Store.getRemainingRolls(id);

    // Create modal HTML
    const modalHTML = `
      <div id="modal-add-rolls" class="modal-overlay open">
        <div class="modal-container" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Add Rolls to Stock</h3>
            <button class="modal-close-btn" onclick="StockPage.closeAddRollsModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <p class="text-sm text-gray-500">Stock Item</p>
              <p class="font-semibold text-gray-900">${stockItem.color} - ${stockItem.size || '1'}" ${typeConfig.name}</p>
              <p class="text-sm text-gray-600 mt-1">Current: ${remaining.toLocaleString()}m remaining (${rollsLeft} rolls)</p>
            </div>
            
            <form id="add-rolls-form" class="space-y-4">
              <input type="hidden" id="add-rolls-stock-id" value="${id}">
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Number of Rolls to Add *</label>
                <input type="number" id="add-rolls-input" min="1" step="1" class="w-full" placeholder="Enter rolls to add" required autofocus>
                <p class="text-xs text-gray-500 mt-1">Each roll = ${stockItem.metres_per_roll || 50}m</p>
              </div>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-gray-700">
                  <span class="font-medium">New Total:</span> 
                  <span id="new-total-rolls">${stockItem.rolls}</span> rolls 
                  (<span id="new-total-metres">${stockItem.total_metres.toLocaleString()}</span>m)
                </p>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary px-4 py-2 rounded-lg" onclick="StockPage.closeAddRollsModal()">Cancel</button>
            <button type="button" class="btn-primary px-4 py-2 rounded-lg" onclick="StockPage.submitAddRolls()">Add Rolls</button>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    const existingModal = document.getElementById('modal-add-rolls');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listener for real-time calculation
    const rollsInput = document.getElementById('add-rolls-input');
    if (rollsInput) {
      rollsInput.addEventListener('input', () => {
        const additionalRolls = parseInt(rollsInput.value) || 0;
        const metresPerRoll = stockItem.metres_per_roll || 50;
        const newTotalRolls = stockItem.rolls + additionalRolls;
        const newTotalMetres = stockItem.total_metres + (additionalRolls * metresPerRoll);
        
        document.getElementById('new-total-rolls').textContent = newTotalRolls;
        document.getElementById('new-total-metres').textContent = newTotalMetres.toLocaleString();
      });
    }
  },

  closeAddRollsModal() {
    const modal = document.getElementById('modal-add-rolls');
    if (modal) modal.remove();
  },

  submitAddRolls() {
    const stockId = parseInt(document.getElementById('add-rolls-stock-id').value);
    const rolls = parseInt(document.getElementById('add-rolls-input').value);

    if (!rolls || rolls <= 0) {
      Toast.error('Invalid Input', 'Please enter a valid number of rolls');
      return;
    }

    const stockItem = Store.getStock(stockId);
    if (stockItem) {
      Store.addRollsToStock(stockId, rolls);
      Toast.success('Rolls Added', `Added ${rolls} roll${rolls > 1 ? 's' : ''} to ${stockItem.color}`);
    }

    this.closeAddRollsModal();
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

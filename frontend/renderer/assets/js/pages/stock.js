/**
 * Stock Page Controller
 * Manages sticker inventory with auto-calculated metres
 */

const StockPage = {
  metresPerRoll: 50, // 1 roll = 50 metres

  init() {
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
    const rollsInput = document.getElementById('stock-rolls-input');

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
            this.updateCalculatedMetres(0);
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

    // Auto-calculate metres when rolls change
    if (rollsInput) {
      rollsInput.addEventListener('input', () => {
        const rolls = parseInt(rollsInput.value) || 0;
        this.updateCalculatedMetres(rolls * this.metresPerRoll);
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

  updateCalculatedMetres(metres) {
    const el = document.getElementById('calculated-metres');
    if (el) {
      el.textContent = metres.toLocaleString();
    }
  },

  handleSubmit(formData) {
    const color = formData.get('color').trim();
    const rolls = parseInt(formData.get('rolls'));

    if (!color || !rolls) {
      alert('Please fill in all fields');
      return;
    }

    // Check if this color already exists
    const existing = Store.getStockByColor(color);
    if (existing) {
      // Add to existing stock
      Store.addRollsToStock(existing.id, rolls);
    } else {
      // Create new stock entry
      Store.addStock({
        color: color,
        rolls: rolls
      });
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
            <td colspan="8" class="px-5 py-8 text-gray-500">
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

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg border border-gray-200 shadow-sm" style="background-color: ${this.getColorHex(item.color)};"></div>
              <span class="text-sm font-medium text-gray-900">${item.color}</span>
            </div>
          </td>
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
    if (confirm('Are you sure you want to delete this stock entry?')) {
      Store.deleteStock(id);
    }
  }
};

window.StockPage = StockPage;

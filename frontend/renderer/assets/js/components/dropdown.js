/**
 * Custom Dropdown Component
 * A reusable, styled dropdown with support for color swatches
 */

class CustomDropdown {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.options = {
      placeholder: options.placeholder || 'Select an option',
      showColorSwatch: options.showColorSwatch || false,
      onSelect: options.onSelect || (() => {}),
      items: options.items || []
    };
    
    this.isOpen = false;
    this.selectedItem = null;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="custom-dropdown">
        <button type="button" class="dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
          <span class="dropdown-selected">
            <span class="dropdown-placeholder">${this.options.placeholder}</span>
          </span>
          <svg class="dropdown-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <ul class="dropdown-menu" role="listbox" style="display: none;">
          ${this.renderItems()}
        </ul>
      </div>
    `;

    this.dropdown = this.container.querySelector('.custom-dropdown');
    this.trigger = this.container.querySelector('.dropdown-trigger');
    this.menu = this.container.querySelector('.dropdown-menu');
    this.selectedDisplay = this.container.querySelector('.dropdown-selected');
  }

  renderItems() {
    if (this.options.items.length === 0) {
      return `<li class="dropdown-item dropdown-item-empty">No options available</li>`;
    }

    return this.options.items.map(item => {
      const colorSwatch = this.options.showColorSwatch && item.color 
        ? `<span class="dropdown-color-swatch" style="background-color: ${item.colorHex || this.getColorHex(item.color)};"></span>`
        : '';
      
      return `
        <li class="dropdown-item" role="option" data-value="${item.value}" data-label="${item.label}" data-color="${item.color || ''}" data-remaining="${item.remaining || ''}">
          ${colorSwatch}
          <span class="dropdown-item-label">${item.label}</span>
          ${item.badge ? `<span class="dropdown-item-badge">${item.badge}</span>` : ''}
        </li>
      `;
    }).join('');
  }

  bindEvents() {
    // Toggle dropdown
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Select item
    this.menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (item && !item.classList.contains('dropdown-item-empty')) {
        this.selectItem(item);
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.style.display = 'block';
    this.trigger.setAttribute('aria-expanded', 'true');
    this.dropdown.classList.add('open');
  }

  close() {
    this.isOpen = false;
    this.menu.style.display = 'none';
    this.trigger.setAttribute('aria-expanded', 'false');
    this.dropdown.classList.remove('open');
  }

  selectItem(itemEl) {
    const value = itemEl.dataset.value;
    const label = itemEl.dataset.label;
    const color = itemEl.dataset.color;
    const remaining = itemEl.dataset.remaining;

    this.selectedItem = { value, label, color, remaining };

    // Update display
    const colorSwatch = this.options.showColorSwatch && color 
      ? `<span class="dropdown-color-swatch" style="background-color: ${this.getColorHex(color)};"></span>`
      : '';
    
    this.selectedDisplay.innerHTML = `
      ${colorSwatch}
      <span class="dropdown-selected-label">${label}</span>
    `;

    // Update active state
    this.menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.remove('selected');
    });
    itemEl.classList.add('selected');

    this.close();

    // Callback
    this.options.onSelect(this.selectedItem);
  }

  getValue() {
    return this.selectedItem?.value || '';
  }

  getSelected() {
    return this.selectedItem;
  }

  setItems(items) {
    this.options.items = items;
    this.menu.innerHTML = this.renderItems();
    
    // Clear selection if current selection is not in new items
    if (this.selectedItem) {
      const stillExists = items.some(item => item.value === this.selectedItem.value);
      if (!stillExists) {
        this.reset();
      }
    }
  }

  reset() {
    this.selectedItem = null;
    this.selectedDisplay.innerHTML = `<span class="dropdown-placeholder">${this.options.placeholder}</span>`;
    this.menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.remove('selected');
    });
  }

  // Color helper (same as StockPage)
  getColorHex(colorName) {
    const colors = {
      red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
      orange: '#f97316', purple: '#a855f7', pink: '#ec4899', black: '#1f2937',
      white: '#f9fafb', gold: '#fbbf24', silver: '#9ca3af', brown: '#92400e',
      grey: '#6b7280', gray: '#6b7280',
      'dark blue': '#1e3a8a', 'darkblue': '#1e3a8a', 'dark green': '#166534',
      'dark red': '#991b1b', 'dark purple': '#581c87', 'dark gray': '#374151',
      'light blue': '#93c5fd', 'light green': '#86efac', 'light pink': '#fbcfe8',
      navy: '#1e3a8a', cyan: '#06b6d4', teal: '#14b8a6', lime: '#84cc16',
      maroon: '#7f1d1d', coral: '#ff7f50', magenta: '#ff00ff', violet: '#8b5cf6',
      indigo: '#6366f1', turquoise: '#40e0d0', lavender: '#e9d5ff', mint: '#a7f3d0'
    };
    return colors[colorName?.toLowerCase()?.trim()] || '#9ca3af';
  }
}

// Make globally available
window.CustomDropdown = CustomDropdown;

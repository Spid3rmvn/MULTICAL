/**
 * Data Store - Centralized data management
 * Now using SQLite database via IPC communication with main process
 */

// Currency configuration
const CURRENCY = {
  symbol: 'KSh',
  code: 'KES',
  format: (amount) => `KSh ${amount.toFixed(2)}`
};

// Stock configuration - metres per roll
const STOCK_CONFIG = {
  sticker: {
    name: 'Sticker',
    metresPerRoll: 50,
    unit: 'roll'
  }
};

// Sticker types configuration
const STICKER_TYPES = {
  colored: {
    id: 'colored',
    name: 'Colored',
    description: 'Standard colored stickers',
    badgeClass: 'bg-purple-100 text-purple-800'
  },
  clear: {
    id: 'clear',
    name: 'Clear',
    description: 'Transparent/clear stickers',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  reflective: {
    id: 'reflective',
    name: 'Reflective',
    description: 'Reflective/mirror stickers',
    badgeClass: 'bg-amber-100 text-amber-800'
  }
};

// Product types configuration (Life Savers and Chevrons)
const PRODUCT_TYPES = {
  life_saver: {
    id: 'life_saver',
    name: 'Life Saver',
    description: 'Life saver reflective signs',
    minSaleQty: 10,
    saleUnit: 'pack of 10',
    badgeClass: 'bg-green-100 text-green-800'
  },
  chevron: {
    id: 'chevron',
    name: 'Chevron',
    description: 'Chevron reflective signs',
    minSaleQty: 2,
    saleUnit: 'pair',
    badgeClass: 'bg-orange-100 text-orange-800'
  }
};

// Product color options
const PRODUCT_COLORS = {
  white_red: {
    id: 'white_red',
    name: 'White and Red',
    colors: ['#ffffff', '#ef4444']
  },
  yellow_red: {
    id: 'yellow_red',
    name: 'Yellow and Red',
    colors: ['#eab308', '#ef4444']
  }
};

// Product size options
const PRODUCT_SIZES = {
  '1x1': { id: '1x1', name: '1x1' },
  '1x2': { id: '1x2', name: '1x2' }
};

const Store = {
  // Currency helper
  currency: CURRENCY,

  // Stock configuration
  stockConfig: STOCK_CONFIG,

  // Data arrays (in-memory cache, synced with database)
  products: [],
  sales: [],
  debts: [],
  stock: [],

  // Initialization flag
  initialized: false,

  // Event listeners for data changes
  listeners: {
    products: [],
    sales: [],
    debts: [],
    stock: []
  },

  // ==================== Initialization ====================

  async init() {
    if (this.initialized) return;
    
    console.log('Initializing Store...');
    
    // Check if database API is available
    if (typeof window.db === 'undefined') {
      console.warn('Database API not available, falling back to localStorage');
      this.loadFromLocalStorage();
      return;
    }

    // Check for existing localStorage data to migrate
    const hasLocalStorageData = this.checkLocalStorageData();
    
    if (hasLocalStorageData) {
      console.log('Found localStorage data, migrating to database...');
      await this.migrateToDatabase();
      this.clearLocalStorage();
    }

    // Load data from database
    await this.loadFromDatabase();
    
    this.initialized = true;
    console.log('Store initialized successfully');
  },

  checkLocalStorageData() {
    try {
      const products = localStorage.getItem('multical_products');
      const stock = localStorage.getItem('multical_stock');
      const sales = localStorage.getItem('multical_sales');
      const debts = localStorage.getItem('multical_debts');
      
      return (products && JSON.parse(products).length > 0) ||
             (stock && JSON.parse(stock).length > 0) ||
             (sales && JSON.parse(sales).length > 0) ||
             (debts && JSON.parse(debts).length > 0);
    } catch {
      return false;
    }
  },

  async migrateToDatabase() {
    try {
      const localData = {
        products: JSON.parse(localStorage.getItem('multical_products') || '[]'),
        stock: JSON.parse(localStorage.getItem('multical_stock') || '[]'),
        sales: JSON.parse(localStorage.getItem('multical_sales') || '[]'),
        debts: JSON.parse(localStorage.getItem('multical_debts') || '[]')
      };
      
      await window.db.migrate(localData);
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  clearLocalStorage() {
    localStorage.removeItem('multical_products');
    localStorage.removeItem('multical_stock');
    localStorage.removeItem('multical_sales');
    localStorage.removeItem('multical_debts');
    console.log('Cleared localStorage data');
  },

  async loadFromDatabase() {
    try {
      this.products = await window.db.products.getAll();
      this.stock = await window.db.stock.getAll();
      this.sales = await window.db.sales.getAll();
      this.debts = await window.db.debts.getAll();
      
      console.log(`Loaded: ${this.products.length} products, ${this.stock.length} stock, ${this.sales.length} sales, ${this.debts.length} debts`);
    } catch (error) {
      console.error('Failed to load from database:', error);
    }
  },

  loadFromLocalStorage() {
    try {
      this.products = JSON.parse(localStorage.getItem('multical_products') || '[]');
      this.stock = JSON.parse(localStorage.getItem('multical_stock') || '[]');
      this.sales = JSON.parse(localStorage.getItem('multical_sales') || '[]');
      this.debts = JSON.parse(localStorage.getItem('multical_debts') || '[]');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  },

  // Subscribe to data changes
  subscribe(dataType, callback) {
    if (this.listeners[dataType]) {
      this.listeners[dataType].push(callback);
    }
  },

  // Notify all listeners of a data type
  notify(dataType) {
    if (this.listeners[dataType]) {
      this.listeners[dataType].forEach(cb => cb(this[dataType]));
    }
  },

  // ==================== Products CRUD ====================
  
  async addProduct(product) {
    try {
      const result = await window.db.products.add(product);
      this.products.unshift(result);
      this.notify('products');
      return result;
    } catch (error) {
      console.error('Failed to add product:', error);
      return null;
    }
  },

  async updateProduct(id, updates) {
    try {
      await window.db.products.update(id, updates);
      const index = this.products.findIndex(p => p.id === id);
      if (index !== -1) {
        this.products[index] = { ...this.products[index], ...updates };
      }
      this.notify('products');
      return this.products[index];
    } catch (error) {
      console.error('Failed to update product:', error);
      return null;
    }
  },

  async deleteProduct(id) {
    try {
      await window.db.products.delete(id);
      this.products = this.products.filter(p => p.id !== id);
      this.notify('products');
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  },

  getProduct(id) {
    return this.products.find(p => p.id === id);
  },

  // ==================== Sales CRUD ====================
  
  async addSale(sale) {
    try {
      const result = await window.db.sales.add(sale);
      this.sales.unshift(result);
      this.notify('sales');
      return result;
    } catch (error) {
      console.error('Failed to add sale:', error);
      return null;
    }
  },

  getTodaySales() {
    const today = new Date().toDateString();
    return this.sales.filter(s => new Date(s.timestamp).toDateString() === today);
  },

  getTotalRevenue() {
    return this.sales.reduce((sum, s) => sum + s.amount, 0);
  },

  // ==================== Debts CRUD ====================
  
  async addDebt(debt) {
    try {
      const result = await window.db.debts.add(debt);
      this.debts.unshift(result);
      this.notify('debts');
      return result;
    } catch (error) {
      console.error('Failed to add debt:', error);
      return null;
    }
  },

  async updateDebt(id, updates) {
    try {
      // For simple updates, we still use the markPaid endpoint for paid status
      const index = this.debts.findIndex(d => d.id === id);
      if (index !== -1) {
        this.debts[index] = { ...this.debts[index], ...updates };
      }
      this.notify('debts');
      return this.debts[index];
    } catch (error) {
      console.error('Failed to update debt:', error);
      return null;
    }
  },

  async deleteDebt(id) {
    try {
      await window.db.debts.delete(id);
      this.debts = this.debts.filter(d => d.id !== id);
      this.notify('debts');
    } catch (error) {
      console.error('Failed to delete debt:', error);
    }
  },

  async markDebtPaid(id) {
    try {
      await window.db.debts.markPaid(id);
      const index = this.debts.findIndex(d => d.id === id);
      if (index !== -1) {
        this.debts[index] = { ...this.debts[index], status: 'paid', paid_at: new Date().toISOString() };
      }
      this.notify('debts');
      return this.debts[index];
    } catch (error) {
      console.error('Failed to mark debt as paid:', error);
      return null;
    }
  },

  getPendingDebts() {
    return this.debts.filter(d => d.status !== 'paid');
  },

  getOverdueDebts() {
    return this.debts.filter(d => 
      d.status !== 'paid' && d.due_date && new Date(d.due_date) < new Date()
    );
  },

  getTotalOutstanding() {
    return this.getPendingDebts().reduce((sum, d) => sum + d.amount, 0);
  },

  getPaidThisMonth() {
    const thisMonth = new Date().getMonth();
    return this.debts
      .filter(d => d.status === 'paid' && new Date(d.paid_at).getMonth() === thisMonth)
      .reduce((sum, d) => sum + d.amount, 0);
  },

  // ==================== Stock CRUD ====================
  
  async addStock(stockItem) {
    try {
      // Set defaults
      stockItem.size = stockItem.size || '1';
      stockItem.sticker_type = stockItem.sticker_type || 'colored';
      
      // Calculate metres per roll based on size
      const baseMetresPerRoll = STOCK_CONFIG.sticker.metresPerRoll;
      const sizeMultiplier = parseFloat(stockItem.size);
      stockItem.metres_per_roll = baseMetresPerRoll * sizeMultiplier;
      stockItem.total_metres = stockItem.rolls * stockItem.metres_per_roll;
      stockItem.metres_used = 0;
      
      const result = await window.db.stock.add(stockItem);
      this.stock.unshift(result);
      this.notify('stock');
      return result;
    } catch (error) {
      console.error('Failed to add stock:', error);
      return null;
    }
  },

  async updateStock(id, updates) {
    try {
      // Handle rolls update
      if (updates.rolls !== undefined) {
        const item = this.stock.find(s => s.id === id);
        if (item) {
          updates.total_metres = updates.rolls * item.metres_per_roll;
        }
      }
      
      await window.db.stock.update(id, updates);
      const index = this.stock.findIndex(s => s.id === id);
      if (index !== -1) {
        this.stock[index] = { ...this.stock[index], ...updates };
      }
      this.notify('stock');
      return this.stock[index];
    } catch (error) {
      console.error('Failed to update stock:', error);
      return null;
    }
  },

  async deleteStock(id) {
    try {
      await window.db.stock.delete(id);
      this.stock = this.stock.filter(s => s.id !== id);
      this.notify('stock');
    } catch (error) {
      console.error('Failed to delete stock:', error);
    }
  },

  getStock(id) {
    return this.stock.find(s => s.id === id);
  },

  getStockByColor(color) {
    return this.stock.find(s => s.color.toLowerCase() === color.toLowerCase());
  },

  getStockByColorAndSize(color, size) {
    const sizeStr = size ? size.toString() : '1';
    return this.stock.find(s => 
      s.color.toLowerCase() === color.toLowerCase() && 
      s.size === sizeStr
    );
  },

  getStockByColorSizeAndType(color, size, stickerType) {
    const sizeStr = size ? size.toString() : '1';
    const type = stickerType || 'colored';
    return this.stock.find(s => 
      s.color.toLowerCase() === color.toLowerCase() && 
      s.size === sizeStr &&
      s.sticker_type === type
    );
  },

  getAvailableStockColors() {
    return this.stock
      .filter(s => this.getRemainingMetres(s.id) > 0)
      .map(s => ({ 
        id: s.id, 
        color: s.color, 
        size: s.size || '1',
        sticker_type: s.sticker_type || 'colored',
        remaining: this.getRemainingMetres(s.id) 
      }));
  },

  getRemainingMetres(id) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return 0;
    return item.total_metres - item.metres_used;
  },

  getRemainingRolls(id) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return 0;
    const remaining = this.getRemainingMetres(id);
    const metresPerRoll = item.metres_per_roll || STOCK_CONFIG.sticker.metresPerRoll;
    return Math.floor(remaining / metresPerRoll);
  },

  async deductStockMetres(id, metres) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return { success: false, error: 'Stock item not found' };
    
    const remaining = item.total_metres - item.metres_used;
    if (metres > remaining) {
      return { success: false, error: `Insufficient stock. Only ${remaining}m available.` };
    }
    
    const newMetresUsed = item.metres_used + metres;
    await this.updateStock(id, { metres_used: newMetresUsed });
    
    return { success: true, remaining: remaining - metres };
  },

  async addRollsToStock(id, additionalRolls) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return null;
    
    const newRolls = item.rolls + additionalRolls;
    const newTotalMetres = newRolls * item.metres_per_roll;
    
    await this.updateStock(id, { rolls: newRolls, total_metres: newTotalMetres });
    return this.stock.find(s => s.id === id);
  },

  getStockSummary() {
    return {
      totalItems: this.stock.length,
      totalRolls: this.stock.reduce((sum, s) => sum + s.rolls, 0),
      totalMetres: this.stock.reduce((sum, s) => sum + s.total_metres, 0),
      metresUsed: this.stock.reduce((sum, s) => sum + s.metres_used, 0),
      metresRemaining: this.stock.reduce((sum, s) => sum + (s.total_metres - s.metres_used), 0)
    };
  }
};

// Make globally available
window.Store = Store;
window.CURRENCY = CURRENCY;
window.STOCK_CONFIG = STOCK_CONFIG;
window.STICKER_TYPES = STICKER_TYPES;
window.PRODUCT_TYPES = PRODUCT_TYPES;
window.PRODUCT_COLORS = PRODUCT_COLORS;
window.PRODUCT_SIZES = PRODUCT_SIZES;

// Initialize Store when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Store.init();
});

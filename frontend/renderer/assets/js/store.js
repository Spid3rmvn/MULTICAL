/**
 * Data Store - Centralized data management
 * This module handles all data operations and can be connected to backend later
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
  // Banners can be added later
};

const Store = {
  // Currency helper
  currency: CURRENCY,

  // Stock configuration
  stockConfig: STOCK_CONFIG,

  // Data arrays
  products: [],
  sales: [],
  debts: [],
  stock: [],

  // Event listeners for data changes
  listeners: {
    products: [],
    sales: [],
    debts: [],
    stock: []
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

  // Products CRUD
  addProduct(product) {
    product.id = Date.now();
    product.created_at = new Date();
    this.products.push(product);
    this.notify('products');
    return product;
  },

  updateProduct(id, updates) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates };
      this.notify('products');
      return this.products[index];
    }
    return null;
  },

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.notify('products');
  },

  getProduct(id) {
    return this.products.find(p => p.id === id);
  },

  // Sales CRUD
  addSale(sale) {
    sale.id = Date.now();
    sale.timestamp = new Date();
    this.sales.push(sale);
    this.notify('sales');
    return sale;
  },

  getTodaySales() {
    const today = new Date().toDateString();
    return this.sales.filter(s => new Date(s.timestamp).toDateString() === today);
  },

  getTotalRevenue() {
    return this.sales.reduce((sum, s) => sum + s.amount, 0);
  },

  // Debts CRUD
  addDebt(debt) {
    debt.id = Date.now();
    debt.created_at = new Date();
    debt.status = 'pending';
    this.debts.push(debt);
    this.notify('debts');
    return debt;
  },

  updateDebt(id, updates) {
    const index = this.debts.findIndex(d => d.id === id);
    if (index !== -1) {
      this.debts[index] = { ...this.debts[index], ...updates };
      this.notify('debts');
      return this.debts[index];
    }
    return null;
  },

  deleteDebt(id) {
    this.debts = this.debts.filter(d => d.id !== id);
    this.notify('debts');
  },

  markDebtPaid(id) {
    return this.updateDebt(id, { status: 'paid', paid_date: new Date() });
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
      .filter(d => d.status === 'paid' && new Date(d.paid_date).getMonth() === thisMonth)
      .reduce((sum, d) => sum + d.amount, 0);
  },

  // ==================== Stock CRUD ====================
  
  // Add stock entry (sticker by color)
  addStock(stockItem) {
    stockItem.id = Date.now();
    stockItem.created_at = new Date();
    stockItem.type = 'sticker'; // For now, only stickers
    stockItem.metres_per_roll = STOCK_CONFIG.sticker.metresPerRoll;
    stockItem.total_metres = stockItem.rolls * stockItem.metres_per_roll;
    stockItem.metres_used = 0;
    this.stock.push(stockItem);
    this.notify('stock');
    return stockItem;
  },

  // Update stock entry
  updateStock(id, updates) {
    const index = this.stock.findIndex(s => s.id === id);
    if (index !== -1) {
      this.stock[index] = { ...this.stock[index], ...updates };
      // Recalculate total metres if rolls changed
      if (updates.rolls !== undefined) {
        this.stock[index].total_metres = this.stock[index].rolls * this.stock[index].metres_per_roll;
      }
      this.notify('stock');
      return this.stock[index];
    }
    return null;
  },

  // Delete stock entry
  deleteStock(id) {
    this.stock = this.stock.filter(s => s.id !== id);
    this.notify('stock');
  },

  // Get stock by ID
  getStock(id) {
    return this.stock.find(s => s.id === id);
  },

  // Get stock by color (case-insensitive)
  getStockByColor(color) {
    return this.stock.find(s => s.color.toLowerCase() === color.toLowerCase());
  },

  // Get all available stock colors
  getAvailableStockColors() {
    return this.stock
      .filter(s => this.getRemainingMetres(s.id) > 0)
      .map(s => ({ id: s.id, color: s.color, remaining: this.getRemainingMetres(s.id) }));
  },

  // Calculate remaining metres for a stock item
  getRemainingMetres(id) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return 0;
    return item.total_metres - item.metres_used;
  },

  // Calculate remaining whole rolls
  getRemainingRolls(id) {
    const remaining = this.getRemainingMetres(id);
    const metresPerRoll = STOCK_CONFIG.sticker.metresPerRoll;
    return Math.floor(remaining / metresPerRoll);
  },

  // Deduct metres from stock (returns true if successful)
  deductStockMetres(id, metres) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return { success: false, error: 'Stock item not found' };
    
    const remaining = item.total_metres - item.metres_used;
    if (metres > remaining) {
      return { success: false, error: `Insufficient stock. Only ${remaining}m available.` };
    }
    
    item.metres_used += metres;
    this.notify('stock');
    return { success: true, remaining: remaining - metres };
  },

  // Add more rolls to existing stock color
  addRollsToStock(id, additionalRolls) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return null;
    
    item.rolls += additionalRolls;
    item.total_metres = item.rolls * item.metres_per_roll;
    this.notify('stock');
    return item;
  },

  // Get total stock summary
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

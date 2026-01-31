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

// Product types configuration (Life Savers, Chevrons, and Stripes)
const PRODUCT_TYPES = {
  life_saver: {
    id: 'life_saver',
    name: 'Life Saver',
    description: 'Life saver reflective signs',
    badgeClass: 'bg-green-100 text-green-800'
  },
  chevron: {
    id: 'chevron',
    name: 'Chevron',
    description: 'Chevron reflective signs',
    badgeClass: 'bg-orange-100 text-orange-800'
  },
  stripes: {
    id: 'stripes',
    name: 'Stripes',
    description: 'Stripe products',
    badgeClass: 'bg-blue-100 text-blue-800'
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
  },
  white: {
    id: 'white',
    name: 'White',
    colors: ['#ffffff']
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow',
    colors: ['#eab308']
  }
};

// Product size options
const PRODUCT_SIZES = {
  '1x1': { id: '1x1', name: '1x1' },
  '1x2': { id: '1x2', name: '1x2' }
};

// Printing service types
const PRINTING_TYPES = [
  {
    id: 'one_way_vision',
    name: 'One-Way Vision',
    description: 'One-way vision stickers for windows',
    unit: 'per sqm'
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Banner printing',
    unit: 'per sqm'
  },
  {
    id: 'satin',
    name: 'Satin',
    description: 'Satin material printing',
    unit: 'per sqm'
  },
  {
    id: 'reflective',
    name: 'Reflective',
    description: 'Reflective sticker printing',
    unit: 'per sqm'
  }
];

// Material types for printing materials (non-stickers)
const MATERIAL_TYPES = [
  { id: 'banner', name: 'Banner Vinyl' },
  { id: 'satin', name: 'Satin Fabric' },
  { id: 'canvas', name: 'Canvas' },
  { id: 'backlit', name: 'Backlit Film' },
  { id: 'mesh', name: 'Mesh Banner' }
];

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
  services: [],
  serviceTransactions: [],
  printingMaterials: [],

  // Initialization flag
  initialized: false,

  // Event listeners for data changes
  listeners: {
    products: [],
    sales: [],
    debts: [],
    stock: [],
    services: [],
    serviceTransactions: [],
    printingMaterials: []
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
    
    // Notify all subscribers that data is loaded
    this.notify('products');
    this.notify('sales');
    this.notify('debts');
    this.notify('stock');
    this.notify('services');
    this.notify('serviceTransactions');
    this.notify('printingMaterials');
  },

  checkLocalStorageData() {
    try {
      const products = localStorage.getItem('multiprints_products');
      const stock = localStorage.getItem('multiprints_stock');
      const sales = localStorage.getItem('multiprints_sales');
      const debts = localStorage.getItem('multiprints_debts');
      
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
        products: JSON.parse(localStorage.getItem('multiprints_products') || '[]'),
        stock: JSON.parse(localStorage.getItem('multiprints_stock') || '[]'),
        sales: JSON.parse(localStorage.getItem('multiprints_sales') || '[]'),
        debts: JSON.parse(localStorage.getItem('multiprints_debts') || '[]')
      };
      
      await window.db.migrate(localData);
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  clearLocalStorage() {
    localStorage.removeItem('multiprints_products');
    localStorage.removeItem('multiprints_stock');
    localStorage.removeItem('multiprints_sales');
    localStorage.removeItem('multiprints_debts');
    console.log('Cleared localStorage data');
  },

  async loadFromDatabase() {
    try {
      this.products = await window.db.products.getAll();
      this.stock = await window.db.stock.getAll();
      this.sales = await window.db.sales.getAll();
      this.debts = await window.db.debts.getAll();
      this.services = await window.db.services.getAll();
      this.serviceTransactions = await window.db.serviceTransactions.getAll();
      this.printingMaterials = await window.db.printingMaterials.getAll();
      
      console.log(`Loaded: ${this.products.length} products, ${this.stock.length} stock, ${this.sales.length} sales, ${this.debts.length} debts, ${this.services.length} services, ${this.serviceTransactions.length} service transactions, ${this.printingMaterials.length} printing materials`);
    } catch (error) {
      console.error('Failed to load from database:', error);
    }
  },

  loadFromLocalStorage() {
    try {
      this.products = JSON.parse(localStorage.getItem('multiprints_products') || '[]');
      this.stock = JSON.parse(localStorage.getItem('multiprints_stock') || '[]');
      this.sales = JSON.parse(localStorage.getItem('multiprints_sales') || '[]');
      this.debts = JSON.parse(localStorage.getItem('multiprints_debts') || '[]');
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

  async deleteSale(id) {
    try {
      await window.db.sales.delete(id);
      this.sales = this.sales.filter(s => s.id !== id);
      this.notify('sales');
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  },

  async updateSale(id, updates) {
    try {
      await window.db.sales.update(id, updates);
      const index = this.sales.findIndex(s => s.id === id);
      if (index !== -1) {
        this.sales[index] = { ...this.sales[index], ...updates };
      }
      this.notify('sales');
      return this.sales[index];
    } catch (error) {
      console.error('Failed to update sale:', error);
      return null;
    }
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
      await window.db.debts.update(id, updates);
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
      
      const debt = this.debts.find(d => d.id === id);
      if (debt) {
        if (debt.sale_id) await this.loadSales();
        if (debt.service_transaction_id) await this.loadServiceTransactions();
      }

      await this.loadDebts(); // Refresh all debts to be sure
      return true;
    } catch (error) {
      console.error('Failed to mark debt as paid:', error);
      return false;
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
    return this.getPendingDebts().reduce((sum, d) => {
      const remaining = d.remaining_amount !== undefined ? d.remaining_amount : d.amount;
      return sum + remaining;
    }, 0);
  },

  getPaidThisMonth() {
    const thisMonth = new Date().getMonth();
    return this.debts
      .filter(d => d.status === 'paid' && new Date(d.paid_at).getMonth() === thisMonth)
      .reduce((sum, d) => sum + d.amount, 0);
  },

  // ==================== Debt Payments CRUD ====================

  async loadDebts() {
    try {
      this.debts = await window.db.debts.getAll();
      this.notify('debts');
    } catch (error) {
      console.error('Failed to load debts:', error);
    }
  },

  async loadSales() {
    try {
      this.sales = await window.db.sales.getAll();
      this.notify('sales');
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
  },

  async loadServiceTransactions() {
    try {
      this.serviceTransactions = await window.db.serviceTransactions.getAll();
      this.notify('serviceTransactions');
    } catch (error) {
      console.error('Failed to load service transactions:', error);
    }
  },

  async addDebtPayment(payment) {
    try {
      const result = await window.db.debtPayments.add(payment);
      // Refresh debts to get updated paid_amount and remaining_amount
      await this.loadDebts();
      return result;
    } catch (error) {
      console.error('Failed to add debt payment:', error);
      return null;
    }
  },

  async getDebtPayments(debtId) {
    try {
      return await window.db.debtPayments.getByDebt(debtId);
    } catch (error) {
      console.error('Failed to get debt payments:', error);
      return [];
    }
  },

  async deleteDebtPayment(id) {
    try {
      await window.db.debtPayments.delete(id);
      // Refresh debts to get updated paid_amount and remaining_amount
      await this.loadDebts();
    } catch (error) {
      console.error('Failed to delete debt payment:', error);
    }
  },

  async getDebtBySaleId(saleId) {
    try {
      return await window.db.debts.getBySaleId(saleId);
    } catch (error) {
      console.error('Failed to get debt by sale id:', error);
      return null;
    }
  },

  async getDebtByTransactionId(transactionId) {
    try {
      return await window.db.debts.getByTransactionId(transactionId);
    } catch (error) {
      console.error('Failed to get debt by transaction id:', error);
      return null;
    }
  },

  // ==================== Stock CRUD ====================
  
  async addStock(stockItem) {
    try {
      // Set defaults
      stockItem.size = stockItem.size || '1';
      stockItem.sticker_type = stockItem.sticker_type || 'colored';
      
      // Calculate total metres based on sticker type
      const baseMetresPerRoll = STOCK_CONFIG.sticker.metresPerRoll;
      
      if (stockItem.sticker_type === 'reflective' && stockItem.custom_metres_per_roll) {
        // For reflective with custom metres per roll
        stockItem.metres_per_roll = stockItem.custom_metres_per_roll;
        stockItem.total_metres = stockItem.rolls * stockItem.custom_metres_per_roll;
      } else {
        // For colored and clear stickers, use standard calculation: rolls × 50
        stockItem.metres_per_roll = baseMetresPerRoll;
        stockItem.total_metres = stockItem.rolls * baseMetresPerRoll;
      }
      
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

  async addRollsToStockWithCustomMetres(id, additionalRolls, metresPerRoll) {
    const item = this.stock.find(s => s.id === id);
    if (!item) return null;
    
    const newRolls = item.rolls + additionalRolls;
    const additionalMetres = additionalRolls * metresPerRoll;
    const newTotalMetres = item.total_metres + additionalMetres;
    // Recalculate average metres per roll
    const newMetresPerRoll = newTotalMetres / newRolls;
    
    await this.updateStock(id, { 
      rolls: newRolls, 
      total_metres: newTotalMetres,
      metres_per_roll: newMetresPerRoll
    });
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
  },

  // ==================== Services CRUD ====================
  
  async addService(service) {
    try {
      const result = await window.db.services.add(service);
      this.services.unshift(result);
      this.notify('services');
      return result;
    } catch (error) {
      console.error('Failed to add service:', error);
      return null;
    }
  },

  async updateService(id, updates) {
    try {
      await window.db.services.update(id, updates);
      const index = this.services.findIndex(s => s.id === id);
      if (index !== -1) {
        this.services[index] = { ...this.services[index], ...updates };
      }
      this.notify('services');
      return this.services[index];
    } catch (error) {
      console.error('Failed to update service:', error);
      return null;
    }
  },

  async deleteService(id) {
    try {
      await window.db.services.delete(id);
      this.services = this.services.filter(s => s.id !== id);
      this.notify('services');
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  },

  getService(id) {
    return this.services.find(s => s.id === id);
  },

  getActiveServices() {
    return this.services.filter(s => s.is_active === 1);
  },

  // ==================== Service Transactions CRUD ====================
  
  async addServiceTransaction(transaction) {
    try {
      // If this transaction uses stock, validate and deduct
      if (transaction.stock_id && transaction.stock_metres_used) {
        const stockItem = this.stock.find(s => s.id === transaction.stock_id);
        if (!stockItem) {
          return { success: false, error: 'Stock item not found' };
        }
        
        const remaining = stockItem.total_metres - stockItem.metres_used;
        if (transaction.stock_metres_used > remaining) {
          return { success: false, error: `Insufficient stock. Only ${remaining}m available.` };
        }
      }
      
      const result = await window.db.serviceTransactions.add(transaction);
      this.serviceTransactions.unshift(result);
      
      // Update local stock cache if stock was used
      if (transaction.stock_id && transaction.stock_metres_used) {
        const stockIndex = this.stock.findIndex(s => s.id === transaction.stock_id);
        if (stockIndex !== -1) {
          this.stock[stockIndex].metres_used += transaction.stock_metres_used;
          this.notify('stock');
        }
      }
      
      this.notify('serviceTransactions');
      return result;
    } catch (error) {
      console.error('Failed to add service transaction:', error);
      return null;
    }
  },

  getTodayServiceTransactions() {
    const today = new Date().toDateString();
    return this.serviceTransactions.filter(t => new Date(t.timestamp).toDateString() === today);
  },

  getTodayServiceEarnings() {
    return this.getTodayServiceTransactions().reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalServiceEarnings() {
    return this.serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
  },

  async deleteServiceTransaction(id) {
    try {
      await window.db.serviceTransactions.delete(id);
      this.serviceTransactions = this.serviceTransactions.filter(t => t.id !== id);
      this.notify('serviceTransactions');
    } catch (error) {
      console.error('Failed to delete service transaction:', error);
    }
  },

  async updateServiceTransaction(id, updates) {
    try {
      await window.db.serviceTransactions.update(id, updates);
      const index = this.serviceTransactions.findIndex(t => t.id === id);
      if (index !== -1) {
        this.serviceTransactions[index] = { ...this.serviceTransactions[index], ...updates };
      }
      this.notify('serviceTransactions');
      return this.serviceTransactions[index];
    } catch (error) {
      console.error('Failed to update service transaction:', error);
      return null;
    }
  },

  // ==================== Printing Materials CRUD ====================
  
  async addPrintingMaterial(material) {
    try {
      // Calculate total metres: rolls × metres_per_roll
      material.total_metres = material.rolls * material.metres_per_roll;
      material.metres_used = 0;
      
      const result = await window.db.printingMaterials.add(material);
      this.printingMaterials.unshift(result);
      this.notify('printingMaterials');
      return result;
    } catch (error) {
      console.error('Failed to add printing material:', error);
      return null;
    }
  },

  async updatePrintingMaterial(id, updates) {
    try {
      // Handle rolls update
      if (updates.rolls !== undefined) {
        const item = this.printingMaterials.find(m => m.id === id);
        if (item) {
          // Recalculate total metres using rolls × metres_per_roll
          updates.total_metres = updates.rolls * item.metres_per_roll;
        }
      }
      
      await window.db.printingMaterials.update(id, updates);
      const index = this.printingMaterials.findIndex(m => m.id === id);
      if (index !== -1) {
        this.printingMaterials[index] = { ...this.printingMaterials[index], ...updates };
      }
      this.notify('printingMaterials');
      return this.printingMaterials[index];
    } catch (error) {
      console.error('Failed to update printing material:', error);
      return null;
    }
  },

  async deletePrintingMaterial(id) {
    try {
      await window.db.printingMaterials.delete(id);
      this.printingMaterials = this.printingMaterials.filter(m => m.id !== id);
      this.notify('printingMaterials');
    } catch (error) {
      console.error('Failed to delete printing material:', error);
    }
  },

  getPrintingMaterial(id) {
    return this.printingMaterials.find(m => m.id === id);
  },

  getAvailablePrintingMaterials() {
    return this.printingMaterials
      .filter(m => (m.total_metres - m.metres_used) > 0)
      .map(m => ({
        id: m.id,
        name: m.name,
        material_type: m.material_type,
        width: m.width,
        color: m.color,
        remaining: m.total_metres - m.metres_used
      }));
  },

  async deductPrintingMaterial(id, metres) {
    const item = this.printingMaterials.find(m => m.id === id);
    if (!item) return { success: false, error: 'Material not found' };
    
    const remaining = item.total_metres - item.metres_used;
    if (metres > remaining) {
      return { success: false, error: `Insufficient material. Only ${remaining}m available.` };
    }
    
    const newMetresUsed = item.metres_used + metres;
    await this.updatePrintingMaterial(id, { metres_used: newMetresUsed });
    
    return { success: true, remaining: remaining - metres };
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
window.PRINTING_TYPES = PRINTING_TYPES;
window.MATERIAL_TYPES = MATERIAL_TYPES;

// Initialize Store when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Store.init();
});

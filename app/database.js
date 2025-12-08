/**
 * Database Module
 * SQLite database using better-sqlite3 for persistent storage
 */

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database
   * Creates tables if they don't exist
   */
  init() {
    // Get the user data path for storing the database
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'multiprints.db');
    
    console.log('Database path:', dbPath);
    
    // Open/create the database
    this.db = new Database(dbPath);
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    
    console.log('Database initialized successfully');
    return this;
  }

  /**
   * Create database tables
   */
  createTables() {
    // Products table (Life Savers, Chevrons)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        product_type TEXT NOT NULL,
        color TEXT,
        size TEXT,
        selling_price REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        min_sale_qty INTEGER NOT NULL DEFAULT 1,
        sale_unit TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stock table (Sticker rolls)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        color TEXT NOT NULL,
        size TEXT NOT NULL DEFAULT '1',
        sticker_type TEXT NOT NULL DEFAULT 'colored',
        rolls INTEGER NOT NULL DEFAULT 0,
        metres_per_roll REAL NOT NULL DEFAULT 50,
        total_metres REAL NOT NULL DEFAULT 0,
        metres_used REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sales table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        product_id INTEGER,
        stock_id INTEGER,
        product_name TEXT,
        product_type TEXT,
        sticker_type TEXT,
        quantity TEXT,
        amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        customer_name TEXT DEFAULT 'Walk-in',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE SET NULL
      )
    `);

    // Debts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT,
        amount REAL NOT NULL DEFAULT 0,
        due_date TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        unit TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Service transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER,
        service_name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        price REAL NOT NULL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        customer_name TEXT DEFAULT 'Walk-in',
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables created');
  }

  // ==================== Products CRUD ====================

  getAllProducts() {
    return this.db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  }

  getProduct(id) {
    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  }

  addProduct(product) {
    const stmt = this.db.prepare(`
      INSERT INTO products (name, product_type, color, size, selling_price, stock, min_sale_qty, sale_unit)
      VALUES (@name, @product_type, @color, @size, @selling_price, @stock, @min_sale_qty, @sale_unit)
    `);
    const result = stmt.run(product);
    return { ...product, id: result.lastInsertRowid };
  }

  updateProduct(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    stmt.run({ ...updates, id });
  }

  deleteProduct(id) {
    this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  // ==================== Stock CRUD ====================

  getAllStock() {
    return this.db.prepare('SELECT * FROM stock ORDER BY created_at DESC').all();
  }

  getStock(id) {
    return this.db.prepare('SELECT * FROM stock WHERE id = ?').get(id);
  }

  getStockByColorSizeAndType(color, size, stickerType) {
    return this.db.prepare(`
      SELECT * FROM stock 
      WHERE LOWER(color) = LOWER(?) AND size = ? AND sticker_type = ?
    `).get(color, size, stickerType);
  }

  addStock(stockItem) {
    const stmt = this.db.prepare(`
      INSERT INTO stock (color, size, sticker_type, rolls, metres_per_roll, total_metres, metres_used)
      VALUES (@color, @size, @sticker_type, @rolls, @metres_per_roll, @total_metres, @metres_used)
    `);
    const result = stmt.run(stockItem);
    return { ...stockItem, id: result.lastInsertRowid };
  }

  updateStock(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE stock SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    stmt.run({ ...updates, id });
  }

  deleteStock(id) {
    this.db.prepare('DELETE FROM stock WHERE id = ?').run(id);
  }

  // ==================== Sales CRUD ====================

  getAllSales() {
    return this.db.prepare('SELECT * FROM sales ORDER BY timestamp DESC').all();
  }

  getTodaySales() {
    return this.db.prepare(`
      SELECT * FROM sales 
      WHERE DATE(timestamp) = DATE('now', 'localtime')
      ORDER BY timestamp DESC
    `).all();
  }

  addSale(sale) {
    const stmt = this.db.prepare(`
      INSERT INTO sales (type, product_id, stock_id, product_name, product_type, sticker_type, quantity, amount, payment_method, customer_name)
      VALUES (@type, @product_id, @stock_id, @product_name, @product_type, @sticker_type, @quantity, @amount, @payment_method, @customer_name)
    `);
    const result = stmt.run({
      type: sale.type,
      product_id: sale.product_id || null,
      stock_id: sale.stock_id || null,
      product_name: sale.product_name || null,
      product_type: sale.product_type || null,
      sticker_type: sale.sticker_type || null,
      quantity: sale.quantity ? String(sale.quantity) : null,
      amount: sale.amount || 0,
      payment_method: sale.payment_method || 'cash',
      customer_name: sale.customer_name || 'Walk-in'
    });
    return { ...sale, id: result.lastInsertRowid, timestamp: new Date().toISOString() };
  }

  getTodayTotalSales() {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM sales 
      WHERE DATE(timestamp) = DATE('now', 'localtime')
    `).get();
    return result.total;
  }

  // ==================== Debts CRUD ====================

  getAllDebts() {
    return this.db.prepare('SELECT * FROM debts ORDER BY created_at DESC').all();
  }

  getPendingDebts() {
    return this.db.prepare("SELECT * FROM debts WHERE status = 'pending' ORDER BY created_at DESC").all();
  }

  addDebt(debt) {
    const stmt = this.db.prepare(`
      INSERT INTO debts (customer_name, phone, amount, due_date, description, status)
      VALUES (@customer_name, @phone, @amount, @due_date, @description, 'pending')
    `);
    const result = stmt.run({
      customer_name: debt.customer_name,
      phone: debt.phone || null,
      amount: debt.amount,
      due_date: debt.due_date || null,
      description: debt.description || null
    });
    return { ...debt, id: result.lastInsertRowid, status: 'pending', created_at: new Date().toISOString() };
  }

  markDebtPaid(id) {
    this.db.prepare("UPDATE debts SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  deleteDebt(id) {
    this.db.prepare('DELETE FROM debts WHERE id = ?').run(id);
  }

  getTotalOutstanding() {
    const result = this.db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE status = 'pending'").get();
    return result.total;
  }

  getPaidThisMonth() {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM debts 
      WHERE status = 'paid' 
      AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
    `).get();
    return result.total;
  }

  getOverdueDebts() {
    return this.db.prepare(`
      SELECT * FROM debts 
      WHERE status = 'pending' 
      AND due_date IS NOT NULL 
      AND DATE(due_date) < DATE('now')
    `).all();
  }

  // ==================== Services CRUD ====================

  getAllServices() {
    return this.db.prepare('SELECT * FROM services ORDER BY created_at DESC').all();
  }

  getActiveServices() {
    return this.db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY name').all();
  }

  getService(id) {
    return this.db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  }

  addService(service) {
    const stmt = this.db.prepare(`
      INSERT INTO services (name, description, price, unit, is_active)
      VALUES (@name, @description, @price, @unit, @is_active)
    `);
    const result = stmt.run({
      name: service.name,
      description: service.description || null,
      price: service.price || 0,
      unit: service.unit || null,
      is_active: service.is_active !== undefined ? service.is_active : 1
    });
    return { ...service, id: result.lastInsertRowid, created_at: new Date().toISOString() };
  }

  updateService(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE services SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    stmt.run({ ...updates, id });
  }

  deleteService(id) {
    this.db.prepare('DELETE FROM services WHERE id = ?').run(id);
  }

  // ==================== Service Transactions CRUD ====================

  getAllServiceTransactions() {
    return this.db.prepare('SELECT * FROM service_transactions ORDER BY timestamp DESC').all();
  }

  getTodayServiceTransactions() {
    return this.db.prepare(`
      SELECT * FROM service_transactions 
      WHERE DATE(timestamp) = DATE('now', 'localtime')
      ORDER BY timestamp DESC
    `).all();
  }

  addServiceTransaction(transaction) {
    const stmt = this.db.prepare(`
      INSERT INTO service_transactions (service_id, service_name, quantity, price, amount, payment_method, customer_name, notes)
      VALUES (@service_id, @service_name, @quantity, @price, @amount, @payment_method, @customer_name, @notes)
    `);
    const result = stmt.run({
      service_id: transaction.service_id || null,
      service_name: transaction.service_name,
      quantity: transaction.quantity || 1,
      price: transaction.price || 0,
      amount: transaction.amount || 0,
      payment_method: transaction.payment_method || 'cash',
      customer_name: transaction.customer_name || 'Walk-in',
      notes: transaction.notes || null
    });
    return { ...transaction, id: result.lastInsertRowid, timestamp: new Date().toISOString() };
  }

  getTodayTotalServiceEarnings() {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM service_transactions 
      WHERE DATE(timestamp) = DATE('now', 'localtime')
    `).get();
    return result.total;
  }

  getTotalServiceEarnings() {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM service_transactions
    `).get();
    return result.total;
  }

  // ==================== Migration from localStorage ====================

  migrateFromLocalStorage(localStorageData) {
    console.log('Migrating data from localStorage...');
    
    const transaction = this.db.transaction(() => {
      // Migrate products
      if (localStorageData.products && localStorageData.products.length > 0) {
        const insertProduct = this.db.prepare(`
          INSERT INTO products (name, product_type, color, size, selling_price, stock, min_sale_qty, sale_unit)
          VALUES (@name, @product_type, @color, @size, @selling_price, @stock, @min_sale_qty, @sale_unit)
        `);
        
        for (const product of localStorageData.products) {
          insertProduct.run({
            name: product.name,
            product_type: product.product_type || 'life_saver',
            color: product.color || null,
            size: product.size || null,
            selling_price: product.selling_price || 0,
            stock: product.stock || 0,
            min_sale_qty: product.min_sale_qty || 1,
            sale_unit: product.sale_unit || null
          });
        }
        console.log(`Migrated ${localStorageData.products.length} products`);
      }

      // Migrate stock
      if (localStorageData.stock && localStorageData.stock.length > 0) {
        const insertStock = this.db.prepare(`
          INSERT INTO stock (color, size, sticker_type, rolls, metres_per_roll, total_metres, metres_used)
          VALUES (@color, @size, @sticker_type, @rolls, @metres_per_roll, @total_metres, @metres_used)
        `);
        
        for (const item of localStorageData.stock) {
          insertStock.run({
            color: item.color,
            size: item.size || '1',
            sticker_type: item.sticker_type || 'colored',
            rolls: item.rolls || 0,
            metres_per_roll: item.metres_per_roll || 50,
            total_metres: item.total_metres || 0,
            metres_used: item.metres_used || 0
          });
        }
        console.log(`Migrated ${localStorageData.stock.length} stock items`);
      }

      // Migrate sales
      if (localStorageData.sales && localStorageData.sales.length > 0) {
        const insertSale = this.db.prepare(`
          INSERT INTO sales (type, product_name, product_type, sticker_type, quantity, amount, payment_method, customer_name, timestamp)
          VALUES (@type, @product_name, @product_type, @sticker_type, @quantity, @amount, @payment_method, @customer_name, @timestamp)
        `);
        
        for (const sale of localStorageData.sales) {
          insertSale.run({
            type: sale.type || 'product',
            product_name: sale.product_name || null,
            product_type: sale.product_type || null,
            sticker_type: sale.sticker_type || null,
            quantity: sale.quantity ? String(sale.quantity) : null,
            amount: sale.amount || 0,
            payment_method: sale.payment_method || 'cash',
            customer_name: sale.customer_name || 'Walk-in',
            timestamp: sale.timestamp || new Date().toISOString()
          });
        }
        console.log(`Migrated ${localStorageData.sales.length} sales`);
      }

      // Migrate debts
      if (localStorageData.debts && localStorageData.debts.length > 0) {
        const insertDebt = this.db.prepare(`
          INSERT INTO debts (customer_name, phone, amount, due_date, description, status)
          VALUES (@customer_name, @phone, @amount, @due_date, @description, @status)
        `);
        
        for (const debt of localStorageData.debts) {
          insertDebt.run({
            customer_name: debt.customer_name,
            phone: debt.phone || null,
            amount: debt.amount || 0,
            due_date: debt.due_date || null,
            description: debt.description || null,
            status: debt.status || 'pending'
          });
        }
        console.log(`Migrated ${localStorageData.debts.length} debts`);
      }
    });

    transaction();
    console.log('Migration completed!');
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = new DatabaseManager();

const { ipcMain, app, dialog, BrowserWindow } = require('electron');
const config = require('../../electron.config');
const database = require('../../database');

/**
 * IPC Handlers - Handle messages from renderer process
 */

// App information
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

// ==================== Products ====================

ipcMain.handle('db:products:getAll', () => {
  return database.getAllProducts();
});

ipcMain.handle('db:products:get', (event, id) => {
  return database.getProduct(id);
});

ipcMain.handle('db:products:add', (event, product) => {
  return database.addProduct(product);
});

ipcMain.handle('db:products:update', (event, id, updates) => {
  database.updateProduct(id, updates);
  return { success: true };
});

ipcMain.handle('db:products:delete', (event, id) => {
  database.deleteProduct(id);
  return { success: true };
});

// ==================== Stock ====================

ipcMain.handle('db:stock:getAll', () => {
  return database.getAllStock();
});

ipcMain.handle('db:stock:get', (event, id) => {
  return database.getStock(id);
});

ipcMain.handle('db:stock:getByColorSizeType', (event, color, size, stickerType) => {
  return database.getStockByColorSizeAndType(color, size, stickerType);
});

ipcMain.handle('db:stock:add', (event, stockItem) => {
  return database.addStock(stockItem);
});

ipcMain.handle('db:stock:update', (event, id, updates) => {
  database.updateStock(id, updates);
  return { success: true };
});

ipcMain.handle('db:stock:delete', (event, id) => {
  database.deleteStock(id);
  return { success: true };
});

// ==================== Sales ====================

ipcMain.handle('db:sales:getAll', () => {
  return database.getAllSales();
});

ipcMain.handle('db:sales:getToday', () => {
  return database.getTodaySales();
});

ipcMain.handle('db:sales:add', (event, sale) => {
  return database.addSale(sale);
});

ipcMain.handle('db:sales:getTodayTotal', () => {
  return database.getTodayTotalSales();
});

// ==================== Debts ====================

ipcMain.handle('db:debts:getAll', () => {
  return database.getAllDebts();
});

ipcMain.handle('db:debts:getPending', () => {
  return database.getPendingDebts();
});

ipcMain.handle('db:debts:add', (event, debt) => {
  return database.addDebt(debt);
});

ipcMain.handle('db:debts:markPaid', (event, id) => {
  database.markDebtPaid(id);
  return { success: true };
});

ipcMain.handle('db:debts:delete', (event, id) => {
  database.deleteDebt(id);
  return { success: true };
});

ipcMain.handle('db:debts:getTotalOutstanding', () => {
  return database.getTotalOutstanding();
});

ipcMain.handle('db:debts:getPaidThisMonth', () => {
  return database.getPaidThisMonth();
});

ipcMain.handle('db:debts:getOverdue', () => {
  return database.getOverdueDebts();
});

// ==================== Services ====================

ipcMain.handle('db:services:getAll', () => {
  return database.getAllServices();
});

ipcMain.handle('db:services:getActive', () => {
  return database.getActiveServices();
});

ipcMain.handle('db:services:get', (event, id) => {
  return database.getService(id);
});

ipcMain.handle('db:services:add', (event, service) => {
  return database.addService(service);
});

ipcMain.handle('db:services:update', (event, id, updates) => {
  database.updateService(id, updates);
  return { success: true };
});

ipcMain.handle('db:services:delete', (event, id) => {
  database.deleteService(id);
  return { success: true };
});

// ==================== Service Transactions ====================

ipcMain.handle('db:serviceTransactions:getAll', () => {
  return database.getAllServiceTransactions();
});

ipcMain.handle('db:serviceTransactions:getToday', () => {
  return database.getTodayServiceTransactions();
});

ipcMain.handle('db:serviceTransactions:add', (event, transaction) => {
  return database.addServiceTransaction(transaction);
});

ipcMain.handle('db:serviceTransactions:getTodayTotal', () => {
  return database.getTodayTotalServiceEarnings();
});

ipcMain.handle('db:serviceTransactions:getTotal', () => {
  return database.getTotalServiceEarnings();
});

// ==================== Migration ====================

ipcMain.handle('db:migrate', (event, localStorageData) => {
  try {
    database.migrateFromLocalStorage(localStorageData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== Window Controls ====================

ipcMain.on('window:minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) window.minimize();
});

ipcMain.on('window:maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on('window:close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) window.close();
});

// ==================== File Dialogs ====================

ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    ...options
  });
  return result;
});

ipcMain.handle('dialog:openDirectory', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    ...options
  });
  return result;
});

module.exports = {};

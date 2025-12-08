const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Securely exposes APIs to renderer
 * Using contextBridge for security
 */

// API exposed to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Application info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // File system
  selectFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  selectDirectory: (options) => ipcRenderer.invoke('dialog:openDirectory', options),
});

// Database API exposed to renderer
contextBridge.exposeInMainWorld('db', {
  // ==================== Products ====================
  products: {
    getAll: () => ipcRenderer.invoke('db:products:getAll'),
    get: (id) => ipcRenderer.invoke('db:products:get', id),
    add: (product) => ipcRenderer.invoke('db:products:add', product),
    update: (id, updates) => ipcRenderer.invoke('db:products:update', id, updates),
    delete: (id) => ipcRenderer.invoke('db:products:delete', id)
  },
  
  // ==================== Stock ====================
  stock: {
    getAll: () => ipcRenderer.invoke('db:stock:getAll'),
    get: (id) => ipcRenderer.invoke('db:stock:get', id),
    getByColorSizeType: (color, size, stickerType) => 
      ipcRenderer.invoke('db:stock:getByColorSizeType', color, size, stickerType),
    add: (stockItem) => ipcRenderer.invoke('db:stock:add', stockItem),
    update: (id, updates) => ipcRenderer.invoke('db:stock:update', id, updates),
    delete: (id) => ipcRenderer.invoke('db:stock:delete', id)
  },
  
  // ==================== Sales ====================
  sales: {
    getAll: () => ipcRenderer.invoke('db:sales:getAll'),
    getToday: () => ipcRenderer.invoke('db:sales:getToday'),
    add: (sale) => ipcRenderer.invoke('db:sales:add', sale),
    getTodayTotal: () => ipcRenderer.invoke('db:sales:getTodayTotal')
  },
  
  // ==================== Debts ====================
  debts: {
    getAll: () => ipcRenderer.invoke('db:debts:getAll'),
    getPending: () => ipcRenderer.invoke('db:debts:getPending'),
    add: (debt) => ipcRenderer.invoke('db:debts:add', debt),
    markPaid: (id) => ipcRenderer.invoke('db:debts:markPaid', id),
    delete: (id) => ipcRenderer.invoke('db:debts:delete', id),
    getTotalOutstanding: () => ipcRenderer.invoke('db:debts:getTotalOutstanding'),
    getPaidThisMonth: () => ipcRenderer.invoke('db:debts:getPaidThisMonth'),
    getOverdue: () => ipcRenderer.invoke('db:debts:getOverdue')
  },
  
  // ==================== Migration ====================
  migrate: (localStorageData) => ipcRenderer.invoke('db:migrate', localStorageData)
});

// Notify main process that preload is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
});

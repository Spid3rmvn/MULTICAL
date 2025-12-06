const { ipcMain, app, dialog, BrowserWindow } = require('electron');
const config = require('../../electron.config');

/**
 * IPC Handlers - Handle messages from renderer process
 */

// App information
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

// Backend URL
ipcMain.handle('backend:url', () => {
  const { protocol, host, port } = config.backend;
  return `${protocol}://${host}:${port}`;
});

// Backend health check
ipcMain.handle('backend:health', async () => {
  const { protocol, host, port } = config.backend;
  const url = `${protocol}://${host}:${port}/api/v1/health`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { status: 'healthy', data };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
});

// Window controls
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

// File dialogs
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

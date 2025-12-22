const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const config = require('../electron.config');
const { createMenu } = require('./menu');
const database = require('../database');

// Keep a global reference of the window object
let mainWindow = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    title: config.window.title,
    show: config.window.show,
    center: config.window.center,
    frame: config.window.frame,
    titleBarStyle: config.window.titleBarStyle,
    backgroundColor: config.window.backgroundColor,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: config.webPreferences.nodeIntegration,
      contextIsolation: config.webPreferences.contextIsolation,
      sandbox: false, // Required for better-sqlite3
      webSecurity: config.webPreferences.webSecurity
    }
  });

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (process.argv.includes('--dev') && config.development.openDevTools) {
      mainWindow.webContents.openDevTools({ 
        mode: config.development.devToolsPosition 
      });
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu(mainWindow);
}

// App lifecycle events
app.whenReady().then(() => {
  // Initialize database
  database.init();
  
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Close database connection before quitting
  database.close();
});

// IPC Handlers
require('./handlers');

// Export for testing
module.exports = { createWindow, mainWindow, database };

